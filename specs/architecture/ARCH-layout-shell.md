# Architecture: Layout Shell — Sidebar, Header, 10 Stub Routes

> **Date:** 2026-05-02
> **Phase:** 2 of 5 (System Architecture)
> **Requirements source:** `specs/requirements/REQ-layout-shell.md`
> **Type:** feature

## Architecture Summary

TanStack Router with file-based routing is wired into the existing React scaffold by replacing the `app.tsx` placeholder with a `<RouterProvider>`. A root layout (`__root.tsx`) composes a persistent `<Sidebar>` (8 nav items, prefix-match active state, collapse toggle) and `<Header>` (app name, static run-status chip, center placeholder) around an `<Outlet>` that renders 10 stub route components. A Zustand store with `persist` middleware manages sidebar collapse state in `localStorage` under the `tokenowl_` namespace. No data fetching, no MSW, no TanStack Query — this step is purely navigation and layout.

## High-Level Structure

```
main.tsx
  └── <App /> → <RouterProvider router={router}>
        └── __root.tsx
              ├── <Sidebar />       ← 240px left rail, 8 nav items, collapse toggle (R2, R4, R6)
              ├── <Header />        ← full-width top bar (R9)
              └── <Outlet />        ← swapped by router on navigation (R3, R8)
                    ├── /           → redirect to /dashboard (R1)
                    ├── /dashboard
                    ├── /sessions
                    ├── /sessions/$id
                    ├── /proposals
                    ├── /proposals/$id
                    ├── /patterns
                    ├── /effectiveness
                    ├── /chat
                    ├── /runs
                    └── /settings
```

**Data flow:**
1. User clicks a sidebar nav item → TanStack Router updates URL (R3)
2. `<Outlet />` swaps to the matching stub route component (R8)
3. `<Sidebar />` reads `useRouterState().location.pathname` with prefix match to compute active item (R4)
4. Clicking the already-active item: TanStack Router detects same-route navigation and no-ops (R5)
5. Collapse toggle reads/writes `useUIStore().sidebarCollapsed` → persisted to `localStorage['tokenowl_ui']` (R6, R7)

## Tech Choices

| Area | Decision | Alternatives Considered | Rationale |
|---|---|---|---|
| Routing | `@tanstack/react-router` + `@tanstack/router-plugin` | React Router v7 | File-based routing with auto-generated typed route tree; URL search params for filters in later steps; spec-mandated. Satisfies R1, R3, R8 |
| Icons | `lucide-react` | Material Symbols, Heroicons | Tree-shakeable React components; no font loading; spec-mandated. Satisfies R2 |
| UI state persistence | `zustand` + `persist` middleware, `partialize` | Manual `localStorage` read/write | Built-in hydration handling; `partialize` pins the exact persisted key; eliminates boilerplate. Satisfies R7 |
| Styling | Nocturnal Logic tokens via Tailwind v4 | — | CLAUDE.md hard requirement; no inline hex. Satisfies R10 |

## Patterns & Conventions

- **File-based routing** — one file per route in `src/routes/`; `__root.tsx` is the layout wrapper; `.index.tsx` suffix for list routes; `.$id.tsx` for param routes (TanStack Router file convention)
- **Collocated layout components** — `src/components/layout/` owns Sidebar and Header; they are not inlined in `__root.tsx`
- **Token-only styling** — all colors via token classes (`bg-surface`, `text-primary-container`, etc.); no raw hex, no Tailwind color utilities (CLAUDE.md hard rule)
- **`@` import alias** — all cross-directory imports use `@/...`; established in `vite.config.ts`
- **Zustand store location** — `src/store/ui.ts`; `tokenowl_ui` as the localStorage key; `version: 1` set now for future migration support

## Component Design

### Sidebar (`src/components/layout/Sidebar.tsx`)

**Nav items (R2):**

| Label | Route | Lucide Icon |
|---|---|---|
| Dashboard | `/dashboard` | `LayoutDashboard` |
| Sessions | `/sessions` | `MessageSquare` |
| Proposals | `/proposals` | `Lightbulb` |
| Patterns | `/patterns` | `TrendingUp` |
| Effectiveness | `/effectiveness` | `BarChart2` |
| Chat | `/chat` | `Bot` |
| Runs | `/runs` | `Play` |
| Settings | `/settings` | `Settings` |

**Active state (R4):** `useRouterState().location.pathname.startsWith(item.route)` → active: `bg-surface-container text-primary`; inactive: `text-on-surface-variant hover:bg-surface-container-low`

**Collapse (R6):** chevron button at the bottom of the sidebar; expanded = 240px (`--spacing-sidebar-width`); collapsed = 40px icon-only; main content area fills freed space. State owned by `useUIStore().sidebarCollapsed`.

### Header (`src/components/layout/Header.tsx`) — R9

Three flex zones:
- **Left:** "TokenOwl" — `text-headline-md text-primary-container`
- **Center:** empty `<div>` placeholder for global filter bar (Step 6)
- **Right:** static `"No runs"` chip — `bg-surface-container-high text-on-surface-variant text-body-sm rounded-full px-3 py-1`; no click behavior

### UI Store (`src/store/ui.ts`) — R7

```
UIState {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
}
persist: name='tokenowl_ui', version=1, partialize: sidebarCollapsed only
```

### `src/app.tsx` — modified

Replace placeholder with `<RouterProvider router={router} />` where `router` is created from the auto-generated `routeTree`.

## Module Boundaries

| Module | Responsibility | Allowed Dependencies |
|---|---|---|
| `src/routes/` | Route components; root layout wiring | `src/components/`, `src/store/` |
| `src/components/layout/` | Sidebar, Header UI | `src/store/`, TanStack Router hooks |
| `src/store/ui.ts` | Cross-page UI state, localStorage persistence | Zustand only; no component imports |
| `src/theme/` | CSS token definitions | None |

## Change Footprint

### New files / modules

| Path | Purpose | Pattern reference |
|---|---|---|
| `src/routes/__root.tsx` | Root layout — Sidebar + Header + Outlet | TanStack Router `__root` convention |
| `src/routes/index.tsx` | Redirect `/` → `/dashboard` | TanStack Router `redirect()` |
| `src/routes/dashboard.tsx` | Stub `<h1>Dashboard</h1>` | — |
| `src/routes/sessions.index.tsx` | Stub `<h1>Sessions</h1>` | — |
| `src/routes/sessions.$id.tsx` | Stub `<h1>Session Detail</h1>` | — |
| `src/routes/proposals.index.tsx` | Stub `<h1>Proposals</h1>` | — |
| `src/routes/proposals.$id.tsx` | Stub `<h1>Proposal Detail</h1>` | — |
| `src/routes/patterns.tsx` | Stub `<h1>Patterns</h1>` | — |
| `src/routes/effectiveness.tsx` | Stub `<h1>Effectiveness</h1>` | — |
| `src/routes/chat.tsx` | Stub `<h1>Chat</h1>` | — |
| `src/routes/runs.tsx` | Stub `<h1>Runs</h1>` | — |
| `src/routes/settings.tsx` | Stub `<h1>Settings</h1>` | — |
| `src/components/layout/Sidebar.tsx` | Sidebar with 8 nav items + collapse toggle | — |
| `src/components/layout/Header.tsx` | Header with app name + static chip | — |
| `src/store/ui.ts` | Zustand UI store with persist | — |
| `src/routeTree.gen.ts` | Auto-generated typed route tree (commit it) | Generated by Vite plugin on `vite dev` |

### Modified files / modules

| Path | What changes here |
|---|---|
| `src/app.tsx` | Replace placeholder with `<RouterProvider router={router} />` |
| `web/vite.config.ts` | Add `TanStackRouterVite()` plugin before `react()` |
| `web/package.json` | Add `@tanstack/react-router`, `@tanstack/router-plugin`, `lucide-react`, `zustand` |

### Touched but not changed (silent-regression hotspots)

| Path | Why it matters |
|---|---|
| `src/main.tsx` | Still renders `<App />`; verify it stays untouched |
| `src/theme/nocturnal-logic.css` | Sidebar and Header consume its tokens — any token rename silently breaks layout |

## Areas of Impact

| Area | Impact | Risk | Why |
|---|---|---|---|
| `src/app.tsx` | Fully replaced | Low | Current content is a throwaway placeholder |
| `src/routeTree.gen.ts` | New generated file; must be committed | Medium | If absent on fresh clone, `tsc` fails before `vite dev` can regenerate it |
| Step 4 (Mock infrastructure) | `main.tsx` will wrap `<RouterProvider>` in `QueryClientProvider` | Low | Clean composition point; no changes to Step 3 code |
| `localStorage` key `tokenowl_ui` | Written for the first time | Low | `version: 1` set now; Zustand persist migration hook available for future schema changes |

**Contract changes:** None — no external API contracts exist yet.

**Cross-cutting ripples:** None — no auth, telemetry, migrations, or CI pipeline changes in this step.

## Cross-Cutting Concerns

- **Errors:** No error handling needed — stubs have no data fetching; TanStack Router handles unknown routes with its default 404 (custom 404 page is out of scope)
- **Logging & metrics:** None at this step
- **Auth / authz:** N/A — local single-user app
- **Performance:** N/A — stubs render no data
- **Security:** N/A — no user input, no API calls
- **Migrations / rollout:** Local dev only; `vite dev` is the only delivery mechanism

## Architecture Decisions Log

| # | Decision | Alternatives | Chosen Because | Satisfies REQs |
|---|---|---|---|---|
| A1 | File-based routing with `@tanstack/router-plugin` | Code-based routing (no Vite plugin) | Auto-generates typed route tree; matches planned file structure in `docs/FRONTEND_PROPOSAL.md` §6; no manual route registration | R1, R3, R8 |
| A2 | Zustand `persist` middleware with `partialize` | Manual `localStorage` read/write | Handles hydration correctly; `partialize: { sidebarCollapsed }` pins exact persisted key; eliminates boilerplate | R7 |
| A3 | Sidebar and Header as separate components in `src/components/layout/` | Inline in `__root.tsx` | Follows FRONTEND_PROPOSAL.md structure; composable for future feature additions | R2, R6, R9 |
| A4 | Commit `routeTree.gen.ts` | Gitignore it | TanStack Router convention; ensures `tsc` passes on fresh clone before `vite dev` runs | N2 |
| A5 | Prefix active matching (`pathname.startsWith(route)`) | Exact path matching | Keeps user oriented when drilling into detail pages (`/sessions/$id` keeps Sessions highlighted) | R4, R5 |

## Risk & Stress-Test Scenarios

### Forward — runtime failure scenarios

| Scenario | How the design handles it |
|---|---|
| `routeTree.gen.ts` missing on fresh clone | Committing it (A4) prevents this; Vite plugin regenerates on `vite dev` regardless |
| Navigate to `/sessions/unknown-id` | Stub renders `<h1>Session Detail</h1>` regardless of param — no data fetching, no crash |
| `localStorage` cleared or unavailable | Zustand store falls back to initial state (`sidebarCollapsed: false`) — expanded by default (REQ decision D4) |
| Sidebar collapse state lost on hard reload | Persist middleware rehydrates from localStorage before first render |

### Backward — regression risk per touched area

| Touched area | What could regress | Mitigation |
|---|---|---|
| `src/app.tsx` | Nothing — it is a placeholder with no other consumers | Visual smoke-test: confirm `<RouterProvider>` renders without error |
| `vite.config.ts` | Plugin order matters — `TanStackRouterVite()` must precede `react()` | Verify order in code; Vite will warn if misconfigured |

## Open Questions

- None — design is fully resolved for Step 3.

## Out of Scope

- Global filter bar (Step 6)
- Run status indicator behavior — static chip only in this step
- TanStack Query / QueryClientProvider (Step 4)
- MSW service worker (Step 4)
- shadcn/ui primitives (Step 6)
- Responsive / mobile layout (V1 is desktop-only)
- Custom 404 page (later step)
- Any data fetching in route components (Step 5+)

---

# Tasks

## Task T1: Test infrastructure — vitest + RTL + jsdom

> **Status:** done
> **Effort:** xs
> **Priority:** critical
> **Depends on:** None
> **Satisfies REQs:** N1, N2 (enables verification of all other REQs)
> **Footprint slice:** New: `vitest.config.ts`, `src/test-setup.ts`, `src/smoke.test.tsx`; Modified: `web/package.json` (test dev-deps + `test` script)
> **High-risk areas touched:** None

### Description

Install and configure the test harness — vitest, React Testing Library, user-event, jest-dom, and jsdom — so every subsequent task can write failing tests first. The only production output of this task is the config; the only test is a trivial smoke test that proves the entire pipeline is wired.

### Test Plan

#### Test File(s)
- `src/smoke.test.tsx`

#### Test Scenarios

##### Harness smoke test
- **renders a React component** — GIVEN a trivial React component WHEN rendered with RTL's `render` THEN `screen.getByText` finds the expected text *(verifies vitest + jsdom + RTL + jest-dom custom matchers are all wired end-to-end)*

### Implementation Notes

- **Test runner:** `vitest` — native Vite integration, zero extra config for aliases
- **DOM environment:** `jsdom` — set in `vitest.config.ts` as `environment: 'jsdom'`
- **Setup file:** `src/test-setup.ts` — imports `@testing-library/jest-dom` to register custom matchers (`toBeInTheDocument`, `toHaveClass`, etc.); referenced in `vitest.config.ts` as `setupFiles`
- **`@` alias:** must be replicated in `vitest.config.ts` (not inherited from `vite.config.ts`) — same `resolve.alias` block pointing `@` to `./src`
- **Globals:** enable `globals: true` in vitest config so tests don't need to import `describe`/`it`/`expect`
- **Dev-deps to add:** `vitest`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `jsdom`
- **Script to add:** `"test": "vitest"` and `"test:run": "vitest run"` in `package.json`
- **`vitest.config.ts` is separate from `vite.config.ts`** — keeps test config isolated; both files coexist

### Scope Boundaries

- Do NOT add any production source files
- Do NOT configure coverage reporting (separate concern, later step)
- Do NOT add Playwright or any E2E framework
- Only prove the test harness works — one smoke test is the entire deliverable

### Files Expected

**New files:**
- `web/vitest.config.ts` — vitest config: jsdom environment, globals, setupFiles, `@` alias
- `src/test-setup.ts` — imports `@testing-library/jest-dom`
- `src/smoke.test.tsx` — single render smoke test

**Modified files:**
- `web/package.json` — add 5 test dev-deps; add `test` and `test:run` scripts

**Must NOT modify:**
- `src/main.tsx` (regression hotspot — untouched throughout)
- `src/app.tsx` (owned by T2)
- `web/vite.config.ts` (owned by T2)
- `src/theme/nocturnal-logic.css` (untouched throughout)

---

## Task T2: Router foundation — packages, config, stub routes, redirect

> **Status:** done
> **Effort:** m
> **Priority:** critical
> **Depends on:** T1
> **Satisfies REQs:** R1, R8, N2
> **Footprint slice:** New: `src/routes/__root.tsx` (Outlet-only skeleton), `src/routes/index.tsx`, 10 stub route files, `src/routeTree.gen.ts`, `src/routes/__tests__/routing.test.tsx`; Modified: `web/package.json` (prod deps), `web/vite.config.ts` (router plugin), `src/app.tsx`
> **High-risk areas touched:** `src/routeTree.gen.ts` (Medium — must be committed; if absent on clone, `tsc` fails)

### Description

Install the four production packages, wire TanStack Router into the app, create all 12 route files (10 stubs + root layout skeleton + index redirect), and generate and commit `routeTree.gen.ts`. After this task every route is reachable by URL and TypeScript is happy. Layout components (Sidebar, Header) are not yet built — `__root.tsx` renders `<Outlet />` only.

### Test Plan

#### Test File(s)
- `src/routes/__tests__/routing.test.tsx`

#### Test Scenarios

##### Redirect
- **`/` redirects to `/dashboard`** — GIVEN the app renders with the router at `/` WHEN the router resolves THEN the current pathname is `/dashboard` and the Dashboard heading is visible *(R1)*

##### Route rendering
- **each of the 10 routes renders its heading** — parameterised over all 10 paths (`/dashboard`, `/sessions`, `/sessions/test-id`, `/proposals`, `/proposals/test-id`, `/patterns`, `/effectiveness`, `/chat`, `/runs`, `/settings`) WHEN the app renders at each path THEN a heading matching the page name is visible and there is no crash *(R8)*

##### Stress-test
- **`/sessions/$id` renders with an arbitrary param** — GIVEN the app renders at `/sessions/unknown-id` WHEN the route resolves THEN `Session Detail` heading is visible and no error is thrown *(ARCH forward stress-test)*

##### Regression guard
- **`src/main.tsx` is untouched** — GIVEN the implementation is complete THEN `src/main.tsx` still only renders `<App />`; no router imports, no route imports *(ARCH backward-regression: `src/main.tsx`)*

### Implementation Notes

- **Prod packages to add:** `@tanstack/react-router`, `@tanstack/router-plugin`, `lucide-react`, `zustand`
- **Vite plugin order:** `TanStackRouterVite()` must be listed BEFORE `react()` in the plugins array (A1) — Vite plugin order matters
- **`routeTree.gen.ts` generation:** this file is auto-generated by the Vite plugin on first `vite dev` or `vite build` run; it cannot be created manually. TDD sequence: create route files first, then run `vite dev` briefly to generate it, then wire `app.tsx`
- **Commit `routeTree.gen.ts`:** must be committed (A4) — ensures `tsc --noEmit` passes on a fresh clone before `vite dev` runs
- **`__root.tsx` in this task:** renders `<Outlet />` only — no Sidebar or Header yet. Those are wired in T4.
- **Testing TanStack Router:** use `createRouter` with `createMemoryHistory({ initialEntries: ['/target-path'] })` in tests; wrap with `RouterProvider`. This gives a fully functional in-memory router without a browser.
- **`main.tsx` stays untouched** — `app.tsx` is the entry point for router wiring; `main.tsx` only renders `<App />`

### Scope Boundaries

- Do NOT implement Sidebar or Header — `__root.tsx` renders `<Outlet />` only
- Do NOT add TanStack Query or MSW (Step 4)
- Do NOT add any data fetching to route stubs
- Do NOT use inline hex colors in any stub component

### Files Expected

**New files:**
- `src/routes/__root.tsx` — root layout skeleton: `<Outlet />` only (Sidebar + Header added in T4)
- `src/routes/index.tsx` — redirect `/` → `/dashboard`
- `src/routes/dashboard.tsx` — stub `<h1>Dashboard</h1>`
- `src/routes/sessions.index.tsx` — stub `<h1>Sessions</h1>`
- `src/routes/sessions.$id.tsx` — stub `<h1>Session Detail</h1>`
- `src/routes/proposals.index.tsx` — stub `<h1>Proposals</h1>`
- `src/routes/proposals.$id.tsx` — stub `<h1>Proposal Detail</h1>`
- `src/routes/patterns.tsx` — stub `<h1>Patterns</h1>`
- `src/routes/effectiveness.tsx` — stub `<h1>Effectiveness</h1>`
- `src/routes/chat.tsx` — stub `<h1>Chat</h1>`
- `src/routes/runs.tsx` — stub `<h1>Runs</h1>`
- `src/routes/settings.tsx` — stub `<h1>Settings</h1>`
- `src/routeTree.gen.ts` — auto-generated; run `vite dev` to produce, then commit
- `src/routes/__tests__/routing.test.tsx` — routing tests

**Modified files:**
- `web/package.json` — add `@tanstack/react-router`, `@tanstack/router-plugin`, `lucide-react`, `zustand` as dependencies
- `web/vite.config.ts` — add `TanStackRouterVite()` plugin before `react()`
- `src/app.tsx` — replace placeholder with `<RouterProvider router={router} />`

**Must NOT modify:**
- `src/main.tsx` (regression hotspot — covered by regression-guard test)
- `src/theme/nocturnal-logic.css`
- `src/store/ui.ts` (owned by T3)
- `src/components/layout/` (owned by T4)

### TDD Sequence

1. Write `routing.test.tsx` with all scenarios → RED (no router, no routes)
2. Install prod packages, update `vite.config.ts`
3. Create all 12 route files (`__root.tsx` with Outlet only, `index.tsx`, 10 stubs)
4. Run `vite dev` briefly to generate `routeTree.gen.ts`
5. Update `src/app.tsx` with `RouterProvider`
6. Run tests → GREEN
7. Run `tsc --noEmit` → confirm N2 passes

---

## Task T3: UI store — sidebar collapse with localStorage persistence

> **Status:** done
> **Effort:** s
> **Priority:** high
> **Depends on:** T1
> **Satisfies REQs:** R6, R7
> **Footprint slice:** New: `src/store/ui.ts`, `src/store/__tests__/ui.test.ts`
> **High-risk areas touched:** None

### Description

Create the Zustand UI store that owns `sidebarCollapsed` state, persisted to `localStorage` under the `tokenowl_ui` key with `version: 1`. This is a pure state module — no React components, no router dependency. T4 consumes it.

### Test Plan

#### Test File(s)
- `src/store/__tests__/ui.test.ts`

#### Test Scenarios

##### Initial state
- **defaults to expanded** — GIVEN a fresh store with no `tokenowl_ui` in localStorage WHEN the store is read THEN `sidebarCollapsed` is `false` *(REQ D4)*

##### Toggle
- **`toggleSidebar` collapses** — GIVEN `sidebarCollapsed` is `false` WHEN `toggleSidebar` is called THEN `sidebarCollapsed` is `true` *(R6)*
- **`toggleSidebar` expands** — GIVEN `sidebarCollapsed` is `true` WHEN `toggleSidebar` is called THEN `sidebarCollapsed` is `false` *(R6)*

##### Persistence
- **writes to localStorage under `tokenowl_ui`** — GIVEN `toggleSidebar` is called WHEN `localStorage.getItem('tokenowl_ui')` is read THEN the value contains `"sidebarCollapsed":true` *(R7)*
- **rehydrates from localStorage on init** — GIVEN `localStorage` contains `tokenowl_ui` with `sidebarCollapsed: true` WHEN a fresh store instance is read THEN `sidebarCollapsed` is `true` *(R7)*
- **defaults to `false` when localStorage is cleared** — GIVEN `localStorage` is empty WHEN the store initialises THEN `sidebarCollapsed` is `false` *(REQ edge case)*

##### Schema version
- **persist entry contains `version: 1`** — GIVEN `toggleSidebar` is called WHEN the localStorage entry is parsed THEN `"version"` is `1` *(ARCH forward stress-test — enables future migrations)*

### Implementation Notes

- **Library:** `zustand` + `persist` middleware from `zustand/middleware` (A2)
- **Store shape:** `{ sidebarCollapsed: boolean, toggleSidebar: () => void }`
- **Persist config:** `name: 'tokenowl_ui'`, `version: 1`, `partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed })` — only `sidebarCollapsed` is persisted, not the action
- **Test isolation:** call `localStorage.clear()` in `beforeEach` to prevent state leaking between tests; also reset the Zustand store between tests using the store's built-in `setState` or by re-importing with `vi.resetModules()`
- **Module location:** `src/store/ui.ts` — no component imports, no router imports (module boundary from ARCH)

### Scope Boundaries

- Do NOT add any state beyond `sidebarCollapsed` and `toggleSidebar`
- Do NOT import React or any component in this file
- Do NOT use manual `localStorage.getItem/setItem` — use persist middleware exclusively (A2)

### Files Expected

**New files:**
- `src/store/ui.ts` — Zustand store with persist middleware
- `src/store/__tests__/ui.test.ts` — store tests

**Must NOT modify:**
- `src/app.tsx` (owned by T2)
- `src/routes/` (owned by T2)
- `src/components/` (owned by T4)

---

## Task T4: Layout components — Sidebar, Header, root wiring

> **Status:** not started
> **Effort:** m
> **Priority:** high
> **Depends on:** T2, T3
> **Satisfies REQs:** R2, R3, R4, R5, R6, R7 (via store), R9, R10
> **Footprint slice:** New: `src/components/layout/Sidebar.tsx`, `src/components/layout/Header.tsx`, 3 test files; Modified: `src/routes/__root.tsx` (add Sidebar + Header)
> **High-risk areas touched:** None

### Description

Build the Sidebar (8 nav items with Lucide icons, prefix-match active state, collapse toggle driven by the UI store) and Header (app name, static "No runs" chip, center placeholder), then wire both into `__root.tsx`. After this task the full layout shell is complete and all REQ acceptance criteria are met.

### Test Plan

#### Test Files
- `src/components/layout/__tests__/Sidebar.test.tsx`
- `src/components/layout/__tests__/Header.test.tsx`
- `src/routes/__tests__/layout-integration.test.tsx`

#### Test Scenarios

##### Sidebar — nav items *(R2, R3)*
- **renders all 8 nav items** — GIVEN the Sidebar renders THEN 8 navigation links are present in the DOM *(R2)*
- **each nav item links to its correct route** — GIVEN the Sidebar renders THEN each item's `href` (or `to` prop) matches its defined path *(R3)*

##### Sidebar — active state *(R4, A5)*
- **Dashboard highlighted on `/dashboard`** — GIVEN the router is at `/dashboard` THEN the Dashboard item has active styling AND no other item does *(R4)*
- **Sessions highlighted on `/sessions`** — GIVEN router at `/sessions` THEN Sessions item is active *(R4)*
- **Sessions highlighted on `/sessions/abc` (prefix match)** — GIVEN router at `/sessions/abc` THEN Sessions item is active, not deactivated by the nested route *(R4, A5)*
- **Proposals highlighted on `/proposals/xyz` (prefix match)** — GIVEN router at `/proposals/xyz` THEN Proposals item is active *(R4, A5)*
- **exactly one item active at a time** — GIVEN the router is at any of the 8 nav routes THEN exactly one nav item has active styling *(R4)*

##### Sidebar — no-op on active item *(R5)*
- **clicking the active nav item does not trigger navigation** — GIVEN router at `/dashboard` WHEN the Dashboard item is clicked THEN the URL remains `/dashboard` and no navigation event fires *(R5)*

##### Sidebar — collapse *(R6)*
- **chevron button is present at the bottom** — GIVEN the Sidebar renders THEN a toggle button exists *(R6)*
- **clicking chevron hides labels** — GIVEN sidebar is expanded WHEN the chevron is clicked THEN all 8 nav item labels are not visible *(R6)*
- **icons remain visible when collapsed** — GIVEN sidebar is collapsed THEN icon elements are still present in the DOM *(R6)*
- **clicking chevron again restores labels** — GIVEN sidebar is collapsed WHEN the chevron is clicked again THEN all 8 labels are visible *(R6)*

##### Header *(R9)*
- **renders "TokenOwl" app name** — GIVEN the Header renders THEN the text "TokenOwl" is present *(R9)*
- **renders "No runs" chip** — GIVEN the Header renders THEN the text "No runs" is present *(R9)*
- **center zone has no interactive elements** — GIVEN the Header renders THEN the center zone contains no buttons, links, or inputs *(R9)*

##### Integration — layout on every route *(R2, R9)*
- **header visible on every route** — GIVEN the full app renders at each of the 10 routes THEN "TokenOwl" is visible on all of them *(R9)*
- **sidebar visible on every route** — GIVEN the full app renders at each of the 10 routes THEN all 8 nav items are present on all of them *(R2)*

### Implementation Notes

- **Active state logic (A5):** `useRouterState().location.pathname.startsWith(item.route)` — prefix match, not exact. Note: `/settings` must not match `/sessions` — ensure route prefixes are distinct (they are: no two routes share a prefix in the nav list)
- **Active styles:** active → `bg-surface-container text-primary`; inactive → `text-on-surface-variant hover:bg-surface-container-low` (token-only, R10)
- **Sidebar width:** expanded = `w-[240px]` using `--spacing-sidebar-width` token; collapsed = `w-10` (40px). Main content area uses `flex-1` to fill freed space automatically.
- **Collapse state:** `useUIStore().sidebarCollapsed` and `useUIStore().toggleSidebar` from T3's store
- **Lucide icons:** import individually (tree-shakeable) — `LayoutDashboard`, `MessageSquare`, `Lightbulb`, `TrendingUp`, `BarChart2`, `Bot`, `Play`, `Settings` from `lucide-react`
- **Header zones:** flex row with `justify-between`; left = app name, center = empty `<div className="flex-1">`, right = "No runs" chip
- **`__root.tsx` update:** wrap Outlet with a flex layout — sidebar on the left, header + outlet stacked on the right
- **Testing active state:** use `createMemoryHistory({ initialEntries: ['/target'] })` + `RouterProvider` to give Sidebar a router context at the desired path
- **Testing collapse:** render Sidebar with a test wrapper that provides the Zustand store; call the toggle and assert DOM changes
- **Token-only rule (R10):** no hex values anywhere in either component; Biome check will catch obvious violations

### Scope Boundaries

- Do NOT implement global filter bar in the header center zone (Step 6)
- Do NOT add click behavior to the "No runs" chip (later step)
- Do NOT add any data fetching
- Do NOT use inline hex colors or Tailwind color utilities — tokens only (R10)
- Do NOT add responsive breakpoints (V1 is desktop-only)
- Only update `__root.tsx` to add Sidebar and Header — no other route files change

### Files Expected

**New files:**
- `src/components/layout/Sidebar.tsx` — sidebar with 8 nav items, active state, collapse toggle
- `src/components/layout/Header.tsx` — header with app name, chip, center placeholder
- `src/components/layout/__tests__/Sidebar.test.tsx` — sidebar unit tests
- `src/components/layout/__tests__/Header.test.tsx` — header unit tests
- `src/routes/__tests__/layout-integration.test.tsx` — full-layout integration tests

**Modified files:**
- `src/routes/__root.tsx` — add `<Sidebar />` and `<Header />` around `<Outlet />`

**Must NOT modify:**
- `src/main.tsx` (regression hotspot)
- `src/theme/nocturnal-logic.css`
- `src/store/ui.ts` (owned by T3 — read-only from T4's perspective)
- Any stub route file (`dashboard.tsx`, `sessions.index.tsx`, etc.)

### TDD Sequence

1. Write all test files with all scenarios → RED
2. Implement `Sidebar.tsx` (nav items + active state) → partial GREEN on nav/active tests
3. Implement collapse behavior in `Sidebar.tsx` → GREEN on collapse tests
4. Implement `Header.tsx` → GREEN on header tests
5. Update `__root.tsx` to wire both components → GREEN on integration tests
6. Run `tsc --noEmit` → confirm N2 still passes
