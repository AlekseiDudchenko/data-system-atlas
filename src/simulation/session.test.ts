import { describe, it, expect } from "vitest";
import {
  initialSession,
  sessionTransition,
  type SessionEvent,
  type SessionState,
} from "./session";
const run = (events: SessionEvent[], start: SessionState = initialSession()) =>
  events.reduce(sessionTransition, start);
describe("read-your-writes session", () => {
  it("compares an old immediate result with a waiting session read on the same follower", () => {
    const written = run([{ type: "write", value: "New name" }]);
    expect(written.minimumVersion).toBe(1);
    const ordinary = run(
      [{ type: "read", target: "B", policy: "ordinary" }],
      written,
    );
    expect(ordinary.read).toMatchObject({
      status: "returned",
      result: { value: "Hello", version: 0, stale: true },
    });
    const waiting = run(
      [{ type: "read", target: "B", policy: "session" }],
      ordinary,
    );
    expect(waiting.read).toEqual({
      status: "waiting",
      target: "B",
      policy: "session",
      minimumVersion: 1,
    });
    const early = run([{ type: "step" }], waiting);
    expect(early.read?.status).toBe("waiting");
    expect(run([{ type: "step" }], early).read).toMatchObject({
      status: "returned",
      minimumVersion: 1,
      result: { value: "New name", version: 1 },
    });
  });
  it("waits through blocked delivery and restore alone, then completes without another read", () => {
    let state = run([
      { type: "block", target: "B", blocked: true },
      { type: "write", value: "one" },
      { type: "read", target: "B", policy: "session" },
    ]);
    for (let i = 0; i < 10; i++)
      state = sessionTransition(state, { type: "step" });
    expect(state.read?.status).toBe("waiting");
    expect(state.replication.followers.A.version).toBe(1);
    const restored = run(
      [{ type: "block", target: "B", blocked: false }],
      state,
    );
    expect(restored.read?.status).toBe("waiting");
    expect(run([{ type: "step" }], restored).read).toMatchObject({
      status: "returned",
      result: { version: 1 },
    });
  });
  it("fixes a pending request and enforces sequential client operations", () => {
    const waiting = run([
      { type: "write", value: "one" },
      { type: "read", target: "B", policy: "session" },
    ]);
    expect(run([{ type: "write", value: "two" }], waiting)).toBe(waiting);
    expect(
      run([{ type: "read", target: "A", policy: "ordinary" }], waiting),
    ).toBe(waiting);
    const canceled = run([{ type: "cancel" }], waiting);
    expect(canceled.read).toBeNull();
    expect(canceled.minimumVersion).toBe(1);
    const next = run(
      [
        { type: "step" },
        { type: "step" },
        { type: "read", target: "A", policy: "session" },
      ],
      canceled,
    );
    expect(next.read).toMatchObject({
      status: "returned",
      target: "A",
      minimumVersion: 1,
      result: { version: 1 },
    });
  });
  it("tracks accepted writes only, supports zero minimum and preserves completed observations", () => {
    expect(
      run([{ type: "read", target: "A", policy: "session" }]).read,
    ).toMatchObject({
      status: "returned",
      minimumVersion: 0,
      result: { version: 0 },
    });
    const written = run([
      { type: "write", value: "one" },
      { type: "write", value: "  " },
      { type: "write", value: "one" },
    ]);
    expect(written.minimumVersion).toBe(2);
    const completed = run(
      [
        { type: "step" },
        { type: "step" },
        { type: "read", target: "A", policy: "session" },
      ],
      written,
    );
    const later = run(
      [{ type: "write", value: "three" }, { type: "step" }, { type: "step" }],
      completed,
    );
    expect(later.minimumVersion).toBe(3);
    expect(later.read).toEqual(completed.read);
    expect(later.read).toMatchObject({
      minimumVersion: 2,
      result: { version: 2, leaderVersion: 2 },
    });
  });
  it("is deterministic, preserves previous state and resets a pending session completely", () => {
    const start = initialSession();
    const before = structuredClone(start);
    const events: SessionEvent[] = [
      { type: "write", value: "x" },
      { type: "read", target: "B", policy: "session" },
      { type: "step" },
    ];
    expect(run(events, start)).toEqual(run(events, start));
    expect(start).toEqual(before);
    expect(run([{ type: "reset" }], run(events))).toEqual(initialSession());
  });
  it("never returns a session result below its request minimum across failure/recovery sequences", () => {
    let state = initialSession();
    for (let i = 0; i < 40; i++) {
      const events: SessionEvent[] = [
        { type: "cancel" },
        { type: "block", target: "B", blocked: i % 3 !== 0 },
        { type: "write", value: `name ${i}` },
        { type: "read", target: i % 2 ? "A" : "B", policy: "session" },
        { type: "step" },
        { type: "step" },
      ];
      for (const event of events) {
        state = sessionTransition(state, event);
        expect(state.minimumVersion).toBe(state.replication.leader.version);
        if (state.read?.status === "returned")
          expect(state.read.result.version).toBeGreaterThanOrEqual(
            state.read.minimumVersion,
          );
      }
    }
  });
});
