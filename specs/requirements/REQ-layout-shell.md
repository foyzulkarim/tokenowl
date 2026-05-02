# Requirements: Layout Shell — Sidebar, Header, 10 Stub Routes

> **Date:** 2026-05-02
> **Type:** feature
> **Source:** `specs/context/1.md` · GitHub issue #1 · `docs/PROJECT_PLAN.md` §Step 3
> **Phase:** 1 of 5 (Requirement Engineering)

## Summary

Build a persistent, navigable app shell — collapsible sidebar with 8 nav items, a top header with a static run-status chip, and 10 stub route components — so every page in TokenOwl is reachable by URL before any real data is wired up. This is the foundation every subsequent build step (mock infrastructure, fixtures, page implementations) is developed and visually verified against.

## Problem & Motivation

Without a navigable shell, no subsequent step can be developed in context. Every feature from Step 4 onward depends on being able to navigate to the right route and see the page render inside the correct persistent layout. Building the shell first also validates that routing, token-based styling, and sidebar state management all work end-to-end before any data concerns are introduced.

## Users & Consumers

- **Developer (single user)** — navigates between pages while building subsequent steps; needs every route reachable and every layout component visually correct before data work begins.

## Functional Requirements

| ID | Requirement | Acceptance Criterion |
|----|---|---|
| R1 | Visiting `/` redirects automatically to `/dashboard` | Loading `http://localhost:PORT/` in a browser renders the Dashboard stub with no manual navigation; URL shows `/dashboard` |
| R2 | Sidebar displays 8 nav items with icons: Dashboard, Sessions, Proposals, Patterns, Effectiveness, Chat, Runs, Settings | All 8 items are visible in the sidebar on every page, each accompanied by a distinct icon |
| R3 | Clicking a sidebar nav item navigates to the corresponding route and updates the browser URL | Clicking each of the 8 items updates the URL to its path; the browser back button returns to the previous route |
| R4 | The nav item for the current section is visually highlighted; no other item is highlighted simultaneously | On `/dashboard`: Dashboard highlighted. On `/sessions` and `/sessions/$id`: Sessions highlighted. On `/proposals` and `/proposals/$id`: Proposals highlighted. Same prefix rule applies for all 8 items |
| R5 | Clicking the already-active nav item does nothing | Clicking the highlighted nav item a second time does not re-navigate or cause a visible change |
| R6 | The sidebar has a collapse toggle that shrinks it to icon-only width | Clicking the chevron button at the bottom of the sidebar collapses it: labels disappear, only icons remain, main content area expands to fill the freed space. Clicking again restores expanded state |
| R7 | Sidebar collapse state persists across page reloads | If the sidebar is collapsed when the page is refreshed, it remains collapsed on reload. If expanded, it remains expanded |
| R8 | Each of the 10 routes renders a stub with a visible page heading | Navigating to `/dashboard`, `/sessions`, `/sessions/$id`, `/proposals`, `/proposals/$id`, `/patterns`, `/effectiveness`, `/chat`, `/runs`, `/settings` each renders a heading matching the page name; no route crashes or shows a blank screen |
| R9 | The header is visible on every route with three zones: app name left, filter bar placeholder center, run-status chip right | "TokenOwl" appears on the left on every route. A static "No runs" chip appears on the right. The center area is empty but visually reserved |
| R10 | All visual styling uses Nocturnal Logic design tokens exclusively | No inline hex color values anywhere in the component tree; all colors reference token classes |

## Non-Functional Requirements

| ID | Requirement | Acceptance Criterion |
|----|---|---|
| N1 | No console errors on any navigable route | Opening browser devtools on each of the 10 routes shows zero errors in the console |
| N2 | TypeScript strict mode passes with no errors | `tsc --noEmit` exits with code 0 after implementation |

## Behaviors & Domain Rules

**Navigation:**
- Sidebar nav items use prefix matching for active state, not exact matching. A user drilling into a detail page (e.g., `/sessions/abc`) should see themselves still "in Sessions" — the list page item stays highlighted.
- The redirect from `/` to `/dashboard` is immediate; no intermediate loading state is visible.

**Sidebar collapse:**
- Collapsed state: icons visible, labels hidden, sidebar width shrinks. Main content area expands to fill the reclaimed space.
- Expanded state: icons and labels both visible at full width.
- The toggle affordance is a chevron button at the bottom of the sidebar — this follows the VS Code / Linear pattern and keeps the header clean.
- Collapse state is the only cross-page UI preference managed in this step. The localStorage key namespace is `tokenowl_` (e.g., `tokenowl_ui`).

**Header:**
- The "No runs" chip is entirely static in this step — no click behavior, no queue depth, no live data. It is a visual placeholder only.
- The center zone of the header is visually reserved for the global filter bar (Step 6) but contains no interactive elements in this step.

**Stub routes:**
- Each stub renders its page name as a heading. No data, no components beyond the heading. This is intentionally minimal — the value is the routing and layout, not the page content.
- Session Detail (`/sessions/$id`) and Proposal Detail (`/proposals/$id`) are reachable by URL but are not in the sidebar. They are click-through destinations for future steps.

**Why these rules matter:**
- Prefix active matching prevents the nav from "going dark" when a user drills into a detail page — a common first-attempt mistake that makes the app feel broken.
- Token-only styling is a hard invariant. Breaking it now means later pages have inconsistent appearance and the design system loses its value.

**Common first-attempt mistakes:**
- Using exact-path matching for active state → Sessions item deactivates when viewing a session detail
- Hardcoding the sidebar width as a pixel value instead of using `--spacing-sidebar-width` token
- Importing a color directly (e.g., `#FFC107`) instead of a token class (`text-primary-container`)
- Forgetting that `/sessions` and `/sessions.index` are different routes in file-based routing

## Edge Cases & Failure Modes

| Scenario | Decision | Rationale |
|---|---|---|
| User visits an unknown route (e.g., `/foo`) | Default router 404 behavior; no custom 404 page | Out of scope for this step; handled in a later step |
| `localStorage` is cleared or unavailable | Sidebar defaults to expanded | Expanded is the safe default; no data loss risk |
| User clicks the already-active nav item | No-op; no re-navigation | Standard nav convention; avoids unnecessary re-renders |
| Viewport is very narrow | No responsive requirement | TokenOwl is a local desktop app; mobile layout is out of scope for V1 |

## Decisions Log

| # | Decision | Alternatives Considered | Chosen Because |
|---|---|---|---|
| 1 | Prefix active matching for sidebar highlight | Exact path matching | Keeps the user oriented when drilling into detail pages; exact matching would deactivate the item on `/sessions/$id` |
| 2 | Chevron toggle at the bottom of the sidebar | Hamburger in the header, click-on-logo | Dev-tool standard (VS Code, Linear); header stays clean; affordance is in the sidebar where it belongs |
| 3 | Main content area expands on collapse | Fixed layout regardless of sidebar state | Maximizes working area — the reason to collapse is to get more screen real estate |
| 4 | Collapsed state defaults to expanded if localStorage is cleared | Default to collapsed | Expanded is the safe, discoverable default for a first run |

## Scope Boundaries

### In Scope
- Sidebar with 8 nav items, active state, collapse toggle, persisted collapse state
- Header with app name, static "No runs" chip, center placeholder
- Redirect `/` → `/dashboard`
- 10 stub route components (heading only)
- Token-only styling throughout

### Out of Scope
- Global filter bar (Step 6)
- Run status indicator behavior — static chip only in this step (later step)
- TanStack Query and MSW (Step 4)
- Responsive / mobile layout (out of scope for V1)
- Custom 404 page (later step)
- Any data fetching in route components (Step 5+)
- shadcn/ui primitives (Step 6)

## Open Questions

- None — all behavioral decisions are resolved.

---
_This requirements document is the input for the **plan-architecture** skill._
_Architecture already produced: run `/generate-tasks from: specs/architecture/ARCH-layout-shell.md` to continue._
