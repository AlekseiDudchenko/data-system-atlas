import { FOLLOWERS, type State } from "../simulation/replication";
export default function ReplicationTopology({ state }: { state: State }) {
  return (
    <>
      <svg
        className="topology"
        viewBox="0 0 780 250"
        role="img"
        aria-label={`Leader version ${state.leader.version}. Follower A version ${state.followers.A.version}, ${state.blocked.A ? "blocked" : "connected"}. Follower B version ${state.followers.B.version}, ${state.blocked.B ? "blocked" : "connected"}.`}
      >
        <defs>
          <marker
            id="arrow"
            markerWidth="8"
            markerHeight="8"
            refX="7"
            refY="4"
            orient="auto"
          >
            <path d="M0 0 L8 4 L0 8" fill="currentColor" />
          </marker>
        </defs>
        {FOLLOWERS.map((id, i) => (
          <g key={id}>
            <path
              d={`M 290 125 Q 385 125 475 ${i === 0 ? 60 : 190}`}
              fill="none"
              stroke={state.blocked[id] ? "#b45309" : "#178176"}
              strokeWidth="2"
              strokeDasharray={state.blocked[id] ? "5 6" : undefined}
              markerEnd="url(#arrow)"
            />
            <text x="345" y={i === 0 ? 62 : 216} fill="currentColor">
              {state.blocked[id]
                ? "× blocked"
                : `${state.queue.filter((m) => m.target === id).length} pending`}
            </text>
          </g>
        ))}
        <rect x="25" y="75" width="265" height="100" rx="14" fill="#113d3a" />
        <text x="48" y="110" fill="#95ebd4">
          LEADER · v{state.leader.version}
        </text>
        <text x="48" y="148" fill="white">
          {state.leader.value.length > 20
            ? `${state.leader.value.slice(0, 20)}…`
            : state.leader.value}
        </text>
        {FOLLOWERS.map((id, i) => (
          <g key={id}>
            <rect
              x="480"
              y={i * 130 + 12}
              width="275"
              height="100"
              rx="14"
              fill="#fff"
              stroke="#a5bcb3"
            />
            <text x="500" y={i * 130 + 45} fill="#294b43">
              FOLLOWER {id} · v{state.followers[id].version}
            </text>
            <text x="500" y={i * 130 + 81} fill="#172f2b">
              {state.followers[id].value.length > 20
                ? `${state.followers[id].value.slice(0, 20)}…`
                : state.followers[id].value}
            </text>
          </g>
        ))}
      </svg>
      <div className="node-summary" aria-label="Full node values">
        <p>
          Leader: <strong>{state.leader.value}</strong> · v
          {state.leader.version}
        </p>
        {FOLLOWERS.map((id) => (
          <p key={id}>
            Follower {id}: <strong>{state.followers[id].value}</strong> · v
            {state.followers[id].version} ·{" "}
            {state.followers[id].version < state.leader.version
              ? "behind"
              : "caught up"}
          </p>
        ))}
      </div>
    </>
  );
}
