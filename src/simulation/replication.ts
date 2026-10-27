/** A single-key, FIFO, asynchronous replication model. No wall clock or I/O. */
export type Follower = "A" | "B";
export type Replica = Readonly<{ value: string; version: number }>;
export type Message = Readonly<{
  target: Follower;
  value: string;
  version: number;
  due: number;
}>;
export type Event =
  | { type: "write"; value: string }
  | { type: "read"; target: Follower }
  | { type: "block"; target: Follower; blocked: boolean }
  | { type: "step" }
  | { type: "reset" };
export type ReadResult = Readonly<{
  target: Follower;
  value: string;
  version: number;
  leaderVersion: number;
  stale: boolean;
}>;
export type LogEntry = Readonly<
  { step: number } & (
    | { type: "initial"; value: string }
    | { type: "write"; version: number; value: string }
    | {
        type: "read";
        target: Follower;
        value: string;
        version: number;
        stale: boolean;
      }
    | { type: "block"; target: Follower; blocked: boolean }
    | { type: "delivery"; count: number }
  )
>;
export type State = Readonly<{
  step: number;
  leader: Replica;
  followers: Readonly<Record<Follower, Replica>>;
  blocked: Readonly<Record<Follower, boolean>>;
  queue: readonly Message[];
  log: readonly LogEntry[];
  lastRead: ReadResult | null;
}>;
export const FOLLOWERS: readonly Follower[] = ["A", "B"];
export function initialState(): State {
  return {
    step: 0,
    leader: { value: "Hello", version: 0 },
    followers: {
      A: { value: "Hello", version: 0 },
      B: { value: "Hello", version: 0 },
    },
    blocked: { A: false, B: false },
    queue: [],
    log: [{ step: 0, type: "initial", value: "Hello" }],
    lastRead: null,
  };
}
function record(state: State, entry: LogEntry): State {
  return {
    ...state,
    log: [...state.log, entry].slice(-100),
  };
}
export function transition(state: State, event: Event): State {
  switch (event.type) {
    case "reset":
      return initialState();
    case "write": {
      const value = event.value.trim().slice(0, 80);
      if (!value) return state;
      const leader = { value, version: state.leader.version + 1 };
      return record(
        {
          ...state,
          leader,
          queue: [
            ...state.queue,
            ...FOLLOWERS.map((target) => ({
              target,
              ...leader,
              due: state.step + 2,
            })),
          ],
        },
        { step: state.step, type: "write", version: leader.version, value },
      );
    }
    case "read": {
      const replica = state.followers[event.target];
      const stale = replica.version < state.leader.version;
      return record(
        {
          ...state,
          lastRead: {
            target: event.target,
            ...replica,
            leaderVersion: state.leader.version,
            stale,
          },
        },
        {
          step: state.step,
          type: "read",
          target: event.target,
          ...replica,
          stale,
        },
      );
    }
    case "block":
      return record(
        {
          ...state,
          blocked: { ...state.blocked, [event.target]: event.blocked },
        },
        {
          step: state.step,
          type: "block",
          target: event.target,
          blocked: event.blocked,
        },
      );
    case "step": {
      const step = state.step + 1;
      const ready = state.queue.filter(
        (m) => m.due <= step && !state.blocked[m.target],
      );
      const queue = state.queue.filter(
        (m) => m.due > step || state.blocked[m.target],
      );
      const followers = { ...state.followers };
      for (const message of ready)
        followers[message.target] = {
          value: message.value,
          version: message.version,
        };
      return record(
        { ...state, step, queue, followers },
        { step, type: "delivery", count: ready.length },
      );
    }
  }
}
