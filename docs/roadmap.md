# Roadmap and backlog

This roadmap is ordered by dependency and learner value. Estimates are focused engineering days, not promised calendar dates. Build one complete lesson before extracting shared abstractions.

## Epics

| Epic                                                                                              | Scope                                   | Implementation issues |
| ------------------------------------------------------------------------------------------------- | --------------------------------------- | --------------------- |
| [E1 — Platform Foundation](https://github.com/AlekseiDudchenko/data-system-atlas/issues/1)        | Static shell and workflow               | #6                    |
| [E2 — Educational Content System](https://github.com/AlekseiDudchenko/data-system-atlas/issues/2) | Original content and editorial contract | #7                    |
| [E3 — Simulation Engine](https://github.com/AlekseiDudchenko/data-system-atlas/issues/3)          | Pure events and model tests             | #8                    |
| [E4 — Learning Modules](https://github.com/AlekseiDudchenko/data-system-atlas/issues/4)           | First lesson and later experiments      | #9, #11, #12          |
| [E5 — Quality & Launch](https://github.com/AlekseiDudchenko/data-system-atlas/issues/5)           | Validation, review and deployment       | #10, #13              |

## M0: Working vertical slice (initial MVP, roughly 3–5 days)

1. [#6 Platform](https://github.com/AlekseiDudchenko/data-system-atlas/issues/6): installable static Astro app, strict TypeScript, MDX/React, navigation, local checks, CI.
2. [#7 Content](https://github.com/AlekseiDudchenko/data-system-atlas/issues/7), depends on #6: vision, architecture, ADRs and original lesson format.
3. [#8 Model](https://github.com/AlekseiDudchenko/data-system-atlas/issues/8), depends on #6: deterministic replication transitions, queue, block/restore and unit tests.
4. [#9 Lesson](https://github.com/AlekseiDudchenko/data-system-atlas/issues/9), depends on #7/#8: SVG plus semantic controls, historical reads, visible log, limitations and experiments.
5. [#10 Validation](https://github.com/AlekseiDudchenko/data-system-atlas/issues/10), depends on #6–#9: production-build browser tests, accessibility/mobile checks, independent review and PR merge.

Exit: A learner reproduces stale reads and explains recovery. All gates pass. Deployment may be blocked on account access but must be documented explicitly.

## M1: Public deployment and deeper replication (roughly 2–4 days)

- [#13 Cloudflare Pages](https://github.com/AlekseiDudchenko/data-system-atlas/issues/13), depends on #10 and account access: connect repository, publish main, verify actual URL and rollback.
- [#11 Read-your-writes](https://github.com/AlekseiDudchenko/data-system-atlas/issues/11), depends on #9/#10: one session, explicit minimum version, compare old reads with waiting. Include failure and availability costs.
- Gather qualitative feedback: can a reader predict the old value, describe acknowledgment versus propagation, and name the omitted failure cases? Avoid adding analytics infrastructure before it is needed.

## M2: A second territory (roughly 3–5 days)

[#12 Partitioning and hotspots](https://github.com/AlekseiDudchenko/data-system-atlas/issues/12), depends on #10. One bounded routing experiment, predictable workload, accessible distribution visualization. Reuse only proven shared pieces. Add a content collection only if navigation metadata has become repetitive.

## Later, by learning dependency

Foundations (latency, throughput and queues) supports Storage Engines (write amplification and compaction). Replication and partitioning support Transactions & Consistency (isolation counterexamples), then Distributed Coordination (leases and fencing with explicit clocks). Event-Driven Systems adds delivery/replay before Architecture Patterns combines bounded models into end-to-end trade-offs.

These are discovery areas, not committed implementation tickets. Define the learner's question and failure model before scheduling each. No backend, login, progress synchronization, generic engine, or large course framework is part of these milestones.
