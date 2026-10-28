import { describe, it, expect } from "vitest";
import {
  canSwitchMigration,
  initialMigration,
  migrationMatches,
  migrationTransition as step,
  type MigrationState,
} from "./migration";
const copyAll = (state: MigrationState) =>
  Array.from({ length: 6 }).reduce<MigrationState>(
    (s) => step(s, { type: "copy" }),
    state,
  );
const drain = (state: MigrationState) =>
  state.changes.reduce<MigrationState>(
    (s) => step(s, { type: "apply" }),
    state,
  );

describe("data migration", () => {
  it("makes a matching offline copy while refusing source writes", () => {
    const start = initialMigration(0);
    expect(step(start, { type: "write" })).toBe(start);
    expect(migrationMatches(copyAll(start))).toBe(true);
    expect(start.target).toEqual([null, null, null, null, null, null]);
  });
  it("cannot recover concurrent writes with a snapshot alone", () => {
    const copied = copyAll(initialMigration(1));
    expect(copied.copied).toBe(6);
    expect(copied.source[0]).toBe(2);
    expect(copied.target[0]).toBe(1);
    expect(migrationMatches(copied)).toBe(false);
    expect(step(copied, { type: "apply" })).toBe(copied);
  });
  it("replays writes from the snapshot boundary after copying, without overwriting newer changes", () => {
    const start = initialMigration(2);
    const written = step(step(start, { type: "write" }), { type: "write" });
    expect(step(written, { type: "apply" })).toBe(written);
    const copied = copyAll(written);
    const replayed = drain(copied);
    expect(replayed.target[0]).toBe(3);
    expect(migrationMatches(replayed)).toBe(true);
    expect(start.source[0]).toBe(1);
    const next = step(replayed, { type: "write" });
    expect(migrationMatches(next)).toBe(false);
    expect(migrationMatches(drain(next))).toBe(true);
    expect(next.applied).toBe(2);
  });
  it("requires a write fence and drained stream, and freezes the source after cutover", () => {
    const start = initialMigration(3);
    expect(canSwitchMigration(start)).toBe(false);
    expect(step(start, { type: "switch" })).toBe(start);
    const caughtUp = drain(start);
    expect(canSwitchMigration(caughtUp)).toBe(false);
    const written = step(caughtUp, { type: "write" });
    const fenced = step(written, { type: "pause" });
    expect(canSwitchMigration(fenced)).toBe(false);
    const ready = drain(fenced);
    expect(canSwitchMigration(ready)).toBe(true);
    expect(step(ready, { type: "write" })).toBe(ready);
    const switched = step(ready, { type: "switch" });
    expect(switched.switched).toBe(true);
    for (const type of ["write", "copy", "apply", "pause", "switch"] as const) {
      expect(step(switched, { type })).toBe(switched);
    }
  });
});
