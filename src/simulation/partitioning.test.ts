import { describe, it, expect } from "vitest";
import {
  CAPACITY,
  KEYS,
  PARTITIONS,
  initialPartitioning,
  owner,
  partitionTransition,
  workloadKeys,
  type PartitionEvent,
  type PartitionState,
} from "./partitioning";
const run = (
  events: PartitionEvent[],
  start: PartitionState = initialPartitioning(),
) => events.reduce(partitionTransition, start);
describe("partitioning and hotspots", () => {
  it("assigns every key exactly once and sends an even batch without a queue", () => {
    expect(
      PARTITIONS.map((id) => KEYS.filter((key) => owner(key) === id).length),
    ).toEqual([4, 4, 4]);
    const state = run([{ type: "batch" }]);
    expect(state.step).toBe(1);
    expect(state.lastArrivals).toEqual([4, 4, 4]);
    expect(state.loads).toEqual(
      PARTITIONS.map(() => ({ received: 4, completed: 4, queued: 0 })),
    );
  });
  it("reproduces overload despite sufficient aggregate capacity and drains without new work", () => {
    const state = run([
      { type: "workload", workload: "hot" },
      { type: "batch" },
    ]);
    expect(state.lastArrivals).toEqual([10, 1, 1]);
    expect(state.loads).toEqual([
      { received: 10, completed: 4, queued: 6 },
      { received: 1, completed: 1, queued: 0 },
      { received: 1, completed: 1, queued: 0 },
    ]);
    const twice = run([{ type: "batch" }], state);
    expect(twice.loads[0]).toEqual({ received: 20, completed: 8, queued: 12 });
    const drained = run(
      [{ type: "drain" }, { type: "drain" }, { type: "drain" }],
      twice,
    );
    expect(drained.loads.map((load) => load.queued)).toEqual([0, 0, 0]);
    expect(drained.loads.map((load) => load.received)).toEqual([20, 2, 2]);
    expect(drained.loads.map((load) => load.completed)).toEqual([20, 2, 2]);
    expect(drained.lastArrivals).toEqual([0, 0, 0]);
  });
  it("rotates the hotspot for every chosen key including cyclic background keys", () => {
    for (const key of KEYS) {
      const keys = workloadKeys("hot", key);
      expect(keys).toHaveLength(12);
      expect(keys.filter((candidate) => candidate === key)).toHaveLength(9);
      expect(keys.every((candidate) => KEYS.includes(candidate))).toBe(true);
      const state = run([{ type: "batch" }], initialPartitioning("hot", key));
      expect(state.lastArrivals).toEqual(
        PARTITIONS.map((id) => (id === owner(key) ? 10 : 1)),
      );
    }
  });
  it("starts fresh when choices change and preserves choices when resetting", () => {
    const hot = run([
      { type: "workload", workload: "hot" },
      { type: "hot-key", key: 11 },
      { type: "batch" },
    ]);
    expect(run([{ type: "reset" }], hot)).toEqual(
      initialPartitioning("hot", 11),
    );
    expect(run([{ type: "workload", workload: "even" }], hot)).toEqual(
      initialPartitioning("even", 11),
    );
    expect(run([{ type: "hot-key", key: 3 }], hot)).toEqual(
      initialPartitioning("hot", 3),
    );
    for (const key of [-1, 12, 1.5, NaN])
      expect(run([{ type: "hot-key", key }], hot)).toBe(hot);
  });
  it("is repeatable, preserves earlier nested state and keeps idle drains empty", () => {
    const start = run([
      { type: "workload", workload: "hot" },
      { type: "batch" },
    ]);
    const before = structuredClone(start);
    const events: PartitionEvent[] = [{ type: "batch" }, { type: "drain" }];
    expect(run(events, start)).toEqual(run(events, start));
    expect(start).toEqual(before);
    expect(run([{ type: "drain" }]).loads).toEqual(initialPartitioning().loads);
  });
  it("conserves requests and never exceeds local service capacity over sustained traffic", () => {
    let state = initialPartitioning("hot", 5);
    let batches = 0;
    for (let step = 0; step < 200; step++) {
      const previous = state;
      const type = step % 5 === 0 ? "drain" : "batch";
      if (type === "batch") batches++;
      state = partitionTransition(state, { type });
      expect(state.loads.reduce((sum, load) => sum + load.received, 0)).toBe(
        12 * batches,
      );
      state.loads.forEach((load, id) => {
        expect(load.received).toBe(load.completed + load.queued);
        expect(load.queued).toBeGreaterThanOrEqual(0);
        expect(
          load.completed - previous.loads[id]!.completed,
        ).toBeLessThanOrEqual(CAPACITY);
        expect(load.completed).toBeGreaterThanOrEqual(
          previous.loads[id]!.completed,
        );
      });
    }
  });
});
