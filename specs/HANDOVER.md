# Session Handover — feat/1/layout-shell

> **Date:** 2026-05-03
> **Branch:** `feat/1/layout-shell`
> **Picking up at:** PR #16 review fixes complete, ready for merge

---

## What this session accomplished

### Merged two PR review reports into one
- Combined `CODE-REVIEW-PR-16.md` (root) and `web/CODE-REVIEW-PR-16.md` into a single deduplicated report
- Published the merged report as a PR comment: https://github.com/foyzulkarim/tokenowl/pull/16#issuecomment-4365173185
- Deleted `web/CODE-REVIEW-PR-16.md` (duplicate)

### Fixed review findings (Critical + High + Medium)

All changes below are uncommitted and will be committed in this session.

#### Critical fixes (3 findings, all fixed)
| Finding | File | What changed |
|---------|------|--------------|
| TC-1/TC-2: CSS class mismatch | `Sidebar.test.tsx` | `bg-surface-container` → `bg-surface-container-high` in all 5 assertions |
| TC-3: Header test cleanup | `Header.test.tsx` | Removed `beforeEach(render)`, added per-test `render()` + `afterEach(cleanup())` |
| A-1: Nav aria-label | `Sidebar.tsx` | Added `aria-label="Main"` to `<nav>` |

#### High fixes (13 findings, 11 fixed, 2 open)
| Finding | File | What changed |
|---------|------|--------------|
| CQ-2: Unused NAV_ITEMS | `Sidebar.tsx` | Removed `NAV_ITEMS` constant |
| A-2: Collapsed link labels | `Sidebar.tsx` | Added `aria-label={label}` on every `<Link>` |
| A-3: Toggle aria-expanded | `Sidebar.tsx` | Added `aria-expanded={!sidebarCollapsed}` to toggle button |
| A-4: Skip-to-main-content | `__root.tsx` | Added `<a href="#main-content">Skip to main content</a>` with sr-only styles |
| A-5: Focus-visible styles | `Sidebar.tsx` | Added `focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2` to nav links and toggle |
| CD-1: Dependency misclassified | `package.json` | Moved `@tanstack/router-plugin` from `dependencies` to `devDependencies` |
| TS-1: `__dirname` in ESM | `vite.config.ts`, `vitest.config.ts` | Replaced `__dirname` with `fileURLToPath(import.meta.url)` |
| TC-4: vi.stubGlobal timing | `Sidebar.test.tsx`, `layout-integration.test.tsx`, `ui.test.ts` | Moved `vi.stubGlobal` from module top-level to `beforeAll` |
| TC-5: Routing test isolation | `routing.test.tsx` | Added `beforeEach` with `localStorage.clear()` + `useUIStore.setState` reset |
| TC-6: Missing Settings test | `Sidebar.test.tsx` | Added test for `/settings` active state + negative active-state assertions |
| AP-1: ErrorBoundary | `app.tsx` | Added `ErrorBoundary` class component wrapping `RouterProvider` |

#### Medium fixes (14 findings, 10 fixed)
| Finding | File | What changed |
|---------|------|--------------|
| TS-2: Icon type too broad | `Sidebar.tsx` | `React.ElementType` → `LucideIcon` from `lucide-react` |
| CQ-4: Wrong token | `Header.tsx` | `text-primary-container` → `text-primary` (correct semantic token per design system) |
| CQ-3: Fragile active match | `Sidebar.tsx` | `pathname.startsWith(route)` → `pathname === route \|\| pathname.startsWith(route + "/")` |
| RP-1: Store selector | `Sidebar.tsx` | `useUIStore()` → `useUIStore((s) => s.sidebarCollapsed)` + separate selector for toggle |
| RP-2: Router selector | `Sidebar.tsx` | `useRouterState()` → `useRouterState({ select: (s) => s.location.pathname })` |
| A-7: Chevron aria-hidden | `Sidebar.tsx` | Added `aria-hidden` to both `<ChevronLeft>` and `<ChevronRight>` |
| A-8: Status badge role | `Header.tsx` | Changed from `<div>` to `<output>` (implicit `role="status"`) |
| A-9: App name heading | `Header.tsx` | Changed from `<div>` to `<h1>` |
| CQ-5: Named root component | `__root.tsx` | Extracted `function RootLayout()` instead of inline arrow |
| A-11: Main aria-label | `__root.tsx` | Added `aria-label="Main content"` to `<main>` |

#### Low/nice-to-have fixes
| Finding | File | What changed |
|---------|------|--------------|
| Transition animation | `Sidebar.tsx` | Added `transition-[width] duration-200` to aside |
| TC-11: Misleading test | `ui.test.ts` | Fixed rehydration test to actually clear localStorage and re-read |
| TC-12: Weak assertion | `ui.test.ts` | Replaced `toContain('"sidebarCollapsed":true')` with `JSON.parse` + object assertion |
| Biome lint: forEach | All test files | Replaced `forEach` with `for...of` loops |
| Biome lint: imports | Multiple | Fixed import ordering with `biome check --fix` |
| Biome lint: non-null | `ui.test.ts` | Replaced `raw!` with `raw as string` |

### Verification
- 65/65 tests passing
- TypeScript strict mode: clean
- Biome check: clean (excluding auto-generated `routeTree.gen.ts`)

---

## Remaining open findings (with reasoning)

### High severity — not fixed

**AP-2: Zustand rehydration flash**
- **Problem:** On page reload with collapsed sidebar, the sidebar renders expanded for one frame, then collapses after Zustand rehydrates from localStorage.
- **Why not fixed:** Attempted a hydration gate (`useHasHydrated()` hook + `_hasHydrated` state in the store + loading spinner in `__root.tsx`). This blocked all routing and integration tests because `onRehydrateStorage`'s `onSuccess` fires only once at store creation time — after `beforeEach` resets the store, `_hasHydrated` never becomes `true` again in tests. A CSS-based approach (e.g., `visibility: hidden` until hydrated) would work but is a separate change.
- **Impact:** User-visible cosmetic glitch — one-frame flash on reload when sidebar was collapsed. No functional breakage.
- **Recommended fix:** Add a CSS class like `sidebar--hydrating` that hides via `visibility: hidden` (not `display: none` to preserve layout dimensions), remove it after `useUIStore.persist.onFinishHydration` fires. Or accept the flash for V1.

**CQ-1: createJSONStorage wrapper indirection**
- **Problem:** `ui.ts` wraps `localStorage` in a proxy object (`{ getItem: (...args) => localStorage.getItem(...args) }`) instead of using `createJSONStorage(() => localStorage)` directly.
- **Why not fixed:** The simpler form `createJSONStorage(() => localStorage)` broke all 3 test files — after `beforeEach` resets the store, the Zustand persist middleware's internal storage reference doesn't re-evaluate `() => localStorage` properly, causing `setItem` calls to silently fail (writes go to the original jsdom storage, not the mock). The proxy wrapper forces lazy evaluation at call time, which works with `vi.stubGlobal`.
- **Impact:** 3 lines of harmless indirection. No functional issue.
- **Recommended fix:** Either accept it as a testability seam, or centralize the mock in `test-setup.ts` and use `vi.stubGlobal` before any module imports.

### Medium severity — not fixed

**TS-3: `route` prop typed as `string`**
- NavLink's `route` prop is `string`, defeating TanStack Router's type-safe `<Link to>`.
- Needs a union type derived from the route tree. Requires plumbing a type from `routeTree.gen.ts`. Non-trivial type-level work; not blocking.

**CQ-3/A-6: Manual active detection vs TanStack Router native**
- Active state uses `pathname === route || pathname.startsWith(route + "/")` instead of TanStack Router's `activeProps` or `useMatch`.
- The improved pattern works correctly and avoids false positives. Switching to native `activeProps` would be cleaner but requires restructuring the NavLink component to use `Link`'s built-in active styling. The current approach keeps active styling logic explicit and testable.

**DEV-4: Sidebar width hardcoded `w-[240px]`**
- ARCH spec says to use `--spacing-sidebar-width` token. The token exists in `nocturnal-logic.css` but Tailwind v4 doesn't automatically expose CSS custom properties as utilities. Using the token would require `w-[var(--spacing-sidebar-width)]` or a custom Tailwind utility.
- The hardcoded value matches the token value (240px). Visual parity is maintained.

**CD-3: Duplicated resolve.alias between vite.config.ts and vitest.config.ts**
- Both files independently define `@` → `./src`. Must be kept in sync manually. Could be extracted to a shared config file.

---

## Requirements compliance

All 12 requirements from `REQ-layout-shell.md` are satisfied:

| Req | Status | Notes |
|-----|--------|-------|
| R1: `/` redirects to `/dashboard` | PASS | |
| R2: 8 nav items with icons | PASS | |
| R3: Click navigates, updates URL | PASS | |
| R4: Active item highlighted (prefix match) | PASS | Improved over ARCH spec |
| R5: Active item click is no-op | PASS | |
| R6: Sidebar collapse toggle | PASS | |
| R7: Collapse state persists | PASS | `tokenowl_ui` key, `version: 1` |
| R8: 10 routes render stub headings | PASS | |
| R9: Header three zones | PASS | |
| R10: Token-only styling | PASS | Zero inline hex colors |
| N1: No console errors | PASS | |
| N2: TypeScript strict | PASS | |

---

## Files changed this session

### Source files modified
- `web/src/components/layout/Sidebar.tsx` — a11y, selectors, LucideIcon, active matching, focus-visible, transition, removed NAV_ITEMS
- `web/src/components/layout/Header.tsx` — text-primary token, h1, output element
- `web/src/store/ui.ts` — kept lazy localStorage wrapper (test compatibility)
- `web/src/routes/__root.tsx` — named RootLayout, skip-to-main, main aria-label
- `web/src/app.tsx` — ErrorBoundary around RouterProvider
- `web/vite.config.ts` — ESM path resolution, formatted plugin array
- `web/vitest.config.ts` — ESM path resolution
- `web/package.json` — moved @tanstack/router-plugin to devDependencies

### Test files modified
- `web/src/components/layout/__tests__/Sidebar.test.tsx` — fixed CSS assertions, vi.stubGlobal timing, added settings/negative tests
- `web/src/components/layout/__tests__/Header.test.tsx` — per-test render, cleanup
- `web/src/routes/__tests__/routing.test.tsx` — store/localStorage reset, import order
- `web/src/routes/__tests__/layout-integration.test.tsx` — vi.stubGlobal timing, for-of loops
- `web/src/store/__tests__/ui.test.ts` — vi.stubGlobal timing, fixed assertions, for-of loops

### Other
- `CODE-REVIEW-PR-16.md` — merged from two reports, deleted web/ duplicate
