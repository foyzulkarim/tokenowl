# TokenOwl: Project Proposal

**Project name:** TokenOwl
**Domain:** tokenowl.dev
**Status:** Requirements finalized; architecture conversation pending.

---

## 1. The problem

I use Claude Code heavily across multiple machines and projects. As Anthropic ships more capable frontier models, per-token pricing trends upward, but my work mix is heterogeneous — some of it genuinely needs frontier reasoning, much of it is mechanical, repetitive, or context-heavy in ways that don't justify the cost. I currently have no visibility into where my Claude Code spend actually goes, no systematic way to identify which parts of my workflow are cost-inefficient, and no disciplined process for replacing those parts with cheaper alternatives.

I want to fix this.

## 2. The goal

Build a personal system that observes my Claude Code usage, helps me understand where my cost goes, and proposes specific, evidence-backed changes I can make to reduce that cost without sacrificing the quality of my work.

The system is for me. It is not a product, not multi-tenant, not a SaaS, not aimed at a market. It may produce content (Bengali and English) as a byproduct of building it, but its primary function is to make me a more cost-effective Claude Code user.

## 3. Guiding principles

These shape every requirement that follows.

**Cost reduction is the primary success metric.** Not "intelligence," not "automation," not "self-improvement." If a feature doesn't plausibly contribute to lower spend per useful outcome, it's out of scope.

**Observation before optimization.** No proposal, no replacement, no automation happens before there is data to justify it. Every change the system suggests must be backed by evidence drawn from my actual usage.

**Human in the loop, always.** The system proposes; I integrate. Nothing the system suggests is automatically applied to my workflow. There is always a review step where I can accept, reject, modify, or defer a proposal. This is non-negotiable and is the system's primary safety property.

**Multiple analytical perspectives, none privileged.** Claude Code workloads vary by machine, project, and time period. The system supports multiple analytical lenses on the same underlying data, and surfaces findings from each lens without ranking one above another. Which lenses prove valuable is something I learn from use, not something the system decides for me.

**Replayable and reproducible.** The system's understanding of my usage must be reconstructible from durable underlying data. Derived insights should never become the source of truth. If I add a new analytical lens six months from now, it should be able to apply retroactively to all historical sessions, not just future ones.

**Resilient to silent failures.** The system must not lose data when it itself is broken, misconfigured, or offline. Capture must continue (passively, via sources Claude Code maintains) even when the analysis layer is unavailable.

**Portable across machines.** I work on at least two machines (Mac mini for training prep, office laptop for development work). The system must work identically on both, and must be able to consolidate data from both into a single picture if I want.

**Cheap to throw away or evolve.** Every component should be modest enough that replacing it is easy. The substrate matters more than any single feature built on top of it.

## 4. Functional requirements

### 4.1 Data capture

The system must reliably capture every Claude Code session that occurs on a machine where it is installed. "Reliably" means: if the system is running, sessions are captured; if the system is offline, sessions are still recoverable when it comes back online; if the system has never seen my historical sessions, it can ingest them retroactively.

The captured data must be sufficient to answer every analytical question downstream — costs, tool usage, prompts, responses, tool inputs, tool outputs, sub-agent activity, session metadata, conversation structure. The substrate's job is to capture *everything available*, not to pre-filter based on what current analyses want.

### 4.2 Cost visibility

I must be able to see, for any session or any time window:

- Total token spend (input, output, cache reads, cache creation)
- Cost in dollars
- Cache hit rate
- Per-model breakdown (Sonnet vs Opus vs Haiku, etc.)
- Per-machine breakdown (where applicable)
- Per-project or per-working-directory breakdown
- Per-session "what was this session for" (the first real user prompt, surfaced as a label)

This is not a real-time dashboard. It can be batch-computed. End-of-week visibility is sufficient.

### 4.3 Pattern analysis (the proposer)

The system must analyze captured data and produce **proposals** — concrete, evidence-backed suggestions for changes I could make to reduce cost. Proposals are surfaced through multiple analytical lenses, each operating independently on the same underlying data. The initial set of lenses is a starting point, not a final list; the system is designed to accept new lenses over time.

A non-exhaustive starting set:

- Patterns where Claude does deterministic work that a CLI tool, script, or skill could handle directly
- Patterns where tool outputs bloat the context window unnecessarily
- Sessions or task types where output token volume is high relative to value
- Sessions with low cache hit rates, suggesting workflow-level changes
- Tasks where a frontier model was used but the work was structurally simple
- Tool sequences whose results don't appear to influence later turns (sub-agent isolation candidates)
- Sessions or sequences with no recurring pattern at all (genuinely novel work, useful as context)

Each proposal must include:

- The pattern observed
- The evidence (which sessions, how often, projected impact)
- A concrete suggestion (skill, hook, MCP, sub-agent reroute, workflow change, no-op observation)
- Where applicable, a draft implementation, not just a description

The system does not auto-rank "best" proposals across lenses. It surfaces what each lens finds, with its evidence, and lets me decide.

### 4.4 Review and integration workflow

The proposals surface in some review surface (form factor TBD in architecture phase). For each proposal I must be able to:

- Read it with full evidence
- Accept, reject, defer, or modify
- See draft implementations where relevant
- Have my decision recorded so I can trace why something was or wasn't integrated

Accepted proposals are integrated by me, not by the system. The system may produce starter code, configuration snippets, or scaffolding to make integration cheap, but the act of putting a skill, hook, or MCP into my Claude Code setup is mine.

### 4.5 Effectiveness tracking

After I integrate a proposal, the system must be able to tell me whether it actually saved money. This means: ongoing capture continues post-integration, and I can compare spend on relevant task patterns before and after the change. If a proposal didn't help — or made things worse — that needs to be visible.

## 5. Non-functional requirements

**Privacy:** All data stays on my machines. No cloud services for the system itself. Data may be replicated between my own machines under my control.

**Operability:** I should be able to run the system with minimal ongoing maintenance. A weekly review session is the expected interaction cadence; everything else should run unattended.

**Inspectability:** I must be able to query the underlying captured data directly with familiar tools, not only through the system's own interfaces. The substrate should not be a black box.

**Modesty:** No component should be so complex that replacing or rewriting it is daunting. If I find myself afraid to refactor a part of the system, that part is over-engineered.

**Stability resilience:** Claude Code's hook system, transcript format, and feature surface evolve. The system should depend on the most stable parts of Claude Code's data and treat less stable parts as optional enhancements, not core dependencies.

## 6. Explicit non-goals

To prevent scope creep into the architecture phase:

- **No local LLM routing or distillation in the initial scope.** If future captured data reveals task classes where local models would help, this can be revisited. It is not a foundational requirement.
- **No autonomous self-modification.** The system never edits its own configuration, skills, hooks, or proposals without me approving them.
- **No multi-user, no team features, no auth.** Single user, my machines, my data.
- **No real-time live dashboards as a foundational requirement.** Batch analysis is sufficient. Live views can be added later if I want them.
- **No replacement for Claude Code itself.** Not a TUI, not a wrapper, not a proxy in the request path. The system observes alongside Claude Code; it does not sit between me and Claude Code.
- **No goal of full automation of my workflow.** The aim is making me cheaper and more deliberate, not removing me from the loop.

## 7. What "done" looks like for the first usable version

A reasonable definition of the first useful milestone — not the architecture's final shape, just the point at which the system starts paying for itself:

1. The system captures all my Claude Code sessions on at least one machine (initially the office laptop, where my real dev work happens) reliably and historically (i.e., it ingests my existing session history, not just future sessions).
2. I can see, in some readable form, where my Claude Code spend is going across at least four weeks of real usage.
3. The proposer produces at least one ranked surface of findings from multiple analytical lenses.
4. I have integrated at least one accepted proposal into my Claude Code setup, and the system can show me whether it changed my spend.
5. The system has run unattended for those weeks without losing data, requiring babysitting, or breaking my Claude Code workflow.

That's enough to validate the whole loop. Everything beyond that is iteration.

## 8. Long-term direction (informational, not a commitment)

The architecture should not preclude these, but they are not initial requirements:

- Aggregating data from multiple machines
- Adding new lenses as my workload changes
- Eventually evaluating whether local LLM offload is justified by accumulated evidence
- Producing teaching content (Bengali and English) from the experience of building and operating this
- Sharing the substrate or the lens framework with others if it turns out to be useful — though this is explicitly downstream of personal value, not a driver of the design

---

## Substrate decision (carried forward from brainstorming)

After analysis, the substrate should be **transcript-primary**, not hook-primary. The transcript JSONL files in `~/.claude/projects/` are the source of truth (Claude Code maintains them regardless of whether TokenOwl is running); hooks are an optional latency optimization layer, deferred until a concrete need arises (such as a real-time dashboard).

This choice is favoured because:

- It is resilient to receiver downtime, hook misconfiguration, and Claude Code version changes that break specific hook events.
- It supports retroactive ingestion of historical sessions when first installed on a new machine.
- It supports schema evolution: derived tables can be dropped and rebuilt from raw transcripts, so new analytical lenses apply retroactively.
- It is portable: the same transcript files exist on every machine, so no per-machine receiver setup is required for the core capture path.

The architecture conversation should treat this as the foundational stance unless something new disproves it.
