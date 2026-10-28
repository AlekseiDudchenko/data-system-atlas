import { describe, expect, it } from "vitest";
import {
  batchState,
  failureAt,
  reliabilityAt,
  reliabilityCosts,
  simulateReliability,
  type CheckpointMode,
  type ReliabilityPlan,
  type WriteMode,
} from "./reliability";

const all = { drop: true, lostAck: true, crash: true };
const none = { drop: false, lostAck: false, crash: false };
const plan = (overrides: Partial<ReliabilityPlan>): ReliabilityPlan => ({
  retry: true,
  writeMode: "insert",
  checkpoint: "none",
  failures: none,
  ...overrides,
});
const final = (p: ReliabilityPlan) => {
  const run = simulateReliability(p);
  return { run, state: reliabilityAt(run, run.durationMs) };
};
const { batches, batchSize } = reliabilityCosts;

describe("reliability model", () => {
  it("copies every batch exactly once when nothing fails", () => {
    const { run, state } = final(plan({ retry: false }));
    expect(state.status).toBe("done");
    expect(state.uniqueRecords).toBe(batches * batchSize);
    expect(state.repeatedRecords).toBe(0);
    expect(run.durationMs).toBe(batches * 59);
  });

  it("aborts on the first dropped connection without retries", () => {
    const { state } = final(plan({ retry: false, failures: all }));
    expect(state.status).toBe("aborted");
    expect(state.uniqueRecords).toBe(failureAt.drop * batchSize);
    expect(state.retries).toBe(0);
  });

  it("aborts after a lost acknowledgement although the batch was written", () => {
    const { state } = final(
      plan({ retry: false, failures: { ...none, lostAck: true } }),
    );
    expect(state.status).toBe("aborted");
    // The target holds the batch the script believes failed.
    expect(state.uniqueRecords).toBe((failureAt.lostAck + 1) * batchSize);
  });

  it("retries with growing backoff and duplicates the batch whose ack was lost", () => {
    const { run, state } = final(
      plan({ failures: { drop: true, lostAck: true, crash: false } }),
    );
    expect(state.status).toBe("done");
    expect(state.retries).toBe(3);
    expect(
      run.steps.filter((s) => s.kind === "retry").map((s) => s.value),
    ).toEqual([100, 200, 100]);
    expect(state.repeatedRecords).toBe(batchSize);
    expect(batchState(state, failureAt.lostAck)).toBe("repeated");
  });

  it("restarts from zero without a checkpoint", () => {
    const insert = final(plan({ failures: all })).state;
    expect(insert.restarts).toBe(1);
    expect(insert.repeatedRecords).toBe((failureAt.crash + 1 + 1) * batchSize);
    const upsert = final(plan({ failures: all, writeMode: "upsert" }));
    expect(upsert.state.uniqueRecords).toBe(batches * batchSize);
    // Upserts rewrite the same rows: no new rows, but the work repeats.
    expect(upsert.state.repeatedRecords).toBe(insert.repeatedRecords);
  });

  it("resumes after the last saved batch with a checkpoint after the write", () => {
    const { run, state } = final(
      plan({ failures: all, writeMode: "upsert", checkpoint: "after-write" }),
    );
    const restart = run.steps.find((s) => s.kind === "restart");
    expect(restart?.value).toBe(failureAt.crash);
    expect(state.missingRecords).toBe(0);
    // The lost-ack batch and the batch written just before the crash.
    expect(state.repeatedRecords).toBe(2 * batchSize);
  });

  it("loses the batch when the checkpoint is saved before the write", () => {
    const { run, state } = final(
      plan({ failures: all, writeMode: "upsert", checkpoint: "before-write" }),
    );
    expect(run.steps.find((s) => s.kind === "restart")?.value).toBe(
      failureAt.crash + 1,
    );
    expect(state.status).toBe("done");
    expect(state.missingRecords).toBe(batchSize);
    expect(batchState(state, failureAt.crash)).toBe("missing");
  });

  it("charges for idempotent writes and checkpoints", () => {
    const base = final(plan({})).run.durationMs;
    const upsert = final(plan({ writeMode: "upsert" })).run.durationMs;
    const saved = final(plan({ checkpoint: "after-write" })).run.durationMs;
    expect(upsert - base).toBe(batches * 10);
    expect(saved - base).toBe(batches * reliabilityCosts.checkpointMs);
  });

  it("replays monotonically and never invents writes", () => {
    const modes: WriteMode[] = ["insert", "upsert"];
    const checkpoints: CheckpointMode[] = [
      "none",
      "after-write",
      "before-write",
    ];
    for (const writeMode of modes)
      for (const checkpoint of checkpoints)
        for (const retry of [false, true]) {
          const run = simulateReliability(
            plan({ retry, writeMode, checkpoint, failures: all }),
          );
          let previous = reliabilityAt(run, 0);
          expect(previous.status).toBe("idle");
          for (let i = 1; i <= 50; i++) {
            const now = reliabilityAt(run, (run.durationMs * i) / 50);
            expect(now.uniqueRecords).toBeGreaterThanOrEqual(
              previous.uniqueRecords,
            );
            expect(now.uniqueRecords).toBeLessThanOrEqual(batches * batchSize);
            expect(now.position).toBeGreaterThanOrEqual(previous.position);
            previous = now;
          }
          for (let i = 1; i < run.steps.length; i++)
            expect(run.steps[i]!.t).toBeGreaterThanOrEqual(run.steps[i - 1]!.t);
        }
  });
});
