# ADR 0004: Session minimum and one pending read

Status: Accepted · 2026-10-26

Context: Issue #11 needs a comparison between ordinary follower reads and read-your-writes, including the cost when a replica cannot catch up.

Decision: Add a small pure session reducer around the existing replication reducer. A single sequential client records the version of each acknowledged write. A read either accepts any replica version or requires that session minimum. A pending read fixes its target/minimum and completes automatically on a delivery step. While pending, new client operations are rejected; block/restore/step, cancel and reset remain available. Cancellation preserves the minimum. Completed reads remain historical. No timeout or automatic rerouting is implied.

Consequences: We can demonstrate indefinitely unavailable session reads under a blocked replication link without clocks or networking. The first lesson keeps its existing reducer and behavior. Both lessons share the concrete topology component; no generic simulation engine or policy framework is introduced. The wrapper's replication log is not a session-operation history and is not displayed in the second lesson.

Alternatives: A retry-only read hides the pending request; automatic leader fallback hides the availability cost. Concurrent writes during pending reads would require more session-ordering rules than the lesson needs.
