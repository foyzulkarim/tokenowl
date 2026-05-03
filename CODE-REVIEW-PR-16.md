# Review Report

## Metadata

| Field | Value |
|-------|-------|
| **Review Mode** | PR #16 |
| **Target** | https://github.com/foyzulkarim/tokenowl/pull/16 |
| **Date** | 2026-05-03 |
| **Tech Stack** | TypeScript (strict) · React 19 · Vite 6 · TanStack Router v1 · Zustand v5 · Tailwind v4 · Vitest v4 · RTL · jsdom · Biome |
| **Checks Run** | Code Quality · TypeScript Strictness · React Patterns · Test Coverage · Async Patterns · Config/Dependencies · Accessibility |
| **Checks Skipped** | Security (no user input/API surface) · Performance (static layout) · Error Handling (no error paths) · Database Patterns · Express Patterns · Migration · Documentation |
| **Files Changed** | 28 (source) / 42 (total incl. artifacts) |
| **Lines Changed** | +3880 / -151 |

## Review Process

- [x] Preflight checks passed
- [x] Diff gathered (42 files, ~5285 lines; filtered to 28 source files for review)
- [x] Tech stack detected
- [x] Context read (CLAUDE.md, PR description, commit messages)
- [x] Triage agreed with developer (specs/ and Playwright artifacts excluded)
- [x] `.playwright-mcp/` and `*.png` gitignored and untracked during review session
- [x] 7 sub-checks dispatched in parallel
- [x] Results collected and deduplicated
- [x] Report compiled

---

## Verdict: ❌ REQUEST CHANGES

The layout shell is structurally sound and well-scoped — router foundation, store, and components are all in the right places with the right abstractions. However there are **4 Critical issues** (3 in tests, 1 in accessibility), **13 High issues** (including 5 accessibility gaps and an async-pattern gap), and significant medium-severity findings that must be addressed before merge. The most urgent: active-state CSS class assertions in `Sidebar.test.tsx` reference the wrong Tailwind token, meaning those tests do not actually verify what the component renders. The collapsed sidebar also leaves screen reader users with unlabelled interactive elements. Additionally, Zustand persist rehydration is uncoordinated and there is no ErrorBoundary around the router.

### Finding Counts

| Category | 🔴 | 🟠 | 🟡 | 💭 | ⚠️ |
|----------|-----|-----|-----|-----|-----|
| Code Quality | 0 | 2 | 2 | 4 | 1 |
| TypeScript Strictness | 0 | 1 | 2 | 2 | 0 |
| React Patterns | 0 | 0 | 2 | 3 | 1 |
| Test Coverage | 3 | 3 | 6 | 4 | 2 |
| Async Patterns | 0 | 2 | 4 | 0 | 0 |
| Accessibility | 1 | 4 | 3 | 2 | 2 |
| Config/Dependencies | 0 | 1 | 3 | 2 | 3 |
| **Total** | **4** | **13** | **22** | **17** | **9** |

> Deduplication notes: `NAV_ITEMS` unused (flagged by Code Quality, TypeScript, and React Patterns) is counted once under Code Quality at 🟠 High. `pathname.startsWith` active detection (Code Quality + React Patterns + TypeScript) merged under Code Quality 🟡. Anonymous root component (Code Quality + React Patterns) merged under Code Quality 💭. `window.localStorage` wrapper (Code Quality + React Patterns) merged under Code Quality 🟠. CSS class mismatch in tests counted once at 🔴 Critical covering all affected assertions. Header "No runs" stub (Code Quality + React Patterns) merged under Code Quality 💭.

---

## Code Quality

### Findings

| # | Severity | File:Line | Finding |
|---|----------|-----------|---------|
| CQ-1 | 🟠 High | `web/src/store/ui.ts:16-24` | The lazy `window.localStorage` proxy pattern is over-engineered. Each method delegates to `window.localStorage.method` at call time rather than capturing the reference at store creation — but in jsdom `window.localStorage` and the global `localStorage` are the same reference, so `vi.stubGlobal("localStorage", mock)` works equally well with `createJSONStorage(() => localStorage)`. The current form adds indirection without benefit and the comment claiming it enables test stubbing is misleading. The `createJSONStorage` wrapper is redundant. Also breaks on server if SSR is ever added. |
| CQ-2 | 🟠 High | `web/src/components/layout/Sidebar.tsx:30` | `NAV_ITEMS` is declared (`[...MAIN_NAV, ...BOTTOM_NAV] as const`) but never referenced — `MAIN_NAV` and `BOTTOM_NAV` are iterated separately in JSX. With `noUnusedLocals: true` in `tsconfig.json`, this is a **compile error**. Also creates maintenance confusion: future devs may render from `NAV_ITEMS` and lose the bottom separator. Either remove it or use it. |
| CQ-3 | 🟡 Medium | `web/src/components/layout/Sidebar.tsx:73,84-85` | `pathname.startsWith(route)` for active detection is fragile. A hypothetical `/run` route would falsely match `/runs`. More importantly, TanStack Router's `Link` already exposes `activeProps` / `data-status="active"` for this — using `useRouterState` to recompute manually duplicates framework logic and causes re-renders on every navigation. This also bypasses TanStack Router's type-safe `to` prop (where `route` is `string` defeating the type system) and the visual active highlight and `aria-current` semantic may disagree. |
| CQ-4 | 🟡 Medium | `web/src/components/layout/Header.tsx:4` | `text-primary-container` on the "TokenOwl" wordmark is semantically wrong. This token describes text placed *inside* a primary-container surface, not a primary-colored text. On a `bg-surface-container-high` background the correct token is `text-primary` or `text-on-surface`. Using it may render fine with the current theme values but violates the Nocturnal Logic token contract. |
| CQ-5 | 💭 Low | `web/src/routes/__root.tsx:6` | Root route `component` is an anonymous inline arrow function. Named function component (`function RootLayout()`) improves React DevTools readability and stack traces. |
| CQ-6 | 💭 Low | `web/vite.config.ts:8` | `TanStackRouterVite` options line exceeds 120 chars. Pass through `biome format` to stay consistent with the rest of the codebase. |
| CQ-7 | 💭 Low | `web/src/components/layout/Header.tsx:7` | Hardcoded "No runs" without TODO comment marking it as stub. |
| CQ-8 | 💭 Low | `web/src/routes/` (stub routes) | Bare `<h1>` in stub routes without design-system token classes. |
| CQ-9 | ⚠️ Manual | (convention) | `@/` alias convention wording is ambiguous — likely means internal paths only, but CLAUDE.md says "all imports". Confirm convention applies only to internal imports (external packages use their own specifiers). |

---

## TypeScript Strictness

### Findings

| # | Severity | File:Line | Finding |
|---|----------|-----------|---------|
| TS-1 | 🟠 High | `web/vite.config.ts:11`, `web/vitest.config.ts:17` | `__dirname` used in ESM module — CJS global, works only because Vite/Vitest bundle configs. Breaks under `tsc --noEmit` or strict ESM. Replace with ESM-compatible path resolution (`import.meta.dirname` or `fileURLToPath(import.meta.url)`). |
| TS-2 | 🟡 Medium | `web/src/components/layout/Sidebar.tsx:41` | `Icon: React.ElementType` is too broad — it accepts any string tag, class component, or function component, losing all prop safety. All actual values are Lucide icons; use `import { type LucideIcon } from "lucide-react"` and `Icon: LucideIcon`. With `React.ElementType`, the `size={16}` prop on line 54 is not type-checked against `LucideProps`. |
| TS-3 | 🟡 Medium | `web/src/components/layout/Sidebar.tsx:47` | `<Link to={route}>` where `route` is `string` — defeats TanStack Router's type-safe `to` prop. Type `route` as union of valid paths. |
| TS-4 | 💭 Low | `web/src/components/layout/Sidebar.tsx:30` | Unused `NAV_ITEMS` — `noUnusedLocals` should flag this (deduplicated under CQ-2). |
| TS-5 | 💭 Low | `web/src/store/ui.ts:20-24` | Manual localStorage wrapper type fragility (deduplicated under CQ-1). |
| TS-6 | 💭 Low | `web/src/routeTree.gen.ts` | `@ts-nocheck` + 11 `as any` casts — acceptable, auto-generated. |

> `NAV_ITEMS` unused (`noUnusedLocals` compile error) is deduplicated under CQ-2.

---

## React Patterns

### Findings

| # | Severity | File:Line | Finding |
|---|----------|-----------|---------|
| RP-1 | 🟡 Medium | `web/src/components/layout/Sidebar.tsx:61` | `useUIStore()` called without a selector subscribes to the entire store. Any state change (even unrelated future keys) triggers a re-render. Prefer `useUIStore((s) => ({ sidebarCollapsed: s.sidebarCollapsed, toggleSidebar: s.toggleSidebar }))` or two separate selectors. |
| RP-2 | 🟡 Medium | `web/src/components/layout/Sidebar.tsx:62` | `useRouterState()` called without a selector subscribes to all router state changes (pending, preloading, etc.), not just `location.pathname`. Use `useRouterState({ select: (s) => s.location.pathname })` to scope re-renders. |
| RP-3 | 💭 Low | `web/src/components/layout/Sidebar.tsx:46` | `NavLink` not wrapped in `React.memo` — cascading re-renders from broad subscriptions (RP-1, RP-2). Low priority until selectors are in place. |
| RP-4 | 💭 Low | `web/src/app.tsx:6` | Router singleton created at module level (outside component) — this is **correct** for TanStack Router v1 and the `Register` augmentation confirms full type integration. Noted as low because the correct pattern is non-obvious; no change needed for CSR-only. |
| RP-5 | 💭 Low | `web/src/app.tsx:4` | Bare router config — no `errorComponent` or `pendingComponent` configured. |
| RP-6 | ⚠️ Manual | `web/src/app.tsx:4` | Router at module scope — OK for CSR-only. Verify no SSR is planned. |

> `pathname.startsWith` active detection deduplicated under CQ-3. Anonymous root component deduplicated under CQ-5. Hardcoded "No runs" deduplicated under CQ-7.

---

## Test Coverage

### Findings

| # | Severity | File:Line | Finding |
|---|----------|-----------|---------|
| TC-1 | 🔴 Critical | `web/src/components/layout/__tests__/Sidebar.test.tsx:68,73,77,82` | Active-state assertions check for `bg-surface-container` but the component applies `bg-surface-container-high`. `toHaveClass` performs exact token matching — it will not find `bg-surface-container` on the element. These 4 assertions are either always failing (if the suite reports them green, something else is wrong) or they are silently green because `toHaveClass` is checking for a class that is never present. **Confirmed via `vitest run` — 5 failed, 58 passed.** Fix: assert `bg-surface-container-high`. |
| TC-2 | 🔴 Critical | `web/src/components/layout/__tests__/Sidebar.test.tsx:89` | `document.querySelectorAll("a.bg-surface-container")` will match zero elements (same token mismatch as TC-1). The `toHaveLength(1)` assertion verifying exactly one active link is broken. Fix: query for `a.bg-surface-container-high`. |
| TC-3 | 🔴 Critical | `web/src/components/layout/__tests__/Header.test.tsx:4-6` | `render(<Header />)` is called inside `beforeEach` with no `afterEach(() => cleanup())`. RTL's auto-cleanup fires after each *test*, but because rendering happens in `beforeEach` (before the test body), the DOM state accumulates if cleanup timing is off. More critically, there is no `describe` wrapper scoping the `beforeEach`, so a render fires before every test in the file. The `querySelectorAll("button")` count assertion on test 2+ would multiply if prior renders persist. Add `afterEach(() => cleanup())` or move render inside each test. |
| TC-4 | 🟠 High | `web/src/components/layout/__tests__/Sidebar.test.tsx:12-19` | `vi.stubGlobal("localStorage", ...)` is called at module top-level (not in a `beforeAll`). When vitest runs multiple test files in the same worker, the stub evaluates at import time and `unstubAllGlobals` in `afterAll` may remove it before sibling files finish. Move to `beforeAll(() => vi.stubGlobal(...))`. The same pattern is duplicated in `layout-integration.test.tsx` and `ui.test.ts` — consider centralising in `test-setup.ts`. |
| TC-5 | 🟠 High | `web/src/routes/__tests__/routing.test.tsx` | No `beforeEach` resets `useUIStore` state or clears localStorage. The full route tree is rendered (including Sidebar), so if another test file leaves `sidebarCollapsed: true` in the store, routing tests render a collapsed sidebar. Add `beforeEach(() => useUIStore.setState({ sidebarCollapsed: false }))` and `localStorage.clear()`. |
| TC-6 | 🟠 High | `web/src/components/layout/__tests__/Sidebar.test.tsx` | No test for `/settings` active state — Settings is entirely untested for active highlighting. |
| TC-7 | 🟡 Medium | `web/src/components/layout/__tests__/Sidebar.test.tsx:59-62` | `it.each` renders `Sidebar` once per iteration with no guaranteed cleanup between iterations. If RTL auto-cleanup does not fire between `it.each` cases, DOM accumulates and `screen.getByRole("link", { name: label })` will throw "found multiple elements" on the second iteration. Verify cleanup fires between iterations or add explicit cleanup. |
| TC-8 | 🟡 Medium | `web/src/components/layout/__tests__/Sidebar.test.tsx:86-89` | `document.querySelectorAll("a.bg-surface-container-high")` (after TC-2 fix) spans the full jsdom document. If multiple renders from TC-7 have accumulated, this count will be wrong. Prefer `within(screen.getByRole("navigation")).querySelectorAll(...)`. |
| TC-9 | 🟡 Medium | `web/src/routes/__tests__/layout-integration.test.tsx:49-59` | 10 routes × 2 test groups = 20 `RouterProvider` renders potentially stacking if auto-cleanup is unreliable. The `getByRole("link", { name: label })` calls inside `it.each` will throw "found multiple elements" if prior renders persist. Same mitigation as TC-7. |
| TC-10 | 🟡 Medium | `web/src/routes/__tests__/routing.test.tsx:50-58` | `readFileSync` + string assertion on `main.tsx` content is a brittle integration check. A dynamic import or aliased re-export would silently produce a false green. Consider removing or replacing with a lint rule. |
| TC-11 | 🟡 Medium | `web/src/store/__tests__/ui.test.ts:49-53` | "defaults to false when localStorage is cleared" test calls `useUIStore.setState({ sidebarCollapsed: false })` then immediately asserts `sidebarCollapsed === false`. It is asserting what it just forced — not testing rehydration logic. The test would pass even if persist rehydration were broken. |
| TC-12 | 🟡 Medium | `web/src/store/__tests__/ui.test.ts:37` | Weak `toContain('"sidebarCollapsed":true')` — should parse JSON and assert on object structure instead of string matching. |
| TC-13 | 🟡 Medium | `web/src/routes/__tests__/routing.test.tsx:43` | Stress-test only covers one dynamic route (`/sessions/unknown-id`). |
| TC-14 | 💭 Low | `web/src/components/layout/__tests__/Sidebar.test.tsx:54-57` | "renders all 8 nav items" counts total `<a>` elements — 8 links to the same route would pass. The `it.each` block below covers specifics more precisely; this count test adds less signal than it appears. |
| TC-15 | 💭 Low | `web/src/smoke.test.tsx` | Smoke test renders a bare `<div>` rather than `<App />`. It confirms jsdom works but gives no signal about the real entry point. Consider rendering `App` with a memory router to confirm the top-level component mounts without throwing. |
| TC-16 | 💭 Low | `web/src/components/layout/__tests__/Sidebar.test.tsx`, `web/src/routes/__tests__/layout-integration.test.tsx` | Hardcoded nav items in tests rather than importing shared constant. |
| TC-17 | 💭 Low | `web/src/routes/__tests__/routing.test.tsx:48` | `readFileSync` in test — unusual pattern, consider import or async approach. |
| TC-18 | ⚠️ Manual | `web/src/components/layout/__tests__/Sidebar.test.tsx:106-112` | "clicking toggle hides all nav labels" verifies collapsed labels are not in the DOM. Manually verify that collapsed icon-only links still have an accessible name (see Accessibility finding A-2). |
| TC-19 | ⚠️ Manual | (all tests) | Tailwind CSS classes not applied in jsdom — class assertions verify DOM class names, not visual output. |

---

## Async Patterns

### Findings

| # | Severity | File:Line | Finding |
|---|----------|-----------|---------|
| AP-1 | 🟠 High | `web/src/app.tsx` | No `ErrorBoundary` wrapping `RouterProvider` — if `router.load()` or `beforeLoad` throws unexpectedly, the crash propagates uncaught. |
| AP-2 | 🟠 High | `web/src/components/layout/Sidebar.tsx`, `web/src/store/ui.ts` | Zustand persist rehydration is async but uncoordinated — causes flash of default state (sidebar renders expanded then collapses). Gate render with `useUIStore.persist.hasHydrated()` or add `onFinishHydration` coordination. |
| AP-3 | 🟡 Medium | `web/src/routes/__tests__/routing.test.tsx`, `web/src/routes/__tests__/layout-integration.test.tsx`, `web/src/components/layout/__tests__/Sidebar.test.tsx` | No `afterEach(() => cleanup())` after `render()` — relies on RTL auto-cleanup, fragile with `it.each` (overlaps with TC-7/TC-9). |
| AP-4 | 🟡 Medium | `web/src/components/layout/__tests__/Sidebar.test.tsx:95` | `fireEvent.click` on active nav link without awaiting — works now because no-op, but fragile if route changes. |
| AP-5 | 🟡 Medium | `web/src/store/__tests__/ui.test.ts` | Persistence assertions don't await rehydration — fragile if storage becomes async. |
| AP-6 | 🟡 Medium | `web/src/routes/__tests__/routing.test.tsx` | `router.load()` rejection not caught in tests. |

---

## Accessibility

### Findings

| # | Severity | File:Line | Finding |
|---|----------|-----------|---------|
| A-1 | 🔴 Critical | `web/src/components/layout/Sidebar.tsx:66` | `<nav>` has no `aria-label`. WCAG 4.1.2 requires navigation landmarks to have distinguishable names when more than one exists (or as best practice even when only one is present). Screen readers announce "navigation" with no context. Add `aria-label="Main"`. |
| A-2 | 🟠 High | `web/src/components/layout/Sidebar.tsx:54-55` | In collapsed mode, nav links are unlabelled interactive elements. The `<span>` label is conditionally rendered with `{!collapsed && <span>}`, so when `collapsed === true` the `<Link>` contains only an `aria-hidden` SVG — zero accessible text. Screen readers will announce the link as unlabelled or read the raw `href`. Fix: add `aria-label={label}` on `<Link>` or a `sr-only` span with the label inside `NavLink`, always rendered regardless of `collapsed`, alongside the existing visible span. Fails WCAG 2.4.6 and 4.1.2 at Level A. |
| A-3 | 🟠 High | `web/src/components/layout/Sidebar.tsx:89-96` | Toggle button has `aria-label="Toggle sidebar"` but no `aria-expanded`. Screen reader users cannot determine the current sidebar state. Add `aria-expanded={!sidebarCollapsed}`. Also consider adding `aria-expanded` on `<aside>` and a dynamic `aria-label` on the toggle for full state communication. |
| A-4 | 🟠 High | `web/src/routes/__root.tsx` | No skip-to-main-content link — WCAG 2.4.1 Level A violation with sidebar nav block. Keyboard-only users have no way to bypass the sidebar. |
| A-5 | 🟠 High | `web/src/components/layout/Sidebar.tsx` | No `focus-visible` styles anywhere — focus indicators invisible against dark background. Keyboard users cannot see which element is focused. |
| A-6 | 🟡 Medium | `web/src/components/layout/Sidebar.tsx:46-57` | TanStack Router's `Link` sets `aria-current="page"` automatically when the router considers the link active. But `isActive` is computed independently via `pathname.startsWith(route)`. These two conditions can diverge (e.g. on search-param differences), meaning the visual active highlight and the `aria-current` semantic may disagree. Switching to TanStack Router's native active detection (via `activeProps` or `useMatch`) would keep both in sync. |
| A-7 | 🟡 Medium | `web/src/components/layout/Sidebar.tsx:95` | `ChevronLeft` / `ChevronRight` icons inside the toggle button are missing `aria-hidden`. The button name comes from `aria-label`, so the SVG is redundant in the accessibility tree. Add `aria-hidden={true}` to both chevron icons (unlike nav icons on line 54 which already have it). |
| A-8 | 🟡 Medium | `web/src/components/layout/Header.tsx:6-9` | The "No runs" status badge is a plain `<div>`. If this badge will update dynamically, it needs `role="status"` or `aria-live="polite"` to be announced by screen readers on change. |
| A-9 | 🟡 Medium | `web/src/components/layout/Header.tsx:4` | App name "TokenOwl" is a `<div>` not `<h1>` — not navigable via heading shortcuts. Consider using `<h1>` for the app name. |
| A-10 | 💭 Low | `web/src/components/layout/Sidebar.tsx:78` | The Settings `NavLink` and toggle button are in a `<div>` outside the `<nav>` that wraps main links. Settings is therefore not inside any landmark, and screen reader landmark navigation will skip it. Consider a secondary `<nav aria-label="Secondary">` wrapper for the bottom group. |
| A-11 | 💭 Low | `web/src/routes/__root.tsx:11` | `<main>` has no `aria-label` — best practice, not a violation. |
| A-12 | ⚠️ Manual | `web/src/routes/__root.tsx:11` | `<main>` landmark is present. Verify no child route renders a second `<main>` inside `<Outlet>` — nested `<main>` elements are invalid HTML. |
| A-13 | ⚠️ Manual | `web/src/components/layout/Sidebar.tsx:62-97` | Test with VoiceOver/NVDA: activate the toggle button via keyboard when focus is on a nav link. Confirm focus is not lost or sent to `<body>` after collapse/expand. |
| A-14 | ⚠️ Manual | (theme) | Color contrast needs manual verification — estimated ratios suggest AA pass but tool confirmation required. Run automated contrast audit (e.g., axe-core) on rendered app to confirm WCAG 1.4.3 AA compliance. |

---

## Config/Dependencies

### Findings

| # | Severity | File:Line | Finding |
|---|----------|-----------|---------|
| CD-1 | 🟠 High | `web/package.json:19` | `@tanstack/router-plugin` is in `dependencies` (runtime). It is a Vite build-time plugin only used in `vite.config.ts`. Move to `devDependencies`. |
| CD-2 | 🟡 Medium | `web/package.json:31` | `@types/node@^25.6.0` resolves to Node 25 (an odd/development release line). On a machine running Node 20 or 22 LTS this provides incorrect runtime API types. Align with the Node LTS version in use (`^20.0.0` or `^22.0.0`). |
| CD-3 | 🟡 Medium | `web/vitest.config.ts` | `resolve.alias` is duplicated between `vite.config.ts` and `vitest.config.ts`. No action required now, but they must be kept in sync as aliases grow. Also, `vitest.config.ts` is missing Tailwind/Router plugins which diverges from prod config; future footgun. |
| CD-4 | 🟡 Medium | `.gitignore` | `routeTree.gen.ts` not gitignored — intentional per ARCH decision (commit for CI type-safety), but should be documented. |
| CD-5 | 💭 Low | `.gitignore:6` | `dist2/` appears to be a leftover. |
| CD-6 | 💭 Low | `web/src/test-setup.ts:1` | Verify your IDE picks up vitest globals via the `/// <reference types="vitest/globals" />` directive. The `tsconfig.json` `include` covers `src/`, so it should work — just confirm `describe`/`it`/`expect` are not showing unknown-symbol errors in the editor. |
| CD-7 | ⚠️ Manual | `.gitignore:37` | `*.png` is a broad glob that will silently suppress any intentionally committed PNG assets (favicons, icons, sprites). Consider scoping to a directory (e.g., `.playwright-mcp/*.png`) or listing artefact dirs explicitly. |
| CD-8 | ⚠️ Manual | (deps) | TanStack Router `^1.169.1` vs Router Plugin `^1.167.32` — different minor versions, verify compatibility. |
| CD-9 | ⚠️ Manual | (deps) | Cannot verify CVEs from code — run `npm audit`. |

---

## Manual Checks Required

- [ ] A-12: Verify no child route renders a second `<main>` inside `<Outlet>`
- [ ] A-13: Test sidebar collapse/expand keyboard focus with VoiceOver or NVDA
- [ ] A-14: Run automated contrast audit (e.g., axe-core) to confirm WCAG 1.4.3 AA compliance
- [ ] TC-18: Manually verify collapsed icon-only links have accessible names (blocked on A-2 fix)
- [ ] TC-19: Be aware that class assertions verify DOM class names, not visual output (jsdom limitation)
- [ ] CD-7: Decide whether `*.png` gitignore glob is too broad; scope if needed
- [ ] CD-8: Verify TanStack Router `^1.169.1` compatibility with Router Plugin `^1.167.32`
- [ ] CD-9: Run `npm audit` to verify no CVEs in dependency versions
- [ ] CD-6: Confirm vitest globals (`describe`, `it`, `expect`) resolve without errors in the IDE
- [ ] CQ-9: Confirm `@/` alias convention applies only to internal imports
- [ ] RP-6: Verify no SSR is planned (module-scope router singleton is OK for CSR-only)

---

## Prioritized Action Items

### Must Fix (🔴 Critical)

1. **TC-1 / TC-2** — `Sidebar.test.tsx` active-state assertions: replace `bg-surface-container` with `bg-surface-container-high` in all class checks and `querySelectorAll` calls (lines 68, 73, 77, 82, 89). **5 tests are currently failing.**
2. **TC-3** — `Header.test.tsx`: add `afterEach(() => cleanup())` or move `render` inside each test body.
3. **A-1** — Add `aria-label="Main"` to the `<nav>` in `Sidebar.tsx:66`.

### Must Fix (🟠 High)

4. **CQ-2** — Remove unused `NAV_ITEMS` constant (`Sidebar.tsx:30`) — it is a compile error under `noUnusedLocals`.
5. **CQ-1** — Simplify the `createJSONStorage` wrapper in `ui.ts:16-24` — the indirection adds no value.
6. **A-2** — Add `aria-label={label}` on `<Link>` or add a `sr-only` span inside `NavLink` so collapsed links have an accessible name.
7. **A-3** — Add `aria-expanded={!sidebarCollapsed}` to the toggle button.
8. **A-4** — Add skip-to-main-content link in `__root.tsx` (WCAG 2.4.1 Level A).
9. **A-5** — Add `focus-visible` styles to nav links and toggle button.
10. **CD-1** — Move `@tanstack/router-plugin` to `devDependencies` in `package.json`.
11. **TS-1** — Replace `__dirname` with ESM-compatible path resolution in `vite.config.ts` and `vitest.config.ts`.
12. **TC-4** — Move `vi.stubGlobal` calls from module top-level to `beforeAll` in all three test files; consider centralising in `test-setup.ts`.
13. **TC-5** — Add `beforeEach` store + localStorage reset to `routing.test.tsx`.
14. **TC-6** — Add test for `/settings` active state.
15. **AP-1** — Add `ErrorBoundary` around `RouterProvider` in `app.tsx`.
16. **AP-2** — Address Zustand rehydration flash: gate render with `useUIStore.persist.hasHydrated()` or add `onFinishHydration` coordination.

### Should Address (🟡 Medium)

17. **TS-2** — Replace `React.ElementType` with `LucideIcon` for icon props.
18. **TS-3** — Type `route` as union of valid paths instead of bare `string` for `<Link to>`.
19. **CQ-4** — Fix `text-primary-container` → `text-primary` in `Header.tsx:4`.
20. **CQ-3 / A-6** — Replace `pathname.startsWith` active detection with TanStack Router's native `activeProps` or `useMatch` — this fixes both the false-positive risk and the `aria-current` divergence.
21. **RP-1** — Add selector to `useUIStore()` call.
22. **RP-2** — Add selector to `useRouterState()` call.
23. **A-7** — Add `aria-hidden={true}` to chevron icons in toggle button.
24. **A-8** — Add `role="status"` or `aria-live="polite"` to the "No runs" badge if it will update dynamically.
25. **A-9** — Change Header app name from `<div>` to `<h1>`.
26. **TC-7 / TC-9** — Verify RTL auto-cleanup fires between `it.each` iterations; add explicit cleanup if not.
27. **TC-8** — Replace `document.querySelectorAll` with `within(screen.getByRole("navigation")).querySelectorAll`.
28. **TC-10** — Remove or replace brittle `readFileSync` integration check.
29. **TC-11** — Fix misleading rehydration test in `ui.test.ts`.
30. **TC-12** — Use JSON parse + object assertion instead of string `toContain` in `ui.test.ts`.
31. **TC-13** — Expand stress-test beyond single dynamic route.
32. **CD-2** — Downgrade `@types/node` to match the LTS Node version in use.
33. **CD-3** — Deduplicate Vite/Vitest config alias resolution.
34. **AP-3** — Add `afterEach(() => cleanup())` to test files using `render()` (overlaps with TC-7/TC-9).
35. **AP-4** — Await `fireEvent.click` in Sidebar test.
36. **AP-5** — Await rehydration in persistence assertions.
37. **AP-6** — Catch `router.load()` rejection in tests.

### Nice to Have (💭 Low)

38. **CQ-5** — Extract named `RootLayout` function component from `__root.tsx`.
39. **CQ-6** — Run `biome format` on `vite.config.ts`.
40. **CQ-7** — Add TODO comment on "No runs" chip in Header.
41. **CQ-8** — Add design-system token classes to stub route `<h1>` elements.
42. **TC-14** — Improve "renders all 8 nav items" test to verify distinct routes.
43. **TC-15** — Render `<App />` (not bare `<div>`) in the smoke test.
44. **TC-16** — Import shared nav constant in tests instead of hardcoding.
45. **TC-17** — Replace `readFileSync` with import or async pattern.
46. **A-10** — Wrap Settings `NavLink` in a secondary `<nav aria-label="Secondary">` so it appears in landmark navigation.
47. **A-11** — Add `aria-label` to `<main>` landmark (best practice).
48. **RP-3** — Wrap `NavLink` in `React.memo` after selectors are in place.
49. **RP-5** — Add `errorComponent` and `pendingComponent` to router config.
50. Add `transition-[width] duration-200` to sidebar for smooth collapse animation.
51. Simplify `createJSONStorage` wrapper in `ui.ts`.

---

*Merged from two review reports — 2026-05-03*
