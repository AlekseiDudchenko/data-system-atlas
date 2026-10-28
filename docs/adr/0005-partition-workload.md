# ADR 0005: Fixed key ownership and equal-cost workload counters

Status: Superseded · 2026-10-28 — the lesson it describes was retired (#20); kept for history.

Context: Issue #12 needs a reproducible demonstration that even key placement can still produce a hot partition.

Decision: Twelve integer keys route by key modulo three. An even batch visits every key once. A hot batch repeats one chosen key nine times and visits the next three cyclic keys once each. Each batch advances one logical step: add arrivals, then complete up to four requests per partition. A drain step serves existing queues without arrivals. Counters track received/completed/queued and latest arrivals. Changing workload or hot key resets counters; reset retains those choices.

Consequences: The two workloads have identical placement and batch size, but deterministic 4/4/4 versus 10/1/1 arrival distributions (rotated with hot-key ownership). Aggregate capacity cannot be pooled. Fixed-scale SVG shares and an exact semantic table expose skew without relying on color. There are no request values, individual latencies, storage records, migration, clocks or random workloads. No generic simulation engine is needed.

Alternatives: Random keys obscure repeatable comparisons. Variable partition counts or rebalancing would introduce placement changes and migration rules beyond this lesson. A queue of individual requests is unnecessary when all requests have equal cost and no per-request result or ordering is exposed.
