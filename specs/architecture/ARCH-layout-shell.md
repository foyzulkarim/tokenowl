# Architecture: Layout Shell — Sidebar, Header, 10 Stub Routes

> **Date:** 2026-05-02
> **Phase:** 2 of 5 (System Architecture)
> **Requirements source:** GitHub issue #1 · `specs/context/1.md` · `docs/PROJECT_PLAN.md` §Step 3
> **Type:** feature

## Architecture Summary

This step wires TanStack Router into the existing React scaffold, replacing the `app.tsx` placeholder with a `<RouterProvider>`. A root layout (`__root.tsx`) composes a persistent `<Sidebar>` (8 nav items, collapse toggle) and `<Header>` (app name, static run-status chip, filter bar placeholder) around an `<Outlet>` that renders 10 stub route components. A Zustand store with persist middleware manages sidebar collapse state in `localStorage`. No data fetching, no MSW, no TanStack Query — this step is purely navigation and layout.

## High-Level Structure

```
main.tsx
  └── <App /> → <RouterProvider router={router}>
        └── __root.tsx
              ├── <Sidebar />       ← 240px left rail, 8 nav items, collapse toggle
              ├── <Header />        ← full-width top bar
              └── <Outlet />        ← swapped by router on navigation
                    ├── /dashboard
                    ├── /sessions
                    ├── /sessions/$id
                    ├── /proposals
                    ├── /proposals/$id
                    ├── /patterns
                    ├── /effectiveness
                    ├── /chat
                    ├── /runs
                    ├── /settings
                    └── / → redirect to /dashboard
```

**Data flow:**
1. User clicks a sidebar nav item → TanStack Router updates URL
2. `<Outlet />` swaps to the matching stub route component
3. `<Sidebar />` reads `useRouterState().location.pathname` to compute active item
4. Collapse toggle reads/writes `useUIStore().sidebarCollapsed` → persisted to `localStorage['tokenowl_ui']`

## Tech Choices

| Area | Decision | Alternatives Considered | Rationale |
|---|---|---|---|
| Routing | `@tanstack/react-router` + `@tanstack/router-plugin` | React Router v7 | File-based routing with auto-generated typed route tree; URL search params for filters in later steps; spec-mandated |
| Icons | `lucide-react` | Material Symbols, Heroicons | Tree-shakeable React components; no font loading; spec-mandated |
| UI state | `zustand` + `persist` middleware | Manual `localStorage` | Built-in hydration handling; `partialize` pins exact persisted keys; no boilerplate |
| Styling | Nocturnal Logic tokens via Tailwind v4 | — | CLAUDE.md hard requirement; no inline hex |

## Patterns & Conventions

- **File-based routing** — one file per route in `src/routes/`; `__root.tsx` is the layout wrapper; `.index.tsx` suffix for list routes; `.$id.tsx` for param routes (TanStack Router convention)
- **Collocated layout components** — `src/components/layout/` for Sidebar and Header, not inlined in `__root.tsx`
- **Token-only styling** — `bg-surface`, `text-on-surface`, `text-primary-container`, etc. from `nocturnal-logic.css`; no raw hex or Tailwind color utilities
- **`@` import alias** — all imports use `@/...` (resolves to `src/`); established in `vite.config.ts`
- **Zustand store location** — `src/store/ui.ts`; `tokenowl_` namespace for all localStorage keys

## Component Design

### Sidebar (`src/components/layout/Sidebar.tsx`)

**Nav items:**

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

**Active state:** `useRouterState().location.pathname.startsWith(item.route)` → `bg-surface-container text-primary`; inactive → `text-on-surface-variant hover:bg-surface-container-low`

**Collapse:** toggle via `useUIStore().toggleSidebar`; expanded = 240px (`--spacing-sidebar-width`); collapsed = 40px icon-only with tooltip on hover

### Header (`src/components/layout/Header.tsx`)

Three zones in a flex row:
- **Left:** "TokenOwl" — `text-headline-md text-primary-container`
- **Center:** empty `<div>` placeholder for global filter bar (Step 6)
- **Right:** static `"No runs"` chip — `bg-surface-container-high text-on-surface-variant text-body-sm rounded-full px-3 py-1`

### UI Store (`src/store/ui.ts`)

```ts
interface UIState {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
}
// persist: name 'tokenowl_ui', version: 1, partialize: sidebarCollapsed only
```

### `src/app.tsx`

Replace placeholder with `<RouterProvider router={router} />` where `router` is created from the auto-generated `routeTree`.

## Module Boundaries

| Module | Responsibility | Allowed Dependencies |
|---|---|---|
| `src/routes/` | Route components; layout wiring | `src/components/`, `src/store/` |
| `src/components/layout/` | Sidebar, Header UI | `src/store/`, TanStack Router hooks |
| `src/store/ui.ts` | Cross-page UI state | Zustand only; no component imports |
| `src/theme/` | CSS token definitions | None |

## Change Footprint

### New files / modules

| Path | Purpose | Pattern reference |
|---|---|---|
| `src/routes/__root.tsx` | Root layout — Sidebar + Header + Outlet | TanStack Router convention |
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
| `src/components/layout/Sidebar.tsx` | Sidebar with 8 nav items + collapse | — |
| `src/components/layout/Header.tsx` | Header with app name + static chip | — |
| `src/store/ui.ts` | Zustand UI store with persist | — |
| `src/routeTree.gen.ts` | Auto-generated typed route tree | Generated by Vite plugin; commit it |

### Modified files / modules

| Path | What changes here |
|---|---|
| `src/app.tsx` | Replace placeholder with `<RouterProvider router={router} />` |
| `web/vite.config.ts` | Add `TanStackRouterVite()` plugin before `react()` |
| `web/package.json` | Add `@tanstack/react-router`, `@tanstack/router-plugin`, `lucide-react`, `zustand` |

### Touched but not changed (silent-regression hotspots)

| Path | Why it matters |
|---|---|
| `src/main.tsx` | Still renders `<App />`; no change needed — verify it stays clean |
| `src/theme/nocturnal-logic.css` | Sidebar and Header depend on its tokens; any token rename breaks layout |

## Areas of Impact

| Area | Impact | Risk | Why |
|---|---|---|---|
| `src/app.tsx` | Fully replaced | Low | Current content is a throwaway placeholder |
| `src/routeTree.gen.ts` | New generated file; must be committed | Medium | If absent on clone, TypeScript fails before `vite dev` can regenerate it |
| Step 4 (Mock infrastructure) | `main.tsx` will wrap `<RouterProvider>` in `QueryClientProvider` | Low | Clean composition point; no changes needed to Step 3 code |
| `localStorage` key `tokenowl_ui` | Written for the first time by Zustand persist | Low | Forward-compatible; `version: 1` set now for future migrations |

**Contract changes:** none — no external API contracts exist yet.

**Cross-cutting ripples:** none — no auth, no telemetry, no migrations in this step.

## Cross-Cutting Concerns

- **Errors:** no error handling needed — stubs have no data fetching; TanStack Router handles unknown routes with a 404 by default
- **Logging & metrics:** none at this step
- **Auth / authz:** N/A — local single-user app
- **Performance:** N/A — stubs render nothing
- **Security:** N/A — no user input, no API calls
- **Migrations / rollout:** local dev only; no deploy pipeline

## Architecture Decisions Log

| # | Decision | Alternatives | Chosen Because |
|---|---|---|---|
| A1 | File-based routing with `@tanstack/router-plugin` | Code-based routing (no Vite plugin) | Auto-generates typed route tree; matches file structure in `docs/FRONTEND_PROPOSAL.md` §6; no manual route registration |
| A2 | Zustand `persist` middleware with `partialize` | Manual `localStorage` read/write | Handles hydration correctly out of the box; `partialize: { sidebarCollapsed }` pins the exact persisted key; eliminates boilerplate |
| A3 | `src/components/layout/` for Sidebar and Header | Inline in `__root.tsx` | Matches project structure in FRONTEND_PROPOSAL.md; composable for future feature additions (e.g. run status behavior in Step N) |
| A4 | Commit `routeTree.gen.ts` | Gitignore it | TanStack Router convention; ensures `tsc` passes on fresh clone before `vite dev` runs |

## Risk & Stress-Test Scenarios

### Forward — runtime failure scenarios

| Scenario | How the design handles it |
|---|---|
| `routeTree.gen.ts` missing on fresh clone | Committing it (A4) prevents this; Vite plugin regenerates on `vite dev` regardless |
| Navigate to `/sessions/unknown-id` | Stub renders `<h1>Session Detail</h1>` regardless — no data fetching, no crash |
| Stale `tokenowl_ui` localStorage key from old schema | `version: 1` set now; Zustand persist migration hook can handle future shape changes; store is trivially small at Step 3 |
| Sidebar collapse state lost on hard reload | Persist middleware rehydrates from localStorage before first render |

### Backward — regression risk per touched area

| Touched area | What could regress | Mitigation |
|---|---|---|
| `src/app.tsx` | Nothing — it's a placeholder | Visual smoke-test: confirm `<RouterProvider>` renders without error |
| `vite.config.ts` | Plugin order matters — `TanStackRouterVite()` must come before `react()` | Verify order in code; Vite will warn if plugin order causes issues |

## Open Questions

- None — design is fully resolved for Step 3.

## Out of Scope

- TanStack Query / QueryClientProvider (Step 4)
- MSW service worker setup (Step 4)
- Global filter bar implementation (Step 6)
- Run status indicator behavior — static chip only in this step
- shadcn/ui primitives (Step 6)
- Any data fetching in route components

---

# Tasks

_This section is populated by the **generate-tasks** skill (Phase 3)._
_Run: `/generate-tasks from: specs/architecture/ARCH-layout-shell.md`_
