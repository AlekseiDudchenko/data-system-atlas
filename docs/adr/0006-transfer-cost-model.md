# ADR 0006: Closed-form cost model for pull transfers

Status: Accepted · 2026-10-28

Context: The first exploration (#21, #22) must show how duration, round trips and memory change when a copy script grows from a thousand to ten million records, and when it switches from eager to lazy reading and from per-record to batched writes. A step-by-step simulation of millions of records would be slow in the browser and harder to check than the numbers it produces.

Decision: `src/simulation/transfer.ts` computes each run in closed form from a plan (`records`, `reading`, `batchSize`) and fixed constants: 2 ms per query or insert round trip, 0.005 ms of source work per record read, 0.05 ms of target work per record written, 1 KB per record, pages of 1,000 records, a 512 MB buffer limit. Eager reading needs one round trip and holds the whole result; it fails with "out of memory" while buffering when the result exceeds the limit, before any write. Lazy reading needs one round trip per page and holds a page plus one batch. Reading and writing never overlap. `progressAt` derives the visible state at any modelled time (linear inside each phase, whole batches only), so the UI animates by sampling it. The page states all constants in its "what this model leaves out" block.

Consequences: Every number on the page is reproducible from a formula and covered by invariant tests (records written equal records read, batch of one equals per-record writes, eager memory grows with records while lazy memory stays flat, fewer round trips cost more buffer). The model compares decisions; it does not predict real durations and ignores indexes, contention, transaction limits, network variance, retries and failures other than memory. ADR 0002's logical-step model still applies to future failure scenarios that need explicit events.

Alternatives: A discrete-event simulation over individual records would show the same totals with much more code and runtime. Measured benchmarks would tie the page to one database and machine and invite claims about real performance.
