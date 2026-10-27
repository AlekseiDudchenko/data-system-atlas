# Roadmap and backlog

This roadmap is ordered by dependency and learner value. Estimates are focused engineering days, not promised calendar dates. Build one complete lesson before extracting shared abstractions.

## Status — 2026-10-27

- M0 is complete: #6–#10 and verification follow-up #15 shipped in PR #14.
- M1 is partially complete: read-your-writes (#11, PR #17) has shipped; public deployment (#13) and learner feedback remain open.
- M2 is complete: partitioning and hotspots (#12, PR #18) has shipped.
- GitHub Actions restoration (#16) remains a non-blocking infrastructure follow-up. Local checks remain the development and merge route while Actions is unavailable.
- Latest local verification: typecheck, lint, 19 unit tests, four-page production build, and 20 desktop/mobile browser tests passed. This run used installed Google Chrome and an isolated preview port; the standard port was occupied and managed Chromium was absent. Feature validation records retain their original run details.

Next: publish and verify Cloudflare Pages, gather learner feedback on the three lessons, then scope the next experiment. No verified public deployment URL is recorded.

## Epics

| Epic                                                                                              | Scope                                   | Implementation issues |
| ------------------------------------------------------------------------------------------------- | --------------------------------------- | --------------------- |
| [E1 — Platform Foundation](https://github.com/AlekseiDudchenko/data-system-atlas/issues/1)        | Static shell and workflow               | #6                    |
| [E2 — Educational Content System](https://github.com/AlekseiDudchenko/data-system-atlas/issues/2) | Original content and editorial contract | #7                    |
| [E3 — Simulation Engine](https://github.com/AlekseiDudchenko/data-system-atlas/issues/3)          | Pure events and model tests             | #8                    |
| [E4 — Learning Modules](https://github.com/AlekseiDudchenko/data-system-atlas/issues/4)           | First lesson and later experiments      | #9, #11, #12          |
| [E5 — Quality & Launch](https://github.com/AlekseiDudchenko/data-system-atlas/issues/5)           | Validation, review and deployment       | #10, #13              |

## M0: Working vertical slice — complete (initial estimate: roughly 3–5 days)

1. [#6 Platform](https://github.com/AlekseiDudchenko/data-system-atlas/issues/6): installable static Astro app, strict TypeScript, MDX/React, navigation, local checks, CI.
2. [#7 Content](https://github.com/AlekseiDudchenko/data-system-atlas/issues/7), depends on #6: vision, architecture, ADRs and original lesson format.
3. [#8 Model](https://github.com/AlekseiDudchenko/data-system-atlas/issues/8), depends on #6: deterministic replication transitions, queue, block/restore and unit tests.
4. [#9 Lesson](https://github.com/AlekseiDudchenko/data-system-atlas/issues/9), depends on #7/#8: SVG plus semantic controls, historical reads, visible log, limitations and experiments.
5. [#10 Validation](https://github.com/AlekseiDudchenko/data-system-atlas/issues/10), depends on #6–#9: production-build browser tests, accessibility/mobile checks, independent review and PR merge.

Exit: A learner reproduces stale reads and explains recovery. All gates pass. Deployment may be blocked on account access but must be documented explicitly.

## M1: Public deployment and deeper replication — in progress (initial estimate: roughly 2–4 days)

- [ ] [#13 Cloudflare Pages](https://github.com/AlekseiDudchenko/data-system-atlas/issues/13), depends on #10 and account access: connect repository, publish main, verify actual URL and rollback.
- [x] [#11 Read-your-writes](https://github.com/AlekseiDudchenko/data-system-atlas/issues/11), shipped in PR #17: one session, explicit minimum version, compare old reads with waiting. Includes failure and availability costs. See [validation](read-your-writes-validation.md).
- [ ] Gather qualitative feedback: can a reader predict the old value, describe acknowledgment versus propagation, and name the omitted failure cases? Avoid adding analytics infrastructure before it is needed.

## M2: A second territory — complete (initial estimate: roughly 3–5 days)

- [x] [#12 Partitioning and hotspots](https://github.com/AlekseiDudchenko/data-system-atlas/issues/12), shipped in PR #18. One bounded routing experiment, predictable workload, accessible SVG and semantic counter table. See [validation](partitioning-validation.md). No content collection was needed.

## Later, by learning dependency

Foundations (latency, throughput and queues) supports Storage Engines (write amplification and compaction). Replication and partitioning support Transactions & Consistency (isolation counterexamples), then Distributed Coordination (leases and fencing with explicit clocks). Event-Driven Systems adds delivery/replay before Architecture Patterns combines bounded models into end-to-end trade-offs.

These are discovery areas, not committed implementation tickets. Define the learner's question and failure model before scheduling each. No backend, login, progress synchronization, generic engine, or large course framework is part of these milestones.
