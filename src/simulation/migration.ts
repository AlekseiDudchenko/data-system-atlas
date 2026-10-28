export type MigrationStage = 0 | 1 | 2 | 3;
export type Change = Readonly<{ row: number; version: number }>;
export type MigrationState = Readonly<{
  stage: MigrationStage;
  source: readonly number[];
  target: readonly (number | null)[];
  snapshot: readonly number[];
  copied: number;
  changes: readonly Change[];
  applied: number;
  paused: boolean;
  switched: boolean;
}>;
export type MigrationEvent =
  | { type: "copy" }
  | { type: "write" }
  | { type: "apply" }
  | { type: "pause" }
  | { type: "switch" };

export function initialMigration(stage: MigrationStage): MigrationState {
  const snapshot = [1, 1, 1, 1, 1, 1];
  return {
    stage,
    snapshot,
    source:
      stage === 1
        ? [2, 1, 1, 1, 1, 1]
        : stage === 3
          ? [3, 1, 1, 1, 1, 1]
          : [...snapshot],
    target:
      stage === 1
        ? [1, 1, 1, null, null, null]
        : stage === 3
          ? [...snapshot]
          : Array<null>(6).fill(null),
    copied: stage === 1 ? 3 : stage === 3 ? 6 : 0,
    changes:
      stage === 3
        ? [
            { row: 0, version: 2 },
            { row: 0, version: 3 },
          ]
        : [],
    applied: 0,
    paused: stage === 0,
    switched: false,
  };
}

export function migrationMatches(state: MigrationState): boolean {
  return state.source.every((version, i) => state.target[i] === version);
}

export function canSwitchMigration(state: MigrationState): boolean {
  return (
    state.stage === 3 &&
    state.paused &&
    !state.switched &&
    state.copied === state.snapshot.length &&
    state.applied === state.changes.length &&
    migrationMatches(state)
  );
}

/** A snapshot and its change-stream boundary are captured atomically in this model. */
export function migrationTransition(
  state: MigrationState,
  event: MigrationEvent,
): MigrationState {
  if (state.switched) return state;
  switch (event.type) {
    case "copy": {
      if (state.copied >= state.snapshot.length) return state;
      const target = [...state.target];
      const version = state.snapshot[state.copied];
      if (version === undefined) return state;
      target[state.copied] = version;
      return { ...state, target, copied: state.copied + 1 };
    }
    case "write": {
      if (state.paused) return state;
      const source = [...state.source];
      const version = (source[0] ?? 0) + 1;
      source[0] = version;
      return {
        ...state,
        source,
        changes:
          state.stage >= 2
            ? [...state.changes, { row: 0, version }]
            : state.changes,
      };
    }
    case "apply": {
      if (
        state.stage < 2 ||
        state.copied < state.snapshot.length ||
        state.applied >= state.changes.length
      )
        return state;
      const change = state.changes[state.applied];
      if (!change) return state;
      const target = [...state.target];
      target[change.row] = change.version;
      return { ...state, target, applied: state.applied + 1 };
    }
    case "pause":
      return state.stage === 3 ? { ...state, paused: !state.paused } : state;
    case "switch":
      return canSwitchMigration(state) ? { ...state, switched: true } : state;
  }
}
