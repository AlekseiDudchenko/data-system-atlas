# ADR 0008: Tick-based model for the push path

Status: Accepted · 2026-10-28

Context: Issue #26 adds the push-based path of the transfer exploration: direct push, a durable queue, poison messages and a dead-letter queue, redelivery and idempotent consumers, consumer groups and backpressure. Its central quantity is lag over time, which neither the closed-form pull estimate (ADR 0006) nor the batch-by-batch run (ADR 0007) expresses.

Decision: `src/simulation/push.ts` advances 60 seconds in 100 ms ticks. Each tick the producer emits `rate / 10` events spread over partitions (half to partition 1 when skewed), consumers write up to their capacity from the partitions they own (partition modulo consumer count), and the queue drops the oldest unread events beyond its capacity, split evenly per partition. The target is unavailable from 10 s for the chosen outage; a poison event appears at 10 s on partition 1 and blocks it, retried once per second, until three attempts move it to the dead-letter queue (if enabled); consumer 1 crashes at 33.7 s, rewinds its partitions to the last committed offsets (committed every 0.5, 2 or 5 s) and restarts after 5 s, producing duplicates unless writes are idempotent. Direct push is the same loop with one partition and a 1,000-event producer buffer. Every tick stores partition depths, lag and cumulative counters, so the page animates and charts by index.

Consequences: Outcomes on the page — 14,000 events lost by a direct push, a 29.7 s drain behind a queue, a partition stuck behind a poison message, 1,700 duplicates after a crash, an overloaded hot partition — follow from these rules and are pinned by unit tests. Rebalancing, broker and network latency, producer acknowledgements, ordering under retries, replay and schema evolution are described in text, not simulated. The page states that push is a different operating model from pull, not its next step, and ends with a pull-or-push comparison.

Alternatives: A continuous fluid model would chart lag but hide offsets, poison events and redelivery. Real broker clients in the browser would contradict the static, service-free architecture.
