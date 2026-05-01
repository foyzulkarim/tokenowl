# TokenOwl

A local, single-user Claude Code observability tool. Captures my Claude Code sessions, surfaces where my spend goes, and proposes evidence-backed changes to reduce cost. Single user, my machines, my data — not a SaaS, not multi-tenant, not a wrapper around Claude Code.

## Current phase

**Frontend-only build, hardcoded mock data, no backend.** Build sequence is in `docs/FRONTEND_PROPOSAL.md` §14. Check git log for completed steps.

## Foundational docs

All docs live in `docs/`. Read on demand — do not load them all at once.

- `docs/PROPOSAL.md` — what TokenOwl is, requirements, principles, non-goals
- `docs/NOTES.md` — POC findings on Claude Code internals (transcript JSONL, hook events, source schema)
- `docs/UX_SPEC.md` — UX shape, all 10 pages, AI surfaces, lens framework, proposal lifecycle
- `docs/FRONTEND_PROPOSAL.md` — this phase's build plan: stack, project structure, mock strategy, build sequence
- `docs/design-system/DESIGN.md` — Nocturnal Logic theme tokens

For any build step, read `docs/FRONTEND_PROPOSAL.md` plus the relevant section of `docs/UX_SPEC.md` first.

## Stack

Vite + React + TypeScript (strict) + Tailwind v4 + TanStack Router + TanStack Query + MSW + shadcn/ui + Recharts + Lucide + Biome. Reasoning per choice in `docs/FRONTEND_PROPOSAL.md` §5.

## Load-bearing conventions

- **Theme tokens, not hex.** Use `bg-surface`, `text-on-surface`, etc. from Nocturnal Logic. No inline color values in components. Tokens defined in `web/src/theme/nocturnal-logic.css`; full list in `docs/design-system/DESIGN.md`.
- **MSW is the only mock surface.** Components import from `src/data/`, never from `src/mocks/`. The data layer calls `fetch('/api/...')`; MSW intercepts. This is the seam for the future backend — keep it clean.
- **Fixtures are plain TS.** Hand-shaped objects in `src/mocks/fixtures/`. No `faker`, `chance`, or other generator libraries.
- **Realistic POC scale.** ~50 sessions across ~10 projects, two machines (`mac-mini-home`, `office-laptop`), 4 weeks of activity, costs in cents to single dollars.
- **Three states per page.** Every page renders correctly with data, with no data (empty state), and with a simulated error.
- **Stub AI surfaces honestly.** ✨ buttons open panels with canned content plus a visible "Stub response" indicator in dev mode.
- **No persistence theatre.** MSW mutations live in memory and reset on reload. Cross-session UI state goes in `localStorage` under `tokenowl_` namespace.
- **URL state for filters.** Filter bar / time window / sort lives in URL search params via TanStack Router typed search.

## Visual reference

`docs/stitch-reference/` (gitignored) has HTML mockups and screenshots from Google Stitch. **Visual feel only.** Known drift: branding says "Claude Monitor"/"MONITOR_AI", tone is enterprise, session detail sidebar is wrong, data scale is inflated. `docs/UX_SPEC.md` is canonical.

## What NOT to do in this phase

- No backend code, hook receiver, transcript reader, or SQLite schema.
- Never auto-apply proposals, hooks, skills, or config to `~/.claude/`.
- No inventing data fields the backend can't produce from `docs/NOTES.md`.
- No Anthropic API or LLM calls from the frontend. AI surfaces are stubbed.
- No importing fixtures into components. Use the data layer.
- No Redux, Jotai, nanostores. TanStack Query + URL state + tiny Zustand store.

## Working pattern

- One session per build step from `docs/FRONTEND_PROPOSAL.md` §14.
- After completing a step, commit with `[step-N] short description`.
