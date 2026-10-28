# Data Systems Atlas: vision

Status: agreed direction, 2026-10-28. Supersedes the earlier lesson-based vision.

**How data systems work.** Explore how software architectures evolve when requirements change, workloads grow, and simple solutions reach their limits.

Data Systems Atlas is an open collection of interactive architecture explorations. It is not a course, a set of lessons, or a learning management system.

The core experience is:

> Start simple → push the limits → observe failure → choose a solution → compare trade-offs → evolve.

## Principles

- The visitor meets a system problem before being told about a solution.
- One recognizable system evolves throughout an exploration.
- Visitors change parameters, inject failures, choose alternatives, and see the consequences.
- No prescribed path, curriculum, scores, exams, or gamification.
- Trade-offs matter more than "best practice" labels; added complexity has a cost.
- Show measurable effects: throughput, duration, backlog, memory, retries, failures, duplicates, correctness.
- Simulation assumptions are explicit. Model output is never presented as measured database performance.
- Content and UI copy are original; English first, with German and Russian translations kept in sync.
- Static and private: no accounts, analytics, persistence, or backend services.

Presentation reference: [samwho — load balancing](https://samwho.dev/load-balancing/).

## Site

- **Design:** the editorial design shipped in `d560b54` — warm light theme with a dark theme, large typography, restrained copper accent, scroll-driven scenes beside a sticky interactive diagram.
- **Navigation:** logo · Explore the atlas · GitHub · language · theme. No separate About page and no "How it works" block.
- **Home:** headline "How data systems work", the supporting line above, and one featured exploration with a small preview of its diagram. Only working explorations are listed.
- **Explorations:** Scaling Large Data Transfers is the first and, for now, the only exploration. The earlier lessons (stale reads, read-your-writes, partitioning) and the data-migration prototype are retired; they remain in git history.

## First exploration: Scaling Large Data Transfers

Copy data from a source database to a target database. A naive sequential script works for a small dataset; growing volume reveals new bottlenecks and failure modes.

Technical foundation: [scaling-large-data-transfers notes](https://github.com/AlekseiDudchenko/data-transfer-service/blob/docs/large-data-transfer-notes/scaling-large-data-transfers-minimal.html).

Pull and push are different operating models, not one staircase that ends with a queue.

**Pull** — the consumer asks for more when ready; flow control is natural. Fits batch migration, API imports, file reading, database cursors.

1. Sequential transfer — simple per-record read/write; limited throughput.
2. Lazy reading — cursor, iterator, stream, pagination; memory control versus resource lifetime.
3. Batch writes — fewer round trips; partial batch failures and transaction boundaries.
4. Retry — transient failures, backoff and jitter; a lost acknowledgement may produce duplicates.
5. Idempotency — upsert, unique keys, idempotency keys; safe reprocessing.
6. Checkpointing — resume without restarting; target writes versus checkpoint consistency.
7. Parallel pull — independent key ranges; ordering, skew, contention, pool limits.
8. Bulk path — native import/export, COPY, files; throughput versus per-record flexibility.

**Push** — the producer publishes independently; consumers may lag. Fits events, continuous ingestion, CDC.

1. Direct push — minimal infrastructure, but outages propagate.
2. Durable queue or stream — buffering and decoupling; offsets, lag, retention, broker operations.
3. Consumer retries — backoff, requeue; poison messages.
4. Dead-letter and failure isolation — continued progress; audit and replay burden.
5. Idempotent consumers — tolerate redelivery.
6. Scale-out consumers — groups and partitions; skew, rebalances, per-key ordering.
7. Backpressure and flow control — bounded queues, in-flight limits, pauses; growing lag.
8. Replay and recovery — rebuild state; historical schema compatibility.

Shared concerns: idempotency, consistency, checkpoints and offsets, ordering, observability, reconciliation.

### Interactive experience

- Start with a naive sequential copy of a small dataset.
- Increase the record count; show elapsed time, throughput, and memory.
- Offer alternative decisions such as batching, parallelism, or a different operating model, and show why each does or does not fit the current constraints.
- In later stages inject connection drops, partial writes, lost acknowledgements, and target outages.
- Show duplicates, checkpoint state, retries, backlog, lag, and recovery visibly, not only in prose.
- Keep the diagram and the metrics in sync.
- Allow replay, reset, and before/after comparison.
- Name the simulation's assumptions, simplifications, and capacity limits.
- Never imply that the queue-based push architecture is a required upgrade of a pull migration.

## Scope guardrails

Do not build a generic simulation platform before the first exploration is validated. Build one strong scenario, then extract reusable visualization and modelling pieces. Priorities and issues live in the [roadmap](docs/roadmap.md).

## Open questions

- Branching decision history versus a freely editable architecture canvas with guided challenges.
- Which concrete database and source constraints the first simulation models.
- How to present model invariants and assumptions without distracting from experimentation.
