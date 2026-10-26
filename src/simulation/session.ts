import {
  initialState,
  transition,
  type Event,
  type Follower,
  type State,
  type ReadResult,
} from "./replication";

export type Policy = "ordinary" | "session";
type Request = Readonly<{
  target: Follower;
  policy: Policy;
  minimumVersion: number;
}>;
export type SessionRead =
  | (Request & Readonly<{ status: "waiting" }>)
  | (Request & Readonly<{ status: "returned"; result: ReadResult }>);
export type SessionState = Readonly<{
  replication: State;
  minimumVersion: number;
  read: SessionRead | null;
}>;
export type SessionEvent =
  | Exclude<Event, { type: "read" }>
  | { type: "read"; target: Follower; policy: Policy }
  | { type: "cancel" };

export function initialSession(): SessionState {
  return { replication: initialState(), minimumVersion: 0, read: null };
}

function resolve(replication: State, request: Request): SessionRead {
  const replica = replication.followers[request.target];
  if (replica.version < request.minimumVersion)
    return { ...request, status: "waiting" };
  return {
    ...request,
    status: "returned",
    result: {
      target: request.target,
      ...replica,
      leaderVersion: replication.leader.version,
      stale: replica.version < replication.leader.version,
    },
  };
}

/** One sequential client: a pending read must finish or be canceled before writing. */
export function sessionTransition(
  state: SessionState,
  event: SessionEvent,
): SessionState {
  if (event.type === "reset") return initialSession();
  if (event.type === "cancel") return { ...state, read: null };
  if (event.type === "read") {
    if (state.read?.status === "waiting") return state;
    return {
      ...state,
      read: resolve(state.replication, {
        target: event.target,
        policy: event.policy,
        minimumVersion: event.policy === "session" ? state.minimumVersion : 0,
      }),
    };
  }
  if (event.type === "write" && state.read?.status === "waiting") return state;
  const replication = transition(state.replication, event);
  return {
    replication,
    minimumVersion:
      event.type === "write"
        ? replication.leader.version
        : state.minimumVersion,
    read:
      state.read?.status === "waiting" && event.type === "step"
        ? resolve(replication, state.read)
        : state.read,
  };
}
