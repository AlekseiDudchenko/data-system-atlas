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
export type State = Readonly<{
  step: number;
  leader: Replica;
  followers: Readonly<Record<Follower, Replica>>;
  blocked: Readonly<Record<Follower, boolean>>;
  queue: readonly Message[];
  log: readonly string[];
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
    log: ["Step 0 · All replicas begin at v0: “Hello”."],
    lastRead: null,
  };
}
function record(state: State, message: string): State {
  return {
    ...state,
    log: [...state.log, `Step ${state.step} · ${message}`].slice(-100),
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
        `Leader accepted v${leader.version}: “${value}”. Two updates queued.`,
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
        `Read follower ${event.target}: “${replica.value}” (v${replica.version}) — ${stale ? "STALE" : "current"} at read time.`,
      );
    }
    case "block":
      return record(
        {
          ...state,
          blocked: { ...state.blocked, [event.target]: event.blocked },
        },
        `Replication to ${event.target} ${event.blocked ? "blocked" : "restored"}. Queued updates are retained.`,
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
        ready.length
          ? `Delivered ${ready.length} update(s), in write order per follower.`
          : "No updates delivered. Links may be blocked or messages are not due yet.",
      );
    }
  }
}
