# TokenOwl — Project Plan

**Current phase:** Phase 1 — Frontend (mock data, no backend)
**Goal of this phase:** Build all 10 pages against realistic mock data. Use the app for a week. Let real use inform the backend architecture before committing to it.

---

## How the phases connect

```
Phase 1: Frontend (now)
  → Build all 10 pages with MSW mock data
  → Use the app for a week
  → Discover what UX is right/wrong before locking in backend

Phase 2: Backend
  → Transcript reader + SQLite schema
  → Pattern detector
  → Proposal synthesiser (LLM + lenses)
  → REST API replacing MSW mock layer
  → Effectiveness tracker

Phase 3: Polish & operate
  → Real AI surfaces (✨ buttons + Chat)
  → Multi-machine consolidation
  → Optional: scheduled runs, notifications
```

The MSW handlers written in Phase 1 become the API contract for Phase 2. When the backend is ready, MSW is turned off and the same frontend code talks to the real API — no frontend rework.

---

## Phase 1 build steps

Each step is roughly one session (~1–3 hours). Commit after each with `[step-N] description`.

| # | Step | Status | What it involves |
|---|------|--------|-----------------|
| 1 | Scaffold | ✅ Done | Vite + React + TS + Tailwind v4 + Biome |
| 2 | Theme | ✅ Done | Nocturnal Logic tokens in `@theme`, Inter loaded |
| 3 | Layout shell | ⬜ Next | Sidebar, header, run status indicator, 10 empty routes |
| 4 | Mock infrastructure | ⬜ | MSW + TanStack Query wired up; data seam proven end-to-end |
| 5 | Fixtures | ⬜ | ~50 sessions, ~25 proposals, 12+ patterns, 30+ runs — all edge cases |
| 6 | Dashboard | ⬜ | Headline numbers, spend chart, breakdowns, insights strip, recent sessions |
| 7 | Sessions list | ⬜ | Filters, table, sort, pagination |
| 8 | Session detail | ⬜ | Header, cost breakdown, turn-by-turn timeline, tool summary, subagents |
| 9 | Proposals list | ⬜ | Two-pane layout, lens rail, state badge, state transitions |
| 10 | Proposal detail | ⬜ | Evidence, draft impl, state history, effectiveness panel |
| 11 | Patterns | ⬜ | Pattern list, per-pattern detail, "Synthesise from this" stub |
| 12 | Effectiveness | ⬜ | Roll-up of integrated proposals, verdicts, before/after metrics |
| 13 | Runs | ⬜ | Chronological log, per-run log panel, run status indicator wired up |
| 14 | Settings | ⬜ | Pipeline triggers, lens display, model picker, machine status |
| 15 | Chat | ⬜ | Full layout, stubbed streaming responses, citations, promote-to-proposal |
| 16 | Polish | ⬜ | Empty states, error boundaries, loading skeletons, keyboard nav |
| 17 | Use it | ⬜ | Run app for ≥1 week; write `FRONTEND_USE_NOTES.md` |

---

## Step 3 — Layout shell

**Install:**
- `@tanstack/react-router` — typed routing, URL search params for filters
- `lucide-react` — icons for sidebar nav
- `zustand` — sidebar collapse state and cross-page UI preferences

> TanStack Query, MSW, shadcn/ui, Recharts come in steps 4 and 6.

**Build:**
1. `src/routes/__root.tsx` — sidebar + header + `<Outlet />`
2. Sidebar: 8 nav items (Dashboard, Sessions, Proposals, Patterns, Effectiveness, Chat, Runs, Settings) with Lucide icons and active state highlight
3. Header: app name left, run status indicator placeholder ("No runs" static chip) right, global filter bar placeholder center
4. Redirect `/` → `/dashboard`
5. 10 stub route files — each renders a `<h1>` with the page name; no data yet

**Done when:** sidebar navigates between all 10 pages; URL changes on click; active item is highlighted; layout holds on every route.

---

## Step 4 — Mock infrastructure

**Install:**
- `@tanstack/react-query` — data fetching with built-in loading/error states
- `msw` — network-level mock interception (service worker in dev)

**Build:**
1. `src/mocks/browser.ts` — MSW service worker setup
2. `src/mocks/handlers.ts` — combines all handler modules; starts as empty array
3. `src/data/client.ts` — TanStack Query `QueryClient` with sensible defaults
4. `src/data/sessions.ts` — `useSessions()` hook calling `fetch('/api/sessions')`; MSW returns `[]`
5. `src/main.tsx` — start MSW before mounting React in dev mode; wrap app in `QueryClientProvider`

**Done when:** `useSessions()` in the Sessions stub page returns an empty array through the full stack — component → hook → `fetch('/api/sessions')` → MSW intercepts → returns `[]`. No component ever imports directly from `src/mocks/`.

---

## Step 5 — Fixtures

The most important step. These fixtures are what every subsequent page is built against. They also double as the API contract for Phase 2.

**Realistic scale (from POC findings):**
- ~50 sessions, ~10 projects, 4 weeks of activity, 2 machines (`mac-mini-home`, `office-laptop`)
- Session costs: $0.08–$1.15; cache hit rates: 25–95%, weighted toward 60–80%
- Tool call mix: Read + Bash + Edit ~70% of all calls
- Models: mix of `claude-sonnet-4-5`, `claude-opus-4-5`, `claude-haiku-4-5`

**Files to create (`src/mocks/fixtures/`):**
- `sessions.ts` — ~50 sessions with full metadata and turn arrays
- `proposals.ts` — ~25 proposals across 4 lenses, all 8 lifecycle states covered
- `patterns.ts` — 12+ patterns at varying frequency/cost levels
- `runs.ts` — 30+ runs across all pipeline stages, various statuses
- `lenses.ts` — 4 lens definitions (prompt hygiene, tool call patterns, context management, model selection)
- `chat.ts` — 3–5 pre-written Q&A exchanges with citations to real session IDs

**Required edge cases — every one must be present:**

| Edge case | Why it matters |
|-----------|----------------|
| Session with zero tool calls | Pure conversation; tool summary section must not crash |
| Session after `/clear` (low cache hit ~30%) | Cache hit rate variance |
| Session with subagents | Nested click-through to subagent transcript |
| Session with `isMeta: true` user entries | Label extraction must skip system-injected prompts |
| Session that crashed (no `SessionEnd`) | Incomplete session must render gracefully |
| Empty project (zero sessions) | Appears in project filter dropdown; yields empty state when selected |
| Proposal in each of the 8 lifecycle states | All state badges and transitions exercised |
| Proposal with no draft implementation | Prose-only proposal; draft impl section must not crash |
| Integrated proposal with `ineffective` verdict | Effectiveness page negative case |
| Pattern not yet promoted to a proposal | Patterns page has standalone content |
| Run that failed with multi-line error log | Runs page error display |
| Run currently `running` | Live run status indicator in header |
| Chat conversation with citations to real session IDs | Citation card links open correct session |

**MSW handler behavior:**
- All list endpoints: support filter + sort + cursor-based pagination in JavaScript
- All list endpoints: add 100–300ms randomized delay to surface loading states
- Mutation endpoints (proposal state change, promote-to-proposal): update in-memory copy of fixture; resets on reload

**Done when:** every fixture file exports typed data; every edge case is present and findable; MSW handlers for all entities return fixture data with realistic latency.

---

## Step 6 — Dashboard

**Install:**
- `recharts` — spend-over-time chart and breakdown bars
- Init `shadcn/ui` (`npx shadcn@latest init`) — copies component primitives into `src/components/ui/`
- Add shadcn components: `card`, `badge`, `button`, `separator`

**Build:**
1. `src/data/ai-usage.ts` — `useDashboardStats(window)` hook; MSW handler for `GET /api/dashboard?window=week`
2. `components/charts/SpendOverTime.tsx` — Recharts `AreaChart`, daily cost across selected window
3. `components/charts/BreakdownBar.tsx` — shared component for project / model / machine ranked bars
4. `components/ai/AiPanel.tsx` — shared panel opened by any ✨ button; accepts canned content prop; shows "Stub response" badge in dev
5. Dashboard route — six sections in order:
   - Headline numbers (total spend, token breakdown, cache hit rate, session count, deltas)
   - Spend-over-time chart
   - Three side-by-side breakdowns (by project, by model, by machine)
   - Actionable insights strip (top 3–5 proposals by projected savings, each with "View" link)
   - Recent sessions (last 8, label + cost + click-through)
6. Time window toggle (day / week / month / custom) → updates URL search param `?window=`
7. ✨ "Brief me" button → opens `AiPanel` with canned 2–3 paragraph narrative
8. ✨ next to insights strip → "Why these proposals?" → opens `AiPanel` with canned explanation

**Done when:** dashboard renders with fixture data; time window toggle changes headline numbers and chart; both ✨ buttons open panels with "Stub response" badge visible.

---

## Step 7 — Sessions list

**Install:**
- Add shadcn components: `table`, `select`, `input`, `popover`

**Build:**
1. `src/data/sessions.ts` — extend `useSessions(filters)` to pass filter/sort/cursor to MSW handler
2. MSW handler for `GET /api/sessions` — filters by time range, project, machine, model, cache hit band, cost band; sorts by any column; cursor-based pagination
3. `components/sessions/SessionRow.tsx` — label (truncated), project, machine, model, started_at, duration, cost, cache hit rate, tool call count
4. `components/filters/SessionFilters.tsx` — filter controls: time range, project, machine, model, cache hit band, cost band; all wired to URL search params
5. Sessions route — filterable/sortable table; "Load more" cursor pagination; "Re-ingest now" button (visual only, no behavior)
6. ✨ "Find sessions like…" button → opens stub modal with a text input and canned results

**Done when:** table renders all 50 fixture sessions; applying a project filter reduces results; clearing filters restores all sessions; sort works on every column; "Load more" appears when results exceed page size; empty state renders when filters yield nothing.

---

## Step 8 — Session detail

**Build:**
1. `src/data/sessions.ts` — add `useSession(id)` hook; MSW handler for `GET /api/sessions/:id`
2. `components/sessions/TurnTimeline.tsx` — chronological list of turns; each turn shows role, incremental token cost, and a "Expand" toggle to reveal full content (prompt text, tool input/output, assistant message)
3. `components/sessions/ToolCallSummary.tsx` — aggregate counts by tool name for this session
4. `components/sessions/SubagentActivity.tsx` — list of subagents with agent type and click-through link (stub detail panel)
5. Session detail route — all sections: header, cost breakdown (input/output/cache creation/cache read with dollar amounts), timeline, tool summary, subagent activity, related proposals list
6. Four ✨ buttons, each opens `AiPanel` with canned content:
   - "Summarise this session" (header level)
   - "Why was this session expensive?" (next to cost breakdown)
   - "Where did this session go off-track?" (next to timeline)
   - "Was this subagent worth it?" (next to subagent activity, only when subagents present)

**Done when:** clicking a session row in the Sessions list opens the correct detail; turns expand and collapse; the subagent section renders only when the session has subagents; related proposals link to Proposal Detail; all ✨ buttons open panels.

---

## Step 9 — Proposals list

**Install:**
- Add shadcn components: `dropdown-menu`, `dialog`, `textarea`

**Build:**
1. `src/data/proposals.ts` — `useProposals(filters)` hook; MSW handler for `GET /api/proposals`
2. `src/data/lenses.ts` — `useLenses()` hook; MSW handler for `GET /api/lenses`
3. `components/proposals/LensRail.tsx` — "All lenses" row at top, then one row per lens with active proposal count; clicking a lens filters the main pane
4. `components/proposals/StateBadge.tsx` — color-coded badge per lifecycle state
5. `components/proposals/ProposalRow.tsx` — projected impact, lens, state badge, quick-action buttons (accept / reject / defer / archive)
6. Proposals route — two-pane layout (lens rail + proposal table); filter bar (state, lens, project, machine, date range); sort (projected impact, recency, evidence strength)
7. State transition: clicking a quick-action button fires `PATCH /api/proposals/:id/state`; MSW updates in-memory state; badge updates immediately
8. ✨ per row — "Explain in one line" → stub `AiPanel`
9. ✨ at lens-rail level — "Suggest a new lens" → stub `AiPanel`

**Done when:** lens rail filters proposals; all 8 lifecycle states visible via StateBadge; state transitions update the badge in the current session (resets on reload, which is expected); both ✨ surfaces open panels.

---

## Step 10 — Proposal detail

**Build:**
1. `src/data/proposals.ts` — add `useProposal(id)` hook; MSW handler for `GET /api/proposals/:id`
2. MSW mutation endpoint `PATCH /api/proposals/:id/state` — writes state transition to in-memory fixture including optional note
3. `components/proposals/EvidenceList.tsx` — sessions and turns cited as evidence; each links to Session Detail
4. `components/proposals/DraftImpl.tsx` — code/config snippet with copy-to-clipboard button
5. `components/proposals/StateHistory.tsx` — chronological log of state transitions; each entry shows from→to, timestamp, source (user/system), and optional note
6. `components/proposals/EffectivenessPanel.tsx` — before/after cost and frequency comparison, current verdict; only rendered when `state` is `integrated`, `validated`, or `ineffective`
7. Proposal detail route — all sections: summary, evidence, suggestion, draft impl, state & history, effectiveness panel (conditional), provenance (lens + run + click-through to Runs page)
8. State transition UI: button triggers a `Dialog` with a `Textarea` for an optional note; confirms before applying
9. "Re-synthesise this proposal" button — visual only
10. Three ✨ buttons:
    - "Draft the integration" → stub `AiPanel` with canned skill/hook snippet
    - "Draft a state-change note" → stub `AiPanel` with canned note text
    - "Counter-argument" → stub `AiPanel` with canned steelman

**Done when:** evidence sessions link correctly to Session Detail; state transition writes a history entry with the note; effectiveness panel only renders for integrated+ proposals; clicking provenance run opens the Runs page.

---

## Step 11 — Patterns

**Build:**
1. `src/data/patterns.ts` — `usePatterns(filters)` hook; MSW handler for `GET /api/patterns`
2. `components/patterns/PatternRow.tsx` — tool name / input shape, session count, total cost attributed, frequency band
3. `components/patterns/ExampleInvocations.tsx` — 2–3 example tool inputs from fixture sessions, each linking to the session
4. Patterns route — list sorted by frequency by default; filter by project, machine, time range; per-pattern expandable section showing cost, variance, example invocations, and constituent session links; "Re-detect patterns now" button (visual only)
5. Three ✨ surfaces:
    - Per pattern — "Synthesise a proposal from this pattern" → stub `AiPanel`
    - Per pattern — "Is this worth a proposal?" → stub `AiPanel`
    - Page level — "Cluster these patterns" → stub `AiPanel`

**Done when:** pattern list renders sorted by frequency; expanding a pattern shows example invocations with real session links; empty state renders when filters yield nothing.

---

## Step 12 — Effectiveness

**Build:**
1. `src/data/effectiveness.ts` — `useEffectiveness(filters)` hook; MSW handler for `GET /api/effectiveness`
2. `components/effectiveness/VerdictBadge.tsx` — `validated` (green), `ineffective` (red), `still-gathering` (muted)
3. `components/effectiveness/BeforeAfterMetrics.tsx` — side-by-side cost and frequency for pre/post integration periods
4. Effectiveness route — only shows proposals in `integrated`, `validated`, or `ineffective` state; filter by lens, project, verdict; per-proposal: before/after cost, frequency, verdict badge, time since integration; "Recompute effectiveness" button (visual only) at page level; "Recompute for this proposal" per row (visual only)
5. Two ✨ surfaces:
    - Per ineffective proposal — "Why didn't this work?" → stub `AiPanel`
    - Per validated proposal — "Generalise from my wins" → stub `AiPanel`

**Done when:** only integrated+ proposals appear; verdict filter works; `ineffective` and `validated` proposals both render their respective ✨ buttons; empty state renders when no integrated proposals exist.

---

## Step 13 — Runs

**Build:**
1. `src/data/runs.ts` — `useRuns(filters)` hook; MSW handler for `GET /api/runs`
2. `components/runs/StatusBadge.tsx` — color-coded: succeeded (green), failed (red), running (teal animated), queued (muted), cancelled (muted)
3. `components/runs/RunRow.tsx` — stage, status badge, triggered at, triggered from (page/button label), duration, output summary (rows written, proposals produced)
4. `components/runs/RunLogPanel.tsx` — slide-over panel showing full log text; multi-line error log for failed runs
5. Runs route — chronological log (newest first); filter by stage, status, time range; click a row → log panel opens
6. Wire the run status indicator in the header to the fixture's currently-`running` run — shows stage name, elapsed time, and a click-through to this page

**Done when:** runs list renders; clicking a failed run opens its multi-line error log in the panel; the run status indicator in the header reflects the `running` fixture run; filter by status works.

---

## Step 14 — Settings

**Install:**
- Add shadcn components: `switch`, `accordion`

**Build:**
1. `components/settings/PipelineTriggers.tsx` — per-stage last-run timestamp, duration, error indicator, "Run now" button; "Run full pipeline" button; clicking "Run now" fires `POST /api/runs` (MSW creates a new run in fixture, visible on Runs page)
2. `components/settings/MachineStatus.tsx` — two machines, last ingested timestamp, health indicator
3. `components/settings/LensDisplay.tsx` — read-only list of lenses: name, description, current prompt (rendered), filter rule, last run, proposal counts by state
4. `components/settings/ModelPicker.tsx` — dropdown per AI surface (Brief me, Summarise session, Chat, etc.) showing Haiku/Sonnet/Opus; selection stored in `localStorage` under `tokenowl_model_prefs`; visual only, no effect on stub responses
5. `components/settings/DataInspection.tsx` — SQLite file path placeholder + 3 example queries (static, for backend phase reference)
6. Notifications section — disabled fields with "coming later" copy
7. Settings route — four sections as accordion or stacked cards

**Done when:** clicking "Run now" creates a run visible on the Runs page; model picker selection persists across page reloads; lens display shows all 4 fixture lenses with their prompt text.

---

## Step 15 — Chat

**Build:**
1. `src/data/chat.ts` — `useChatHistory()` (reads from `localStorage`); `useSendMessage()` hook streaming via MSW chunked SSE response
2. `src/mocks/handlers/chat.ts` — matches incoming message against pre-written exchanges; returns response as chunked SSE stream with 20–50ms inter-chunk delay; handles `POST /api/chat/promote` to create a draft proposal in fixture
3. `components/chat/ChatPane.tsx` — message input, send button, streaming response renders token by token
4. `components/chat/ConversationSidebar.tsx` — list of past conversations named by their first question; persisted in `localStorage` under `tokenowl_chat_history`
5. `components/chat/ScopePicker.tsx` — dropdown to constrain context to a project, machine, or time range; defaults to "everything"
6. `components/chat/SuggestedPrompts.tsx` — 4 starter questions on a fresh chat: "What changed this week?", "Where is my biggest unaddressed cost driver?", "Which lens has been most valuable?", "Are there projects I should stop using Claude Code for?"
7. `components/chat/CitationCard.tsx` — inline card linking to a session or proposal; clicking navigates to Session Detail or Proposal Detail
8. `components/chat/PromoteButton.tsx` — "Promote to proposal" below any AI response; fires `POST /api/chat/promote`; shows confirmation toast; the new proposal is then visible on the Proposals page
9. Chat route — full layout with history sidebar, scope picker, suggested prompts, main pane

**Done when:** sending a message produces a streaming response with citations; citation cards link to correct sessions/proposals; "Promote to proposal" creates a new `new`-state proposal visible on the Proposals page; conversation history persists after page refresh; suggested prompts populate the input on click.

---

## Step 16 — Polish

**Install:**
- `vitest` + `@testing-library/react` — minimal smoke tests only

**Build:**
1. Empty states — every page has a meaningful empty state component (not just a blank page) for when filters or queries yield no data
2. Error boundaries — `src/components/shared/ErrorBoundary.tsx` wrapping each route; each page has a simulated error state (MSW can return 500 on demand via `?simulateError=1`)
3. Loading skeletons — `src/components/shared/Skeleton.tsx` + per-page skeleton variants that match the page layout; renders during TanStack Query's loading state
4. Keyboard navigation — sidebar navigable with arrow keys; data tables with Tab; modals closeable with Escape; ✨ panels closeable with Escape
5. Contrast check — verify all `text-*` / `bg-*` token pairings against WCAG AA contrast ratio
6. Smoke tests — three tests: "Dashboard renders with fixture data", "Sessions list renders and shows 50 rows", "Proposal state transition updates badge"

**Done when:** every page has data / empty / error states all working; no console errors in any state; keyboard navigation works through sidebar and tables; smoke tests pass.

---

## Step 17 — Use it

This is a validation step, not a build step.

**Activity:**
- Run `npm run dev` and use the app normally for at least one week
- Use the time window toggle, drill into sessions, triage proposals, browse patterns
- Try the Chat page with each suggested prompt
- Intentionally exercise edge cases (empty project filter, crashed session, ineffective proposal)

**Deliverable — `FRONTEND_USE_NOTES.md`:**
- Which pages you actually used vs. never opened
- UX_SPEC decisions that felt right in practice
- UX_SPEC decisions that felt wrong or missing
- Data fields that seem unnecessary in the real UI
- Data you wished existed that the mocks don't have
- At least 3 concrete "I would change X" findings
- Open questions for the backend architecture phase

**Done when:** `FRONTEND_USE_NOTES.md` exists with ≥1 week of observations and at least 3 actionable findings; `PROJECT_PLAN.md` status column updated to reflect completion.

---

## Phase 2 preview (backend)

After Phase 1 is validated through use, Phase 2 builds the real data layer:

1. **Transcript reader** — reads `~/.claude/projects/**/*.jsonl`, aggregates token costs per session, writes to SQLite
2. **SQLite schema** — `sessions`, `events`, `session_costs`, `tool_calls`, `proposals`, `patterns`, `lenses`, `runs`, `proposal_state_history` (starting point in `docs/NOTES.md`)
3. **Pattern detector** — groups `(tool_name, input_shape)` sequences across sessions, flags high-frequency/low-variance ones
4. **REST API** — Fastify (or Hono) routes replacing MSW mock layer; seam is exactly at MSW, nothing else changes
5. **Proposal synthesiser** — per `(lens × pattern)`, calls Claude API with structured output, writes to `proposals`
6. **Effectiveness tracker** — compares pre/post integration spend on relevant patterns

Architecture open questions (process model, RAG strategy, deployment shape) get answered during Phase 2 using real data from Phase 1 use.

---

## Key conventions (always apply)

- **No hex values in components.** Use `bg-surface`, `text-on-surface`, etc. — always the token, never inline color.
- **No imports from `src/mocks/` in components.** Go through `src/data/` only.
- **URL state for filters.** Time window, project, machine, sort live in URL search params — not React state.
- **Three states per page.** Data, empty, error. All three must work before a step is done.
- **Stub AI honestly.** ✨ buttons open `AiPanel` with canned content + "Stub response" badge visible in dev mode.
- **No faker.** Fixtures are explicit hand-shaped TypeScript, readable as documentation.
- **localStorage namespace.** Any cross-reload UI state goes under `tokenowl_` prefix.
