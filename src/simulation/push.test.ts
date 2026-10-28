import { describe, expect, it } from "vitest";
import { owner, pushAt, pushTiming, simulatePush, type PushPlan } from "./push";

const base: PushPlan = {
  mode: "queue",
  rate: 1_000,
  consumers: 1,
  consumerRate: 1_500,
  partitions: 4,
  outageS: 0,
  capacity: 100_000,
  poison: false,
  deadLetter: false,
  crash: false,
  commitEveryS: 2,
  idempotent: false,
  skewed: false,
};
const run = (overrides: Partial<PushPlan>) =>
  simulatePush({ ...base, ...overrides });
const last = (overrides: Partial<PushPlan>) => run(overrides).ticks.at(-1)!;

describe("push model", () => {
  it("keeps up without disruptions and conserves events", () => {
    const end = last({});
    expect(end.produced).toBe(60_000);
    expect(end.written + end.lag + end.lost).toBe(end.produced);
    expect(end.lost).toBe(0);
    expect(run({}).maxLag).toBeLessThanOrEqual(100);
  });

  it("loses events in a direct push when the target is down", () => {
    const direct = run({ mode: "direct", capacity: 1_000, outageS: 15 });
    const end = direct.ticks.at(-1)!;
    expect(direct.maxLag).toBe(1_000);
    expect(end.lost).toBe(15_000 - 1_000);
    expect(end.written + end.lag + end.lost).toBe(end.produced);
  });

  it("buffers the outage in a queue and drains it afterwards", () => {
    const queued = run({ outageS: 15 });
    expect(queued.ticks.at(-1)!.lost).toBe(0);
    expect(queued.maxLag).toBeGreaterThanOrEqual(15_000);
    // Spare capacity is 500 events per second: about 30 s to drain.
    expect(queued.recoveryS).toBeGreaterThan(28);
    expect(queued.recoveryS).toBeLessThan(32);
    const faster = run({ outageS: 15, consumerRate: 3_000 });
    expect(faster.recoveryS!).toBeLessThan(queued.recoveryS!);
  });

  it("drops the oldest events beyond retention", () => {
    const end = last({ outageS: 30, capacity: 20_000 });
    expect(end.lost).toBeGreaterThan(0);
    expect(
      Math.max(
        ...run({ outageS: 30, capacity: 20_000 }).ticks.map((t) => t.lag),
      ),
    ).toBeLessThanOrEqual(20_000);
  });

  it("blocks one partition on a poison event unless it is dead-lettered", () => {
    const stuck = run({ poison: true, consumers: 2 });
    const end = stuck.ticks.at(-1)!;
    expect(end.poisonBlocked).toBe(true);
    expect(end.deadLettered).toBe(0);
    // Only partition 1 stops: a quarter of the events pile up behind it.
    expect(end.depth[0]).toBeGreaterThan(12_000);
    expect(end.depth.slice(1).every((d) => d <= 100)).toBe(true);
    const parked = run({ poison: true, consumers: 2, deadLetter: true });
    const after = parked.ticks.at(-1)!;
    expect(after.deadLettered).toBe(1);
    expect(after.poisonBlocked).toBe(false);
    expect(after.lag).toBeLessThanOrEqual(100);
  });

  it("redelivers uncommitted events after a crash", () => {
    const plain = last({ crash: true });
    expect(plain.duplicates).toBeGreaterThan(0);
    expect(plain.duplicates).toBeLessThanOrEqual(2 * 1_000);
    expect(plain.duplicates % 100).toBe(0);
    expect(plain.written).toBe(plain.produced - plain.lag + plain.duplicates);
    const safe = last({ crash: true, idempotent: true });
    expect(safe.duplicates).toBe(0);
    expect(safe.written + safe.lag).toBe(safe.produced);
    const often = last({ crash: true, commitEveryS: 0.5 });
    const rarely = last({ crash: true, commitEveryS: 5 });
    expect(often.duplicates).toBeLessThan(plain.duplicates);
    expect(rarely.duplicates).toBeGreaterThan(plain.duplicates);
  });

  it("scales with consumers up to the partition count", () => {
    const lagAt = (consumers: number, skewed = false) =>
      last({
        rate: 4_000,
        consumerRate: 1_000,
        partitions: 8,
        consumers,
        skewed,
      }).lag;
    expect(lagAt(2)).toBeGreaterThan(lagAt(4));
    expect(lagAt(8)).toBeLessThanOrEqual(400);
    expect(lagAt(12)).toBe(lagAt(8));
    expect(owner(9, 12)).toBe(9);
    // Half the events on one partition overload its single consumer.
    expect(lagAt(8, true)).toBeGreaterThan(lagAt(8) + 10_000);
  });

  it("reads ticks by elapsed time", () => {
    const r = run({});
    expect(pushAt(r, 0).index).toBe(0);
    expect(pushAt(r, pushTiming.durationS).index).toBe(r.ticks.length - 1);
    expect(pushAt(r, 12.34).elapsedS).toBeCloseTo(12.3);
  });
});
