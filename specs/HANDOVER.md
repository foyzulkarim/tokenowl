# Session Handover — feat/1/layout-shell

> **Date:** 2026-05-02  
> **Branch:** `feat/1/layout-shell`  
> **Picking up at:** TDD Phase 4 — T1 done, T2 is next

---

## Read these files first — in this order

Do NOT explore the codebase broadly. Read exactly these files, in this order, and you will have full context:

1. **`specs/architecture/ARCH-layout-shell.md`** — the primary source of truth. Contains the full architecture, all 4 task specs with test plans, implementation notes, scope boundaries, and task status. This is the one file that has everything.
2. **`specs/requirements/REQ-layout-shell.md`** — acceptance criteria with REQ-IDs referenced in the test plans (R1–R10, N1–N2).
3. **`web/package.json`** — current dependency state (T1 test deps are installed; T2 prod deps are not yet installed).
4. **`web/vitest.config.ts`** — test config just created in T1. Pattern for how tests are run.
5. **`web/src/smoke.test.tsx`** — the passing smoke test. Use as a pattern for test file structure.
6. **`web/vite.config.ts`** — current Vite config. T2 will add `TanStackRouterVite()` to this file.
7. **`web/src/app.tsx`** — the placeholder component T2 will replace with `<RouterProvider>`.

Do NOT read `web/src/main.tsx` to understand the pattern — it is a regression-guard file that must NOT be modified.

---

## What was accomplished this session

### Planning (all complete — do not redo)
- `specs/context/1.md` — task context from GitHub issue #1
- `specs/requirements/REQ-layout-shell.md` — full requirements with acceptance criteria
- `specs/architecture/ARCH-layout-shell.md` — full architecture + 4 task specs with test plans

### Implementation
- **T1: done** — vitest + RTL + jsdom wired; smoke test passes (`npm run test:run`)

### Not yet committed
Everything below is uncommitted on `feat/1/layout-shell`:
- `specs/requirements/REQ-layout-shell.md` (new)
- `specs/architecture/ARCH-layout-shell.md` (modified — tasks added, T1 marked done)
- `web/package.json` (modified — test deps + scripts added)
- `web/package-lock.json` (modified)
- `web/vitest.config.ts` (new)
- `web/src/test-setup.ts` (new)
- `web/src/smoke.test.tsx` (new)

**First thing to do: commit all of the above before starting T2.** Use `/dev-pipeline:commit` or a manual commit with message `[step-3] T1: test infrastructure — vitest + RTL + jsdom`.

---

## Current task queue

| Task | Status | Depends on |
|---|---|---|
| T1: Test infrastructure | **done** | — |
| T2: Router foundation | not started | T1 |
| T3: UI store | not started | T1 |
| T4: Layout components | not started | T2, T3 |

**T2 and T3 are independent of each other** — both depend only on T1. They can be done in either order.

---

## How to continue

1. Commit the current uncommitted state (T1 files)
2. Run `/dev-pipeline:tdd @specs/architecture/ARCH-layout-shell.md` and tell it to implement **T2**
3. After T2, implement **T3** (can be done before T4 which needs both)
4. After T2 + T3, implement **T4**

Commit after each task using the message pattern: `[step-3] T{n}: short description`.

---

## Key decisions already locked — do not re-ask

These were decided with the developer. Do not re-open them.

| Decision | What was chosen | Why |
|---|---|---|
| Test framework | vitest + RTL + jsdom | Native Vite integration, already installed |
| Routing | TanStack Router + file-based routing (`@tanstack/router-plugin`) | Spec-mandated, typed route tree |
| UI state | Zustand + `persist` middleware, `partialize` | Handles hydration; eliminates boilerplate |
| Sidebar active state | Prefix match (`pathname.startsWith(route)`) | Keeps item highlighted on detail pages |
| Sidebar toggle | Chevron button at the bottom | VS Code/Linear pattern; keeps header clean |
| Collapse effect | Main content area expands | That's the point of collapsing |
| localStorage default | Expanded (`sidebarCollapsed: false`) | Safe discoverable default |
| `routeTree.gen.ts` | Commit it | Ensures `tsc` passes on fresh clone |

---

## Critical gotchas for T2 (router foundation)

**Read the T2 task spec carefully** — these are easy to get wrong:

1. **`routeTree.gen.ts` is auto-generated** — you cannot create it manually. After creating route files and updating `vite.config.ts`, run `vite dev` briefly (a few seconds) to let the plugin scan the route files and generate `routeTree.gen.ts`. Then commit it.

2. **Plugin order in `vite.config.ts`** — `TanStackRouterVite()` MUST come BEFORE `react()` in the plugins array. Wrong order causes silent failures.

3. **`__root.tsx` in T2 renders `<Outlet />` only** — Sidebar and Header are NOT added in T2. They come in T4. A minimal layout skeleton is correct at the T2 stage.

4. **`src/main.tsx` must NOT be modified** — it is a regression-guard file. The test for it asserts it is unchanged. Only `src/app.tsx` gets the RouterProvider.

5. **Testing TanStack Router** — use `createRouter` with `createMemoryHistory({ initialEntries: ['/target'] })` wrapped in `RouterProvider`. This is the correct in-memory testing pattern for TanStack Router v1.

---

## Gotcha for T3 (UI store)

**Zustand persist test isolation** — call `localStorage.clear()` in `beforeEach` to prevent state leaking between tests. Also reset the store between tests (use `vi.resetModules()` or the store's `setState` directly). Without this, test order affects results.

---

## Project conventions (from CLAUDE.md)

- **Token-only styling** — no inline hex anywhere. Use `bg-surface`, `text-primary-container`, etc.
- **`@` import alias** — all imports use `@/...` (resolves to `web/src/`)
- **No Redux, Jotai, nanostores** — TanStack Query + URL state + Zustand only
- **No importing fixtures into components** — not relevant yet but keep in mind for later steps
- **MSW is the only mock surface** — not relevant until Step 4
