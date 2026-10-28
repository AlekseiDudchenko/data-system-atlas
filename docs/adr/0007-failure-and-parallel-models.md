# ADR 0007: Scripted failures per batch and a small scheduler for parallel pull

Status: Accepted · 2026-10-28

Context: Issue #25 adds retries, idempotency, checkpoints and parallel readers to the transfer exploration. Their effects — duplicates, lost batches, rework, waiting for connections, a long tail — only appear when individual batches and readers are visible, which the closed-form estimate of ADR 0006 cannot show.

Decision: `src/simulation/reliability.ts` steps through 1,000 batches of 1,000 records and records each event with its modelled time. Failures are scripted at fixed batches so runs are reproducible: two connection drops at batch 121, a lost acknowledgement at 371 (the target commits, the script sees an error) and a script crash at 641 between the batch write and the checkpoint. A plan chooses retry with exponential backoff (100, 200, 400, 800 ms, no jitter), INSERT or UPSERT, and a checkpoint saved never, after or before the write. A crash restarts after 10 s from batch zero or from the saved checkpoint. `reliabilityAt` replays events up to a time to give batch states (written, repeated, missing), counters and an event log. `src/simulation/parallel.ts` splits the batches into key ranges (even, or half the rows in range one), runs at most 8 readers at once (the pool) and slows each batch write when more than four write concurrently; a small event loop gives start, end and completion times per reader.

Consequences: Every outcome on the page — 642,000 duplicates without a checkpoint, 1,000 silently missing records with a checkpoint saved before the write, ×4.3 at best with eight readers, ×1.7 with skewed data — follows from these rules and is pinned by unit tests. Randomness (jitter, failure probability) is described in text, not simulated. Target failures, partial batch writes, endless errors, source load, locks and row ordering are outside the model and listed on the page.

Alternatives: Random failures would teach probability but make runs irreproducible and tests flaky. Extending the closed-form model would hide which batch was duplicated or lost. A generic discrete-event engine is still not needed: each model is under 200 lines.
