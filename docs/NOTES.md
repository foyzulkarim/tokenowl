# POC Findings: Claude Code Observation Layer

## What this document is

This is the output of a one-session POC (run 2026-04-26) to answer five foundational questions before designing an observation system for Claude Code. The goal of that system is to monitor Claude Code usage, identify recurring patterns, and propose deterministic replacements (skills, hooks, MCPs) that reduce unnecessary API token consumption.

The POC was deliberately under-engineered: a Node.js HTTP receiver on port 7777, hook config in `~/.claude/settings.json`, a SQLite event store, and a handful of read-only analysis scripts. Nothing here is intended to ship.

**This document is the deliverable.** Bring it back to the architecture session.

---

## Setup used

- **Claude Code version:** 2.1.x (current as of 2026-04-26)
- **Receiver:** Node.js HTTP server, `better-sqlite3`, single table `events(id, received_at, event_type, session_id, payload_json)`
- **Hooks:** All valid hook types registered globally in `~/.claude/settings.json`, forwarding via `curl` to `http://127.0.0.1:7777/hook`
- **Existing data analysed:** 47 sessions across 11 projects from `~/.claude/projects/`

---

## Q1: What is actually in each hook event payload?

### Hook types that exist (confirmed via schema + live capture)

27 valid hook types in the schema. Of these, the following fired during normal use:

| Hook type | When it fires | Key extra fields |
|---|---|---|
| `SessionStart` | Session begins or resumes | `source` ("startup"/"resume"/"clear"/"compact"), `model` |
| `SessionEnd` | Session terminates | `reason` ("prompt_input_exit", "clear", "logout", etc.) |
| `UserPromptSubmit` | User submits a prompt | `prompt` (full text) |
| `PreToolUse` | Before a tool executes | `tool_name`, `tool_input`, `tool_use_id` |
| `PermissionRequest` | Permission dialog appears | `tool_name`, `tool_input`, `permission_suggestions` |
| `PostToolUse` | After a tool succeeds | `tool_name`, `tool_input`, `tool_response`, `tool_use_id` |
| `Stop` | Claude finishes responding | `stop_hook_active`, `last_assistant_message` |
| `SubagentStop` | Subagent finishes | `agent_id`, `agent_type`, `agent_transcript_path`, `last_assistant_message` |
| `Notification` | Claude sends a notification | `message`, `notification_type` ("idle_prompt", etc.) |

### Fields present on ALL events

```
session_id         — unique per session (UUID)
transcript_path    — absolute path to the session's JSONL file
cwd                — working directory at time of event
hook_event_name    — the event type name
permission_mode    — "default", "plan", "auto", etc. (most events)
```

### Hook types not yet observed (require specific conditions)

`Setup`, `InstructionsLoaded`, `StopFailure`, `PostToolUseFailure`, `SubagentStart`, `TaskCreated`, `TaskCompleted`, `TeammateIdle`, `ConfigChange`, `CwdChanged`, `FileChanged`, `PreCompact`, `PostCompact`, `WorktreeCreate`, `WorktreeRemove`, `Elicitation`, `ElicitationResult`

### Corrections to pre-POC assumptions

- **Token usage is NOT in hook payloads** — confirmed. Lives in transcript JSONL files only.
- **`UserPromptExpansion` and `PostToolBatch`** — documented but the settings.json schema validator rejects them. Do not register.
- **`Setup`** — in schema but not in docs. Unknown trigger condition.
- **`last_assistant_message`** — was reportedly removed in 2.0.37. It is present and working in 2.1.x.
- **`agent_transcript_path`** — IS present in `SubagentStop` hook payload. You do not need to derive it.

---

## Q2: What is actually in the transcript JSONL files?

Each session is a JSONL file at:
```
~/.claude/projects/<encoded-cwd>/<session-uuid>.jsonl
```

Subagent transcripts live at:
```
~/.claude/projects/<encoded-cwd>/<session-uuid>/subagents/agent-<id>.jsonl
```

### Entry types

| Type | Notes |
|---|---|
| `user` | User message. `content` is a string or array of content blocks. Has `isMeta: true` for system-injected messages. |
| `assistant` | Claude response. Always has `message.usage`. Has `message.content` array with `text`, `tool_use`, and `thinking` blocks. |
| `system` | Local command execution (e.g. slash commands). |
| `file-history-snapshot` | File state checkpoint used for undo. Not relevant for cost analysis. |
| `last-prompt` | Stores the last user prompt for session resume. |
| `permission-mode` | Records permission mode changes. |

### The `usage` object — always present on assistant messages

```json
{
  "input_tokens": 3,
  "output_tokens": 25,
  "cache_creation_input_tokens": 17055,
  "cache_read_input_tokens": 11390,
  "cache_creation": {
    "ephemeral_5m_input_tokens": 0,
    "ephemeral_1h_input_tokens": 17055
  },
  "service_tier": "standard",
  "inference_geo": "not_available"
}
```

**Confirmed:** `usage` is present on 100% of assistant messages across all sessions examined. Never absent.

### Key fields on every entry

```
session_id     — matches hook event session_id
timestamp      — ISO 8601
type           — entry type (user/assistant/system/etc.)
isSidechain    — true for subagent thread entries; false for main thread
uuid           — unique entry ID
parentUuid     — forms the conversation tree
version        — Claude Code version that wrote this entry
cwd            — working directory
gitBranch      — current git branch at time of entry
```

### Surprising fields worth noting

- `slug` — human-readable session name (e.g. `"wobbly-sauteeing-cat"`)
- `requestId` — Anthropic API request ID on assistant messages
- `thinking` content blocks include a `signature` field (encoded extended thinking)
- `isMeta: true` on user entries that are system-injected (slash command outputs, etc.) — exclude these when computing "real" prompts

### File sizes observed

- Short sessions: 2–50 KB
- Medium sessions: 50–200 KB
- Long sessions: up to 525 KB
- Lines per file: 80–207 entries for typical sessions

---

## Q3: Do HTTP hooks fire reliably?

**Yes.** During this POC session:
- No dropped events observed
- No errors in `data/errors.log`
- No degradation to Claude Code experience
- Hook arrival latency appears sub-second (async, non-blocking)

The `async: true` flag on hooks is essential — without it, hooks block the Claude Code response cycle. With it, they fire in the background and Claude Code is unaffected even if the receiver is slow or down.

**Failure behaviour:** If the receiver is not running, `curl` fails silently after 3 seconds (the `--max-time 3` timeout). Claude Code continues normally. No errors are surfaced to the user.

---

## Q4: How do concurrent Claude Code sessions behave?

**Cleanly.** Observed two sessions running simultaneously:
- `session_id` values are unique UUIDs — no collisions
- Events from different sessions interleave in the receiver without issue
- Each event carries its own `session_id` and `transcript_path`, so attribution is unambiguous
- `Stop` and `SessionEnd` events reliably close out the correct session

The timeline of a two-session overlap looked exactly as expected:
```
05:54:46  SessionStart   session-B
05:55:06  Notification   session-A   (idle)
05:55:15  UserPromptSubmit  session-B
05:56:32  UserPromptSubmit  session-B
05:56:34  Stop           session-B
05:56:37  SessionEnd     session-B
05:57:01  UserPromptSubmit  session-A
```

No chaos. Clean attribution throughout.

---

## Q5: What does the actual workload look like?

### Token profile (47 sessions, all projects)

| Metric | Value |
|---|---|
| Total input tokens | 38,684,688 |
| Total output tokens | 504,183 |
| Total cache creation | 7,982,507 |
| Total cache reads | 94,810,395 |
| **Overall cache hit rate** | **67%** |

Cache hit rate varies widely by session:
- Long focused sessions: 90–95% hit rate
- Sessions after `/clear` or fresh starts: 25–45% hit rate

Output tokens are tiny relative to everything else. The cost driver is **cache creation and input tokens**, not output.

### Tool call frequency (47 sessions)

| Tool | Calls |
|---|---|
| Read | 411 |
| Bash | 359 |
| Edit | 222 |
| Write | 159 |
| Glob | 90 |
| Agent | 43 |
| Grep | 43 |
| TaskUpdate | 33 |
| TaskCreate | 16 |
| ToolSearch | 11 |
| Skill | 9 |

`Read` + `Bash` + `Edit` account for ~70% of all tool calls. These are the primary candidates for pattern analysis.

### Most expensive sessions

| Session | Input | Cache Read | Cache Hit | Tool Calls |
|---|---|---|---|---|
| llm-lens (12.5M total) | 12.5M | 11.3M | 46.5% | 128 |
| agentic-swe (7.3M total) | 7.3M | 7.5M | 49% | 125 |
| .claude dir (7.6M total) | 11K | 7.6M | 91.8% | 69 |

The sessions with very high cache hit rates (91–95%) tend to be long focused sessions with many `/clear` checkpoints — the cache is warm across the whole session.

---

## Schema decisions for the real system

Based on POC findings, here is what the real system's data model should look like:

### Core tables

**`sessions`** — one row per `SessionStart` event
```sql
session_id TEXT PRIMARY KEY,
started_at TEXT,
ended_at TEXT,
project TEXT,          -- derived from transcript_path
model TEXT,            -- from SessionStart payload
source TEXT,           -- "startup" / "resume" / "clear" / "compact"
end_reason TEXT        -- from SessionEnd payload
```

**`events`** — raw hook events (keep forever, it's cheap)
```sql
id INTEGER PRIMARY KEY,
received_at TEXT,
event_type TEXT,
session_id TEXT,
payload_json TEXT
```

**`session_costs`** — aggregated from transcript JSONL, computed on SessionEnd
```sql
session_id TEXT PRIMARY KEY,
input_tokens INTEGER,
output_tokens INTEGER,
cache_creation_tokens INTEGER,
cache_read_tokens INTEGER,
cache_hit_rate REAL,
total_tool_calls INTEGER,
assistant_turns INTEGER
```

**`tool_calls`** — from PreToolUse events, for pattern analysis
```sql
id INTEGER PRIMARY KEY,
session_id TEXT,
tool_name TEXT,
tool_input_json TEXT,
tool_use_id TEXT,
fired_at TEXT
```

### Key design decisions

1. **Join key is `session_id`** — present on all hook events and all transcript entries. This is the spine of everything.

2. **Token costs come from transcripts, not hooks** — read the JSONL on `SessionEnd`, aggregate `usage` across all `assistant` entries where `isSidechain = false`.

3. **Exclude sidechain entries** for main-thread cost accounting. Subagent costs live in their own transcripts and should be attributed separately via `agent_transcript_path` from `SubagentStop`.

4. **Cache hit rate formula:**
   ```
   cache_read / (input + cache_creation + cache_read)
   ```

5. **First user prompt** — find the first `user` entry in the transcript where `isMeta != true` and `isSidechain = false`. Use `content` as a string or the first `text` block from the content array.

6. **Pattern detection unit** — `(tool_name, normalized_tool_input)` pairs from `PreToolUse` events. Normalization means stripping dynamic values (file contents, timestamps) while keeping structural shape (file paths, command patterns).

---

## What to build next

The POC confirms the architecture is sound. The next phase should:

1. **Build the transcript reader** — on `SessionEnd`, read the JSONL, compute token totals, write to `session_costs`. This is the most valuable single piece.

2. **Build the pattern detector** — group `PreToolUse` sequences by `(tool_name, input_shape)` across sessions. Flag sequences that appear in >3 sessions with low variance as "repetitive".

3. **Build the cost attributor** — join sessions to their first real `UserPromptSubmit` prompt and the project name for human-readable labelling.

4. **Build the proposer** — for high-frequency, low-variance tool patterns: propose a skill, hook, or MCP replacement. This is the actual value delivery.

The receiver and hook config from this POC can be used as-is for phase 1. No need to rebuild.
