# TokenOwl: UX Specification

**Companion to:** PROPOSAL.md (requirements), NOTES.md (POC findings)
**Status:** UX shape finalized; architecture and data model conversation pending.
**Scope:** What the UI is, how it's organized, where AI sits in it, and how the user drives the system. No React code, no visual design, no component-level decisions.

---

## 1. Framing

TokenOwl is a **local full-stack web app**, single-user, running on the user's own machines. The transcript JSONL files in `~/.claude/projects/` are the source of truth; the app reads from them, builds derived tables in SQLite, and presents the result through a multi-page UI with deeply integrated AI assistance.

The UX is shaped by four decisions taken before this spec was written:

1. **More UI is better** than fewer pages. Routing room is a feature; surfaces can be split later without restructuring.
2. **No fixed review cadence.** The dashboard reflects current data on the user's machines whenever opened. No assumption of a "Monday morning weekly review."
3. **No auto-runs in V1.** Every pipeline run is user-triggered. Full control and full visibility take precedence over automation.
4. **AI is woven throughout, not bolted on.** Both contextual ✨ buttons and a dedicated Chat page are part of the V1 surface, even if their implementations are phased.

---

## 2. Page set

Ten pages total. Eight in the sidebar; Session Detail and Proposal Detail are reached via click-through.

### 2.1 Dashboard *(landing page)*

The orientation surface. Single screen overview of the current state of the user's data, with a time window toggle (past day, past week, past month, custom).

**Sections, top to bottom:**

- **Headline numbers.** Total spend in dollars; total tokens broken into input / output / cache creation / cache read; cache hit rate; session count. Each with a delta vs. the previous comparable window.
- **Spend over time.** Time-series chart of daily cost across the window.
- **Where the money went.** Three small breakdowns side by side: by project, by model, by machine. Ranked lists with bars.
- **Actionable insights strip.** Top 3–5 proposals across all lenses, surfaced by projected savings impact. Each is a one-line teaser with a "View" affordance into the Proposals page. This is the bridge from "look at data" to "do something about it."
- **Recent sessions.** Last 5–10 sessions with human-readable label (first real user prompt), cost, click-through to Session Detail.

**AI surfaces:**

- ✨ **"Brief me"** — generates a 2–3 paragraph narrative summary of the visible window from dashboard data.
- ✨ next to actionable insights — "Why these proposals?" — explains the ranking.

**Controls:**

- "Refresh now" — runs ingest + pattern detection + (configurably) proposal synthesis.
- Time window toggle.
- Global filter bar applies (project, machine).

The dashboard does **not** let the user act on proposals. It surfaces them; action happens on the Proposals page.

---

### 2.2 Sessions

Filterable, sortable list of all captured sessions.

**Filters:** time range, project, machine, model, cache hit band, cost band.
**Columns:** label (first real prompt, truncated), project, machine, model, started_at, duration, total cost, cache hit rate, tool call count.
**Sort by** any column.

**AI surfaces:**

- ✨ **"Find sessions like…"** — natural language search over prompts and assistant messages (RAG).

**Controls:**

- "Re-ingest now" — picks up new transcripts.

Click a row → Session Detail.

---

### 2.3 Session Detail *(reached from Sessions; not in sidebar)*

Full drill-down for a single session. UI goes all the way to raw turn content; the user does not need to query SQLite to inspect any aspect of a session.

**Sections, top to bottom:**

- **Header.** Label, project, machine, model, started_at / ended_at, end reason, total cost, cache hit rate.
- **Cost breakdown.** Input / output / cache creation / cache read tokens with dollar amounts per category.
- **Turn-by-turn timeline.** Chronological list of user prompts, assistant responses, tool calls (PreToolUse → PostToolUse pairs), and notifications. Each turn shows incremental token cost. Expandable to show full prompt text, full tool input, full tool output, full assistant message including thinking blocks.
- **Tool call summary.** Aggregate counts by tool name for this session.
- **Subagent activity.** If subagents fired, list them with click-through to their own transcripts (treated as nested session details).
- **Related proposals.** Any proposals citing this session as evidence.

**AI surfaces:**

- ✨ **"Summarise this session"** — header-level summary: what the user was trying to do, what happened, where the cost went.
- ✨ next to cost breakdown — "Why was this session expensive?" — narrative explanation of cost drivers.
- ✨ next to turn-by-turn timeline — "Where did this session go off-track?" — picks out the turn(s) where token consumption spiked or work became repetitive.
- ✨ next to subagent activity — "Was this subagent worth it?" — compares subagent cost to whether its output influenced later turns.

---

### 2.4 Proposals

The action surface. Where the lens framework lives.

**Two-pane layout:**

- **Left rail — lens navigation.** List of analytical lenses with active proposal counts. "All lenses" view at the top. Each lens row has a "Re-synthesise this lens" control.
- **Main pane — proposal list.** Filterable by state, by lens (when "All lenses" selected), by project, by machine, by date range. Sortable by projected impact, recency, evidence strength.

**Quick actions per row:** state transition (accept / reject / defer / archive) with optional note prompt.

**AI surfaces:**

- ✨ per row — **"Explain in one line"** for quick triage.
- ✨ at the lens-rail level — **"Suggest a new lens"** — looks at patterns the existing lenses don't cover, proposes a lens definition.

**Controls:**

- Per-lens "Re-synthesise this lens."

Click a proposal → Proposal Detail.

---

### 2.5 Proposal Detail *(reached from Proposals; not in sidebar)*

Full evidence view for one proposal.

**Sections:**

- **Summary.** Lens that produced it, pattern observed, projected impact, current state.
- **Evidence.** Sessions / turns / tool sequences cited, each click-through to Session Detail.
- **Suggestion.** Prose description of the proposed change.
- **Draft implementation.** Code/config snippet where applicable, copyable.
- **State & history.** Current state plus chronological log of state changes, each with optional note. State transitions trigger a note prompt.
- **Effectiveness panel** *(only when state = integrated or beyond).* Before/after comparison on the relevant pattern: frequency, cost attributed, cache hit rate. Surfaces validated / ineffective / still-gathering verdict.
- **Provenance.** Which lens produced this proposal, which prompt version, which run. Click-through to the Runs page entry.

**AI surfaces:**

- ✨ **"Draft the integration"** — generates the actual skill / hook / MCP code adapted to the user's specific setup.
- ✨ **"Draft a state-change note"** — given the proposal and the user's decision, writes the note. Saves typing, produces consistent AI-readable notes.
- ✨ **"Counter-argument"** — steelmans the case against this proposal. Catches lens overconfidence.

**Controls:**

- "Re-synthesise this proposal" — useful when the lens prompt has changed; old version remains in history.

---

### 2.6 Patterns

Deterministic findings not yet promoted to proposals. The "browse the raw signal" surface.

**List sorted by** frequency, total cost, projected savings. Filters by project, machine, time range.
**Per-pattern display:** how many sessions it appears in, total cost, variance, example invocations, click-through to constituent sessions.

This page exists because pattern detection is deterministic and proposal synthesis is LLM-driven. Patterns may exist that the LLM hasn't synthesised (failed run, below threshold, lens not yet written). They're still real signal and worth surfacing.

**AI surfaces:**

- ✨ per pattern — **"Synthesise a proposal from this pattern"** — manually triggers LLM synthesis for one pattern across all eligible lenses.
- ✨ per pattern — **"Is this worth a proposal?"** — mini-analysis on whether the pattern meets the bar for surfacing.
- ✨ at the page level — **"Cluster these patterns"** — groups related patterns that might share a single replacement.

**Controls:**

- "Re-detect patterns now."

---

### 2.7 Effectiveness

All integrated proposals with their before/after metrics and verdicts. Standalone roll-up; complements the per-proposal effectiveness panel on Proposal Detail.

**Filters:** by lens, by project, by verdict (validated / ineffective / still gathering).
**Per-proposal display:** before/after cost on relevant pattern, before/after frequency, current verdict, time since integration.

**AI surfaces:**

- ✨ per ineffective proposal — **"Why didn't this work?"** — analyses post-integration data, hypothesises why the change didn't reduce cost.
- ✨ per validated proposal — **"Generalise from my wins"** — looks at what worked, suggests adjacent proposals.

**Controls:**

- "Recompute effectiveness" (page-level).
- "Recompute for this proposal" (per row).

---

### 2.8 Chat

Full-page conversation with an AI scoped to TokenOwl's derived data. **Not** the raw transcript JSONL — costs, tool call summaries, normalised patterns, proposal evidence, state history, effectiveness verdicts only. The raw layer remains the substrate; the AI surfaces query the derived tables.

**Layout:**

- **Main chat pane.** Conversation with RAG access to derived data and MCP access to query the SQLite directly when needed.
- **Conversation history sidebar.** Past chats, named by their first question, persisted.
- **Scope picker.** Optionally constrain the AI's RAG context to a project, machine, time range, or specific sessions/proposals. Defaults to "everything."
- **Suggested prompts.** Starter questions on a fresh chat: "What changed this week?", "Where is my biggest unaddressed cost driver?", "Which lens has been most valuable?", "Are there projects I should stop using Claude Code for?"
- **Citations.** Every AI claim links back to underlying sessions/proposals/patterns. Same principle as proposal evidence: nothing unsourced.
- **Promote to proposal.** Button that turns a chat finding into a draft proposal entering the proposal pipeline. Closes the loop between exploration and action.

---

### 2.9 Runs

Chronological log of every pipeline run ever triggered. Where "what is happening / what happened" lives.

**Per-run display:** which stage, when triggered, triggered from where (which page/button), duration, status (succeeded / failed / queued / running / cancelled), output summary (rows written, proposals produced, errors), full log on click-through.

**Stable `run_id`** for every run, linked from proposals (`synthesised_in_run_X`), patterns, and effectiveness verdicts. Full traceability from any artifact back to the run that produced it.

Filter by stage, status, time range.

---

### 2.10 Settings

Operational and configuration surface.

**Sections:**

- **Pipeline status & manual triggers.** Per-stage last-run timestamps, durations, errors. Manual "Run now" buttons per stage. Global "Run full pipeline" button.
- **Capture status per machine.** Which machines are reporting, when each last ingested, any errors.
- **Lens display.** Read-only list of lenses. Each shows name, description, current prompt (rendered), filter rule, last run, count of proposals produced, count by state. **Lenses are defined in code-as-files, version-controlled. Editing requires editing the repo and restarting the app.** No UI editor in V1.
- **Ingestion controls.** Re-ingest a project, re-ingest a date range, force a recompute of derived tables (the "drop and rebuild from raw transcripts" affordance).
- **Model choice per AI surface.** Configurable: which model (Haiku / Sonnet / Opus) is used for which ✨ button and for the Chat page. Default is cost-conscious — Haiku/Sonnet for quick summaries, Opus for Chat and "Suggest a new lens."
- **Data inspection pointers.** SQLite file location, example queries (per the inspectability NFR — UI complements direct DB access, doesn't replace it).
- **Notifications.** Section reserved; controls disabled with "coming later" copy.

---

## 3. Cross-cutting elements

### 3.1 Global filter bar

Top of every page except Settings. Filters: time range, project, machine. State persists as the user navigates. The user can scope the entire app to "last week, project X, laptop only" without re-applying filters per page.

### 3.2 Run status indicator

Persistent in the global header, top-right. Shows whether a job is running, what stage, elapsed time, and queue depth. Click to expand a panel with live log output streaming from the running job and a list of pending jobs.

### 3.3 Sidebar navigation

Eight items (Dashboard, Sessions, Proposals, Patterns, Effectiveness, Chat, Runs, Settings). Session Detail and Proposal Detail are click-through destinations, not sidebar items.

---

## 4. Pipeline architecture *(as it shapes the UX)*

The full architecture conversation is downstream of this spec. What matters here is the shape that determines what the UI needs to expose.

### 4.1 Two layers, distinct jobs, distinct tables

**Deterministic layer:**
- Ingestion: transcript JSONL → `sessions`, `events`, `tool_calls`, `session_costs`.
- Pattern detection: tool_calls + session_costs → `patterns`.
- Cheap, fast, idempotent, rebuildable from raw transcripts.

**LLM layer:**
- Proposal synthesis: per (lens × candidate pattern) → `proposals`.
- Effectiveness analysis: post-integration data → verdict updates on proposals.
- Expensive, non-deterministic, results cached.

Keeping these layers distinct means: the deterministic layer is debuggable with SQL; the LLM layer is debuggable with prompt logs; either can be changed without touching the other; when a proposal is wrong, it's clear whether the pattern detection (signal) or the synthesis (interpretation) is at fault.

### 4.2 No auto-runs in V1

Every pipeline run is user-triggered. Triggers are distributed across the UI:

- Dashboard → "Refresh now"
- Sessions → "Re-ingest now"
- Patterns → "Re-detect patterns now" (page-level), "Synthesise a proposal" (per row)
- Proposals → "Re-synthesise this lens" (per lens)
- Proposal Detail → "Re-synthesise this proposal"
- Effectiveness → "Recompute effectiveness" (page-level), "Recompute for this proposal" (per row)
- Settings → consolidated panel with all stage-level triggers and "Run full pipeline"

Cron / launchd / file watchers are out of V1 scope. They can be added later by the user if desired; the app does not assume they exist.

### 4.3 Concurrency, cancellation, notifications

- **Concurrency:** queue model. Clicked jobs queue up and run in order. Queue depth visible in the run status indicator.
- **Cancellation:** schema supports a `cancelled` status on runs from day one; UI affordance reserved for later.
- **Notifications:** Settings section scaffolded with disabled controls; reserved for later.

### 4.4 Provenance everywhere

Every proposal, pattern, and effectiveness verdict records the `run_id` that produced it. Click-through from any artifact to its originating run. When lens prompts change, old proposals retain their original synthesis history; re-synthesis adds new history rather than overwriting.

---

## 5. AI integration

### 5.1 Two patterns, both V1

**Contextual ✨ buttons** scoped to the component they live next to. Small context, quick answer, no leaving the page. Implementation phased — buttons are scaffolded in V1 routing but individual buttons may be wired up in later versions.

**Chat page** for open-ended cross-cutting questions over derived data. RAG + MCP access. Conversation persisted.

### 5.2 Chat scope

Derived/aggregated data only — costs, tool call summaries, patterns, proposal evidence, state history. Not the raw transcript JSONL. Faster, cheaper, and keeps the raw layer as a stable substrate.

### 5.3 Three proposal-creation paths

All write to the same `proposals` table with a `source` field:

1. **Automated (lens synthesis)** — pipeline run synthesises proposals from patterns.
2. **Manual from Patterns** — user clicks ✨ "Synthesise a proposal from this pattern."
3. **Manual from Chat** — user clicks "Promote to proposal" on a chat finding.

The downstream AI corpus benefits from knowing how each proposal originated.

### 5.4 Structured outputs

When AI generates a proposal, a state-change note, or a lens suggestion, it produces structured data, not just prose. Free-text fields are wrapped in rigid schema. This is what makes "outcomes feed AI later" actually work — a corpus of structured AI-readable artifacts from day one.

### 5.5 TokenOwl observes its own AI usage

Every ✨ button click and Chat message consumes API tokens. TokenOwl captures and surfaces its own AI usage in the same schema as Claude Code usage. Eats its own dog food, and gives the user data on whether the AI features are paying for themselves.

### 5.6 AI never auto-applies

Same human-in-the-loop principle as proposals. ✨ "Draft the integration" produces a draft the user copies; it does not write to `~/.claude/`. ✨ "Draft a state-change note" produces text the user reviews before saving. No AI output is auto-committed anywhere.

---

## 6. Lens framework

### 6.1 Definition location

Lens definitions live in **code-as-files**, version-controlled, edited in the user's editor. App restart loads new lens definitions. Each lens is filter rule + prompt template + metadata.

### 6.2 UI surface

Settings → Lenses is **read-only** in V1. Display only: name, description, current prompt (rendered), filter rule, last run timestamp, count of proposals produced, count by state.

A UI editor is reserved for later; not V1.

### 6.3 Retroactive application

Adding a new lens applies to all historical patterns on the next synthesis run. This is the "new lenses apply retroactively to all historical sessions" principle from PROPOSAL.md, made concrete: pattern detection runs over all sessions; lens synthesis runs over all patterns; new lens = new synthesis pass.

### 6.4 Prompt versioning

Lens prompts are git-versioned. When a prompt changes, re-synthesis produces new proposals for old patterns under the new prompt. Old proposals retain their original synthesis history (which prompt version, which run). The user can compare.

---

## 7. Proposal lifecycle

### 7.1 States

- `new` — surfaced by the proposer, not yet reviewed.
- `accepted` — user has decided to integrate but hasn't yet.
- `rejected` — decided not to do it.
- `deferred` — revisit later.
- `integrated` — actually wired into Claude Code setup; effectiveness tracking begins.
- `validated` — post-integration data shows it worked.
- `ineffective` — post-integration data shows it didn't help or made things worse.
- `archived` — terminal state for old/obsolete proposals.

### 7.2 Transitions

`new` → `accepted` / `rejected` / `deferred`
`accepted` → `integrated` / `rejected` / `deferred`
`deferred` → `accepted` / `rejected`
`integrated` → `validated` / `ineffective`
Any → `archived`

The `integrated` → `validated` / `ineffective` transition is the only one the system *suggests* automatically (based on effectiveness data). All others are user-driven.

### 7.3 State history

Every transition writes a structured record:

```
{
  proposal_id,
  from_state,
  to_state,
  changed_at,
  source,        // "user" | "system"
  note           // optional, free text
}
```

Notes are free-text but the record schema is rigid. This is the substrate the downstream AI consumes.

---

## 8. Reserved-for-later

UI slots scaffolded; implementations deferred. Listed here so they don't get forgotten.

- **Multi-machine data consolidation.** Machine column exists from day one on every relevant table; UI filters expose it even when only one machine is reporting. Cross-machine aggregation is a later capability.
- **Run cancellation.** Status enum supports `cancelled`; UI affordance reserved.
- **Run-completion notifications.** Settings section disabled with placeholder copy.
- **Lens UI editor.** V1 is read-only display; editor is later.
- **Auto/scheduled runs.** Out of V1 entirely. The user can wire up cron / launchd / file watchers if desired; the app does not.
- **Local LLM offload.** Explicit non-goal per PROPOSAL.md §6. Revisited only if accumulated data justifies it.

---

## 9. Open questions for the architecture conversation

The UX is settled enough to hand off. The architecture conversation will need to resolve:

- Concrete table definitions (the schema in NOTES.md is the starting point; this spec adds `runs`, `proposals`, `patterns`, `lenses` metadata, `proposal_state_history`, `ai_usage`).
- API surface between the UI and the local backend (REST, RPC, server-side rendering, etc.).
- Process model for the pipeline (single Node process, separate worker, etc.) and how the queue is implemented.
- File watcher vs. on-demand ingestion (V1 is on-demand; if a watcher is added, it lives at the ingestion stage only).
- RAG indexing strategy for the Chat page and ✨ "Find sessions like…" — vector store, full-text, hybrid.
- Deployment shape — single binary, Docker, Tauri, web app on localhost, etc.

None of these are settled by the UX. All of them will be informed by it.
