# TokenOwl: Frontend Build Proposal

**Companion to:** PROPOSAL.md (requirements), NOTES.md (POC findings), UX_SPEC.md (UX shape)
**Status:** Proposed. Architecture (backend, pipeline, data model) deferred until this phase completes.
**Scope:** A complete frontend implementation of the UX laid out in UX_SPEC.md, driven by hardcoded mock data, running locally with no backend, no auth, no persistence beyond `localStorage` where genuinely useful. The deliverable is a clickable, navigable, visually finished web app that exercises all ten pages to a level of fidelity sufficient to validate the UX before committing to backend shape.

---

## 1. Why frontend-first, why now

Three of the project's foundational documents (PROPOSAL.md, NOTES.md, UX_SPEC.md) end with the same status note: "architecture and data model conversation pending." UX_SPEC §9 lists six concrete unresolved questions — deployment shape, API surface, pipeline process model, file watcher vs. on-demand ingestion, RAG strategy, stack — none of which are settled.

Trying to settle them in the abstract is harder than it should be, because the right answer to each depends on the *texture* of the UI: how often the dashboard actually wants refreshing, what "live run status" actually looks like in practice, how often I'd really click "Re-synthesise this lens," what the mock data shape wants to look like before it becomes a real API contract. Those questions are easier to answer by *using the UI* than by reasoning about it.

A frontend-only build, with hardcoded mock data structured the way a real API would shape its responses, gives me:

- A fully clickable end-to-end product to use, share, and test against UX_SPEC.md
- A concrete data contract that the future backend will fulfill, rather than guess at
- Real exposure to which interactions are easy (filtering a static list) and which are hard (streaming run status, "Promote to proposal" round-trip, effectiveness verdicts updating after integration), which informs backend architecture
- A way to discover whether some pages are over-spec'd (they exist on paper but aren't actually used in practice) before paying to build the backend that supports them
- A complete visual reference for the design system that's stronger than any Stitch mockup, because it's actually live code

The phase is bounded. It is not "build the UI and figure out the rest later forever." It is "build the UI, *use it*, and use what I learn to make the architecture conversation faster and better-informed."

## 2. The pivot, honestly

This is a reasonable move with some risks I'm naming up front so they don't sneak up later.

**Risks:**

- The mock data shape becomes a contract the backend has to fulfill, even if some shapes turn out to be expensive to compute server-side. Mitigation: keep mock shapes close to what NOTES.md's schema can produce naturally; don't invent fields the backend can't trivially provide.
- It's easy to overpolish a frontend that has no real data behind it. Diminishing returns set in. Mitigation: an explicit definition of "done for this phase" (§13) and discipline about stopping there.
- Several UX_SPEC features are inherently backend-coupled (live streaming run status, post-integration effectiveness verdicts, "Promote to proposal" from chat). Mocking them papers over real complexity. Mitigation: stub them with canned responses *and write down* what's being papered over, so the architecture phase picks them up.
- AI quality (the ✨ surfaces, the Chat page) is invisible until the backend can actually call models. The frontend can stub responses, but stubs don't tell me whether the surfaces are *useful*. Mitigation: accept this as known; revisit AI quality during backend phase.

**What it preserves:**

- POC findings (NOTES.md) remain valid; nothing about transcript-primary substrate changes
- All architecture decisions stay open
- Frontend code is portable; if I later switch the backend from Fastify to Hono, or change the deployment shape, the frontend doesn't care
- The mock data layer becomes the most realistic possible API spec for the future backend

Net judgment: yes, reasonable. Worth the time.

## 3. Goal

Build a complete, clickable, visually finished frontend implementation of UX_SPEC.md's ten pages, running locally with no backend, driven by realistic mock data. Use it for at least a week. Decide what changes, what stays, and what the architecture phase actually needs to deliver based on real use.

## 4. Guiding principles for this phase

These are *additional* to the principles in PROPOSAL.md §3, not replacements for them. They are specific to the frontend-only phase and stop applying once a backend exists.

**Mock data is shaped like real API responses, from day one.** The frontend never reaches into mock fixtures directly. It calls a data layer (TanStack Query hooks) that, in mock mode, is fulfilled by an MSW handler returning canned JSON. When the backend arrives, the seam is exactly at MSW — turn it off, point at the real API, the rest of the code is unchanged.

**Realistic mock scale, not demo scale.** POC observed 47 sessions across 11 projects, ~4 weeks of usage, costs in cents to single dollars per session. The mocks reflect that. No 2,491-session inflated counts (that was Stitch's tell that it didn't read the spec). Layout decisions made against realistic data are layout decisions that survive to production.

**Every page has empty, loading, and error states.** A page that only renders when data is perfect is a page that lies. Empty states (zero sessions, zero proposals) need real handling because Day 1 of the real product looks like that.

**Stub the AI surfaces, do not fake them.** Clicking ✨ "Brief me" opens a panel with canned, plausible content and a clear visual indicator (in dev mode) that this is a stub. No attempt to make stubs look like real LLM output. The buttons exist; their behavior is honest about being placeholder.

**No persistence theatre.** Where the spec implies state persistence (proposal state changes, chat history), use `localStorage` or in-memory state, with a clear comment marking the seam where the backend will take over. Do not invent persistence layers that future code has to migrate from.

**Design system fidelity.** Nocturnal Logic tokens become the actual theme. Components reference tokens, not arbitrary hex values. If a token changes later, components inherit.

**Inspectability survives.** The mock data layer is plain TypeScript files I can read, edit, and add to. No fixture-generation magic, no `faker`/`chance` dependencies that obscure what the data actually looks like.

## 5. Stack

```
Build:        Vite (current major)
Language:     TypeScript (strict mode)
Framework:    React (current major)
Styling:      Tailwind CSS v4 (CSS-first config) + Nocturnal Logic tokens
Routing:      TanStack Router
Data layer:   TanStack Query
Mock layer:   MSW (Mock Service Worker) v2
Components:   shadcn/ui (copy-paste, owned in repo)
Charts:       Recharts
Icons:        Lucide
Smoke tests:  Vitest + React Testing Library (minimal — types do most of the work)
Lint/format:  Biome (single tool, fast)
```

Reasoning per choice:

- **Vite over Next.js.** No SSR needed (single-user local app), simpler build, faster HMR, fewer conventions to fight. Plays well with Tailwind v4's Vite plugin.
- **React.** Default. Compiler optional (skip for now, revisit if rendering performance becomes an issue with 50+ sessions in lists).
- **TanStack Router.** Type-safe params on `/sessions/$id` and `/proposals/$id` matter; the alternatives (React Router) work but have weaker types. Search-param state is also typed, which the global filter bar wants.
- **TanStack Query.** The mock-to-real seam works cleanly through it. Provides loading/error states for free, which the principle above demands.
- **MSW.** This is the single most important choice in the stack. MSW intercepts `fetch` at the network level and returns mock responses, meaning the application code makes real HTTP calls and never knows it's in mock mode. When the backend arrives, MSW gets disabled and the same code talks to the real API. No mocking refactor.
- **shadcn/ui over a UI kit.** Components live in the repo, can be restyled to Nocturnal Logic without fighting a design system. Keeps "modesty" / "cheap to throw away."
- **Recharts.** Declarative, sufficient for the dashboard charts in UX_SPEC. Visx if I outgrow it; SVG hand-rolling if Recharts feels heavy.
- **Lucide over Material Symbols.** Tree-shakeable React components, no font loading, idiomatic with shadcn. Stitch used Material Symbols but the aesthetic ("minimalist line icons") is preserved.
- **Biome over ESLint+Prettier.** Single fast tool, less config noise. Trivially replaceable if I want the ESLint plugin ecosystem later.

## 6. Project structure

```
tokenowl-web/
├── src/
│   ├── main.tsx                 # entry point
│   ├── app.tsx                  # router shell
│   ├── routes/                  # one file per route (TanStack Router)
│   │   ├── __root.tsx           # sidebar layout, global filter bar
│   │   ├── index.tsx            # / → redirect to /dashboard
│   │   ├── dashboard.tsx
│   │   ├── sessions.index.tsx
│   │   ├── sessions.$id.tsx
│   │   ├── proposals.index.tsx
│   │   ├── proposals.$id.tsx
│   │   ├── patterns.tsx
│   │   ├── effectiveness.tsx
│   │   ├── chat.tsx
│   │   ├── runs.tsx
│   │   └── settings.tsx
│   ├── components/
│   │   ├── ui/                  # shadcn primitives (owned)
│   │   ├── layout/              # sidebar, header, run status indicator
│   │   ├── filters/             # global filter bar, date range picker
│   │   ├── charts/              # spend-over-time, breakdowns, etc.
│   │   ├── ai/                  # ✨ button, AI panel, citation card
│   │   ├── sessions/            # session row, session timeline
│   │   ├── proposals/           # proposal row, lens rail, state badge
│   │   ├── patterns/
│   │   ├── runs/
│   │   ├── chat/
│   │   └── shared/              # currency formatter, time formatter, etc.
│   ├── data/                    # ←── the seam
│   │   ├── client.ts            # TanStack Query client setup
│   │   ├── sessions.ts          # useSessions(), useSession(id), etc.
│   │   ├── proposals.ts
│   │   ├── patterns.ts
│   │   ├── runs.ts
│   │   ├── effectiveness.ts
│   │   ├── chat.ts
│   │   └── ai-usage.ts
│   ├── mocks/                   # MSW handlers + fixtures
│   │   ├── browser.ts           # MSW setup
│   │   ├── handlers.ts          # combines all handlers
│   │   ├── fixtures/            # plain TS exports (one per entity)
│   │   │   ├── sessions.ts
│   │   │   ├── proposals.ts
│   │   │   ├── patterns.ts
│   │   │   ├── runs.ts
│   │   │   ├── lenses.ts
│   │   │   └── chat.ts
│   │   └── handlers/            # one handler module per entity
│   ├── types/                   # types shared between data layer and components
│   ├── theme/                   # nocturnal-logic.css (CSS variables)
│   └── lib/                     # utilities (cn, format helpers)
├── public/
│   └── tokenowl-icon.svg
├── index.html
├── vite.config.ts
├── tsconfig.json
├── biome.json
├── package.json
└── README.md
```

A few non-obvious choices worth flagging:

- The `/data/` folder is deliberately separate from `/mocks/`. Components import from `/data/`, never from `/mocks/`. The data layer doesn't even know mocks exist — MSW lives below it, intercepting `fetch`. This is the seam.
- Fixtures are plain TS, not JSON. Lets me share types between fixtures and runtime, and lets me write small helpers (`makeSession({...overrides})`) without a fixture-generation library.
- shadcn components live in `components/ui/` and are owned by the repo. No external UI kit dependency to manage.

## 7. Mock data strategy

The mock data layer is the most important part of this phase. It's the contract the backend will eventually fulfill, and it's what the frontend exercises every day. Getting it right is more valuable than getting any single visual detail right.

### 7.1 The MSW seam

```
Component → useSessions() → fetch('/api/sessions') → MSW intercepts → returns fixtures
                                                       ↑
                                                       │
                                          Backend phase: turn this off, real backend takes over
```

In dev mode, MSW starts at app boot and intercepts every request to `/api/*`. Handlers consult the fixtures, apply filters/sorts/pagination if relevant, and return JSON shaped exactly like a real API response. Components and the `/data/` layer have zero awareness that mocks exist.

When the backend phase begins, the work is: write the real Fastify routes, then disable MSW (or scope it to a `?mocks=1` query parameter for fallback debugging). Nothing else changes.

### 7.2 Fixture design

Fixtures live in `src/mocks/fixtures/`. Each entity gets one file. Fixtures are explicit data, not generators — every session is hand-shaped (or, where I need volume, generated by a small explicit loop in the same file with fixed seeds, no faker).

Realistic scale, modeled on POC:

- ~50 sessions across ~10 projects (matches POC's 47/11)
- ~4 weeks of activity
- Two machines reporting (`mac-mini-home`, `office-laptop`)
- A mix of current frontier model names — not "claude-3-opus"; the actual current models, picked from real session metadata I have to hand
- Cost numbers in cents to single dollars per session (matching POC: $0.42, $0.08, $1.15)
- Cache hit rates with realistic variance (25–95% range, weighted toward 60–80%)
- Tool call counts that match POC's distribution (Read, Bash, Edit dominant)

Edge cases that *must* exist in fixtures:

- A session with zero tool calls (just a conversation)
- A session that hit `/clear` mid-way (low cache hit rate)
- A session with sub-agents (tests SubagentStop handling and the nested-transcript click-through)
- A session with `isMeta: true` user entries (tests label extraction skipping system-injected prompts)
- A session that crashed (no clean SessionEnd)
- An empty project (zero sessions) — appears in the project filter but yields no data
- A proposal in each lifecycle state (`new`, `accepted`, `rejected`, `deferred`, `integrated`, `validated`, `ineffective`, `archived`)
- A proposal with no draft implementation (just prose)
- An integrated proposal with effectiveness data showing it didn't help (the `ineffective` verdict)
- A pattern that hasn't been promoted to a proposal
- A run that failed (with a multi-line error log)
- A run that's currently `running` (for testing the live status indicator)
- A chat conversation with citations linking to real fixture sessions and proposals

### 7.3 Filter / sort / paginate semantics

Mock handlers implement filtering and sorting in JavaScript. This is fine for ~50 sessions; performance won't matter, and the semantics are what we care about (do filters compose correctly, do empty states render when filters yield zero, do cleared filters restore data).

Pagination: implement cursor-based pagination in mock handlers, even though for 50 sessions it's not strictly needed. The real backend will use it, and exercising it now means the frontend handles `nextCursor`, "Load more", etc. correctly from day one.

### 7.4 Latency simulation

MSW handlers add a 100–300ms randomised delay before responding. This exercises loading states (skeletons, spinners), prevents the UI from feeling fake (instant responses are a tell), and reveals which interactions actually need optimistic updates.

### 7.5 Mutations and "persistence"

Some interactions write data back: changing a proposal state, accepting a chat finding as a proposal, dismissing a notification. In mock mode, MSW handlers update an in-memory copy of the fixture. The result lives until page reload.

This is an honest stub: refresh, you're back to baseline. It's enough to test interaction flows. It's not enough to test "did my decision actually stick" — that's a backend feature.

For state that *must* survive reload to be testable (the user's preferred dashboard window, sidebar collapse state, current time-window default), use `localStorage` with a clear `tokenowl_` namespace. Don't use `localStorage` for mock entity state — that's a maintenance trap.

### 7.6 The "Run now" buttons

Many UX_SPEC pages have buttons that trigger pipeline runs (Refresh, Re-ingest, Re-detect patterns, Re-synthesise lens, Recompute effectiveness). In mock mode, clicking one creates a fake `Run` row, transitions it through `queued → running → succeeded` with realistic delays (3–8 seconds), and updates the run status indicator. Subscribers (the run status indicator, the Runs page) receive updates via SSE — also intercepted and faked by MSW.

This tests the full live-status flow (queue depth, currently-running, completion, click-through to run detail) without actually running anything.

## 8. Theming: Nocturnal Logic into Tailwind

Tailwind v4's CSS-first config is a clean fit for the design tokens already specified in `nocturnal_logic/DESIGN.md`.

Strategy:

- All Nocturnal Logic colors become CSS variables in `src/theme/nocturnal-logic.css`, using the keys from DESIGN.md verbatim (`--surface`, `--on-surface`, `--primary`, etc.)
- The Tailwind v4 `@theme` block exposes those variables as utility classes (`bg-surface`, `text-on-surface`, etc.)
- Typography tokens (`headline-lg`, `body-base`, `code-base`, `label-caps`) become utility classes via `@utility` directives
- Spacing tokens (`stack-xs`, `stack-sm`, `gutter`) become Tailwind spacing extensions
- Shape tokens map to Tailwind's `rounded-*` scale
- Inter loaded via `@import` in `index.css`; monospace stays system default per DESIGN.md

The result: components written with Tailwind utilities (`bg-surface text-on-surface rounded-md p-4`) are automatically themed by the Nocturnal Logic system. Change a token in `nocturnal-logic.css`, every component updates.

Dark mode is the only mode for V1. No light mode toggle. (DESIGN.md says "True Dark"; I honor it.)

## 9. Routing & page set

```
/                         → redirect to /dashboard
/dashboard
/sessions                 → list
/sessions/$id             → detail
/proposals                → list (lens rail + main pane)
/proposals/$id            → detail
/patterns
/effectiveness
/chat
/runs
/settings
```

The `__root` layout renders the sidebar, the top header (with the run status indicator and global filter bar), and an `<Outlet />` for the page content. Filter bar state lives in URL search params, so links and back-button work correctly and filters survive reloads.

## 10. State management

The hierarchy:

- **Server-shaped state** (entities, lists, derived views): TanStack Query, fed by the data layer hooks. Caching, invalidation, refetching all handled.
- **URL state** (filters, time window, sorts, current page, scope picker): URL search params via TanStack Router's typed search.
- **Local component state** (toggles, expanded rows, hover): `useState`.
- **Cross-page UI state** (sidebar collapsed, theme, dashboard window preference): a tiny Zustand store backed by `localStorage`.

No Redux, no Jotai, no nanostores. TanStack Query covers ~80% of state; URL covers ~15%; Zustand handles the last ~5%. If a piece of state doesn't fit one of those, that's a sign to revisit the architecture, not add a fourth tool.

## 11. AI surfaces in frontend-only mode

Every ✨ button in UX_SPEC needs *some* behavior. None of them have a real LLM behind them in this phase. The strategy:

- Each ✨ button opens an inline panel or dialog
- The panel renders canned, plausible content drawn from a fixture
- A small "Stub response" badge is visible in dev mode (removed before any kind of share/demo)
- The panel layout, citation rendering, copy-to-clipboard, "Promote to proposal" button — all these work fully. Only the *content* is canned.

For Chat:

- Same approach scaled up
- Sending a message opens a streaming response (faked via MSW chunked SSE) drawn from a small set of pre-written exchanges
- Suggested prompts work (clicking one populates the input)
- Citations link correctly to real fixture sessions/proposals
- "Promote to proposal" creates a real (mock) proposal in the fixture state, and that proposal is then visible on the Proposals page
- Conversation history persists in `localStorage` for the session

This is enough fidelity to validate the *shape* of AI integration. It is not enough to evaluate AI *quality* — that's a backend-phase question.

## 12. Non-goals for this phase

To prevent scope creep:

- **No backend.** Not even a stub server. MSW is the entire data layer.
- **No real LLM calls.** Stubs only. The frontend never holds an API key.
- **No data ingestion.** Transcript reading, hook receiver, SQLite — all backend phase.
- **No persistence beyond `localStorage`.** Not enough to be confused with real state.
- **No multi-machine sync.** Fixtures simulate two machines; the multi-machine *feature* is backend.
- **No auth.** Single user, localhost, no concept of identity. Reserved-for-later in PROPOSAL.md anyway.
- **No tests beyond smoke and types.** Real tests come with real logic. Type-checking and a handful of smoke tests are enough now.
- **No accessibility audit beyond keyboard nav and contrast checks.** A proper a11y pass happens once the UI stabilises.
- **No deployment.** Runs locally via `npm run dev`. No build target beyond that.
- **No performance optimisation.** 50 sessions is small. If the dashboard renders fast enough at 50 sessions in mock mode, that's enough signal for now.

## 13. What "done" looks like for this phase

The phase is complete when all of the following are true:

1. All ten pages from UX_SPEC are implemented and clickable end-to-end.
2. The sidebar navigates between every page; filters persist across navigation; the run status indicator behaves correctly (queue depth, currently-running, completed click-through to the Runs page).
3. Every page renders correctly in three states: with data, with no data (empty state), with simulated error.
4. All ✨ buttons open panels with canned content; Chat works end-to-end with stubbed responses and citations linking to real fixture entities.
5. Dashboard charts render against realistic POC-shaped fixture data; the time window toggle and global filter bar both affect what's shown.
6. Every interaction described in UX_SPEC works at the surface level: state transitions on proposals, "Promote to proposal" from chat, "Re-synthesise this lens," "Synthesise a proposal from this pattern," etc.
7. The Nocturnal Logic theme is applied consistently; no arbitrary colors or typography in components.
8. I have used the app, against itself, for at least one full week. I have notes on what works, what doesn't, and what UX_SPEC got wrong.
9. The mock data layer is documented well enough that it serves as the API contract for the backend phase.

That's the milestone. Everything beyond it is either backend or polish.

## 14. Build sequence

A concrete order. Each step is a Claude Code session of ~1–3 hours.

1. **Scaffold.** Vite + React + TS + Tailwind v4 + Biome. `npm run dev` works. Empty page renders with the Nocturnal Logic background color. Git initialised.
2. **Theme.** Nocturnal Logic CSS variables, Tailwind `@theme`, Inter loaded, typography utilities defined. A test page demonstrates every token in use.
3. **Layout shell.** Sidebar, header, run status indicator (visual only, no behavior yet), `__root` layout with `<Outlet />`. All ten routes exist as empty pages, sidebar navigates between them.
4. **Mock infrastructure.** MSW installed, browser worker registered, `handlers.ts` exporting an empty array, `data/client.ts` with TanStack Query setup. `data/sessions.ts` exposes `useSessions()` returning empty data through a real fetch. Verifies the seam works end to end.
5. **Fixtures.** Build out the full fixture set. ~50 sessions, ~25 proposals across 4 lenses, 12+ patterns, 30+ runs, lenses metadata, sample chats. Every edge case from §7.2 represented.
6. **Dashboard.** Headline numbers, spend over time chart, three breakdowns, actionable insights strip, recent sessions. ✨ Brief me opens a stubbed panel. Time window toggle works. Global filter bar wired up.
7. **Sessions list.** Filters in left rail, table with all columns, sort, pagination. ✨ Find sessions like… opens a stubbed search modal.
8. **Session detail.** Header, cost breakdown, AI insights panel, turn-by-turn timeline (collapsible turns, full content reveal), tool call summary, subagent activity, related proposals. ✨ buttons all stubbed.
9. **Proposals list.** Two-pane layout, lens rail, proposal table with state badges, filtering. State transition controls.
10. **Proposal detail.** Evidence, draft implementation, state history, effectiveness panel (only visible for `integrated+` proposals), provenance with click-through to runs.
11. **Patterns.** List, per-pattern display, "Synthesise from this pattern" stub, "Cluster these patterns" stub.
12. **Effectiveness.** Roll-up of integrated proposals, verdict filter, per-proposal "Why didn't this work?" stub.
13. **Runs.** Chronological log with click-through to per-run detail (a small panel showing the full log).
14. **Settings.** Pipeline status panel with manual triggers, capture status per machine, lens read-only display, model picker (visual only), data inspection pointers, notifications section disabled.
15. **Chat.** Full layout, history sidebar, scope picker, stubbed streaming responses with citations, "Promote to proposal" working through to the proposals fixture.
16. **Polish pass.** Empty states everywhere, error boundaries, loading skeletons, keyboard navigation, contrast check.
17. **Use it.** A week minimum. Notes go into a new doc, `FRONTEND_USE_NOTES.md`, that informs the architecture phase.

## 15. The seam to the backend phase

When this phase completes, the handoff to the architecture phase is:

- **The MSW handlers become the API spec.** Each handler is a function with a typed input (URL + query) and a typed output (JSON). Translating that into Fastify (or Hono, or whatever the architecture phase picks) route handlers is mechanical.
- **The fixture shapes become the database schema's projection layer.** The shapes were chosen to be cheap to compute from NOTES.md's substrate tables; the architecture phase confirms this and implements the projections.
- **The week of use produces a list** of UX_SPEC items that proved valuable, items that proved unused, and items that need rework. The architecture phase uses that list to scope itself.
- **The open architecture questions** (UX_SPEC §9) get answered with the benefit of having seen the UI in motion.

## 16. Open questions and risks

**Did I pick the right level of fidelity for AI stubs?** The line between "stub enough to validate the shape" and "stub so much that I'm hiding real backend complexity" is fuzzy. Defer judgment until step 6 (Dashboard ✨ Brief me) is real and I can feel where the line wants to be.

**Does Tailwind v4's CSS-first config deliver on Nocturnal Logic cleanly?** The DESIGN.md tokens are extensive. There may be friction around the more exotic ones (gradient borders for AI surfaces, subtle noise textures). Plan B is a small CSS-in-JS escape hatch for the exotic surfaces, with the rest staying in Tailwind.

**Will MSW's SSE support stay smooth?** SSE in MSW v2 is supported but less battle-tested than REST mocking. If it gets in the way, the fallback is to fake streaming via `setTimeout` in the data layer (less realistic, but works).

**How much will UX_SPEC change once I'm using the app?** Probably more than I expect. That's the *point* of the phase, not a risk to mitigate — but I should resist the urge to lock UX_SPEC down as final too early in the build.

**Am I building 10 pages when 6 would do?** UX_SPEC asserts that "more UI is better than fewer pages." The week-of-use step is what validates that assertion empirically. If two of the ten pages turn out to be unused, that's a finding, not a failure.
