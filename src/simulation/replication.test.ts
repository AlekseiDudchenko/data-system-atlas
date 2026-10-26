import { describe, it, expect } from "vitest";
import {
  initialState,
  transition,
  type Event,
  type State,
} from "./replication";
const run = (events: Event[], state: State = initialState()) =>
  events.reduce(transition, state);
describe("asynchronous replication", () => {
  it("updates the leader immediately and reproduces a stale read", () => {
    const s = run([
      { type: "write", value: "new" },
      { type: "read", target: "A" },
    ]);
    expect(s.leader).toEqual({ value: "new", version: 1 });
    expect(s.followers.A.version).toBe(0);
    expect(s.queue).toHaveLength(2);
    expect(s.lastRead).toMatchObject({
      stale: true,
      value: "Hello",
      leaderVersion: 1,
    });
  });
  it("delivers nothing before due time and converges at step two", () => {
    const s = run([{ type: "write", value: "new" }, { type: "step" }]);
    expect(s.followers.A.version).toBe(0);
    const next = run([{ type: "step" }, { type: "read", target: "A" }], s);
    expect(next.followers.B.value).toBe("new");
    expect(next.queue).toHaveLength(0);
    expect(next.lastRead?.stale).toBe(false);
  });
  it("retains blocked updates while the other follower catches up, and drains FIFO after restore", () => {
    const s = run([
      { type: "block", target: "B", blocked: true },
      { type: "write", value: "one" },
      { type: "step" },
      { type: "write", value: "two" },
      { type: "step" },
      { type: "step" },
    ]);
    expect(s.followers.A.version).toBe(2);
    expect(s.followers.B.version).toBe(0);
    expect(s.queue.map((m) => m.version)).toEqual([1, 2]);
    const restored = transition(s, {
      type: "block",
      target: "B",
      blocked: false,
    });
    expect(restored.followers.B.version).toBe(0);
    const final = transition(restored, { type: "step" });
    expect(final.followers.B).toEqual(final.leader);
    expect(final.queue).toHaveLength(0);
  });
  it("preserves historical read results after delivery", () => {
    const s = run([
      { type: "write", value: "new" },
      { type: "read", target: "A" },
      { type: "step" },
      { type: "step" },
    ]);
    expect(s.lastRead?.stale).toBe(true);
    expect(s.lastRead?.version).toBe(0);
  });
  it("is deterministic, does not mutate previous state, and resets completely", () => {
    const start = initialState();
    const before = structuredClone(start);
    const events: Event[] = [
      { type: "write", value: "x" },
      { type: "step" },
      { type: "read", target: "B" },
    ];
    expect(run(events, start)).toEqual(run(events, start));
    expect(start).toEqual(before);
    expect(transition(run(events), { type: "reset" })).toEqual(initialState());
  });
  it("validates blank values, bounds strings, and versions identical writes", () => {
    expect(transition(initialState(), { type: "write", value: "  " })).toEqual(
      initialState(),
    );
    expect(
      run([{ type: "write", value: "a".repeat(100) }]).leader.value.length,
    ).toBe(80);
    expect(
      run([
        { type: "write", value: "same" },
        { type: "write", value: "same" },
      ]).leader.version,
    ).toBe(2);
  });
  it("keeps nodes monotonic and queue accounting correct across a reproducible event sequence", () => {
    let s = initialState();
    for (let i = 0; i < 120; i++) {
      const prev = s;
      const events: Event[] = [
        { type: "write", value: `v${i}` },
        { type: "step" },
        { type: "block", target: "B", blocked: i % 8 === 2 },
        { type: "read", target: "A" },
      ];
      s = transition(s, events[i % 4]!);
      for (const id of ["A", "B"] as const) {
        expect(s.followers[id].version).toBeGreaterThanOrEqual(
          prev.followers[id].version,
        );
        expect(s.followers[id].version).toBeLessThanOrEqual(s.leader.version);
      }
      expect(s.queue).toHaveLength(
        s.leader.version -
          s.followers.A.version +
          (s.leader.version - s.followers.B.version),
      );
      expect(s.log.length).toBeLessThanOrEqual(100);
    }
  });
});
