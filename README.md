# TokenOwl

A local, single-user observability tool for Claude Code. Captures your sessions, surfaces where your spend goes, and proposes evidence-backed changes to reduce cost.

Single user. Your machines. Your data. Not a SaaS, not multi-tenant, not a wrapper around Claude Code.

## What it does

- **Dashboard** — headline spend numbers, cost over time, breakdowns by project/model/machine
- **Sessions** — browsable log of every Claude Code session with turn-by-turn detail, tool call counts, cache hit rates, and cost
- **Proposals** — AI-generated suggestions to reduce spend, organized by lens (prompt hygiene, tool call patterns, context management, etc.), with a full lifecycle from draft to validated
- **Patterns** — recurring behaviors detected across sessions that haven't been promoted to proposals yet
- **Effectiveness** — tracks whether accepted proposals actually reduced cost after integration
- **Chat** — ask questions about your own usage data; responses cite real sessions and proposals
- **Runs** — log of background pipeline runs (ingestion, pattern detection, lens synthesis)
- **Settings** — pipeline status, capture config per machine, model preferences

## Current state

**Frontend-only build with hardcoded mock data.** No backend, no data ingestion, no real AI calls. The goal is to validate the UX against realistic mock data before committing to backend architecture.

Stack: Vite + React + TypeScript + Tailwind v4 + TanStack Router + TanStack Query + MSW + shadcn/ui + Recharts + Biome.

## Running locally

```bash
cd web
npm install
npm run dev
```

## Design system

Nocturnal Logic — true dark theme optimized for long coding sessions. Primary: Owl Gold (`#FFC107`). Secondary: Teal (`#44E2CD`). Token reference in `docs/design-system/DESIGN.md`.

## Docs

- `docs/PROPOSAL.md` — what TokenOwl is, requirements, non-goals
- `docs/NOTES.md` — POC findings on Claude Code internals
- `docs/UX_SPEC.md` — all 10 pages, AI surfaces, proposal lifecycle
- `docs/FRONTEND_PROPOSAL.md` — this phase's build plan and sequence
