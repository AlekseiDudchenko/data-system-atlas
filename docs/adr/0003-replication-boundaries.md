# ADR 0003: One key, FIFO replication and retained messages

Status: Superseded · 2026-10-28 — the lesson it describes was retired (#20); kept for history.

Context: The first lesson must demonstrate stale reads and recovery without suggesting that it emulates a production database.

Decision: One permanent leader and two followers share a single string key. Each write queues two versioned snapshots due after two steps. Each step applies every due message on connected links in order per follower. A blocked replication link retains pending messages; reads still work. Restoration requires another step to deliver overdue messages. Read observations retain the leader version at read time.

Consequences: Lag and catch-up are clear. Queues can grow while blocked. This assumes ordered retained delivery rather than modeling packets, retries or log retention limits. Multiple overdue writes can apply in one step. Crash durability, failover, elections, loss, reordering and transactions are outside the lesson. The limitations are shown in the lesson itself.

Alternatives: Arbitrary delivery/reordering would require version guards and a different educational focus. Dropping blocked messages would require a repair protocol. Both are deferred.
