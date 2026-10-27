import { translator, type Locale } from "../i18n";
import { FOLLOWERS, type State } from "../simulation/replication";
export default function ReplicationTopology({
  state,
  locale = "en",
}: {
  state: State;
  locale?: Locale;
}) {
  const t = translator(locale);
  return (
    <>
      <svg
        className="topology"
        viewBox="0 0 780 250"
        role="img"
        aria-label={t(
          "Leader version {0}. Follower A version {1}, {2}. Follower B version {3}, {4}.",
          state.leader.version,
          state.followers.A.version,
          state.blocked.A ? t("blocked") : t("connected"),
          state.followers.B.version,
          state.blocked.B ? t("blocked") : t("connected"),
        )}
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
                ? t("× blocked")
                : `${state.queue.filter((m) => m.target === id).length} ${t("queued")}`}
            </text>
          </g>
        ))}
        <rect x="25" y="75" width="265" height="100" rx="14" fill="#113d3a" />
        <text x="48" y="110" fill="#95ebd4">
          {t("LEADER · v")}
          {state.leader.version}
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
              {t("FOLLOWER") + " "}
              {id}
              {" " + t("· v")}
              {state.followers[id].version}
            </text>
            <text x="500" y={i * 130 + 81} fill="#172f2b">
              {state.followers[id].value.length > 20
                ? `${state.followers[id].value.slice(0, 20)}…`
                : state.followers[id].value}
            </text>
          </g>
        ))}
      </svg>
      <div className="node-summary" aria-label={t("Full node values")}>
        <p>
          {t("Leader:") + " "}
          <strong>{state.leader.value}</strong>
          {" " + t("· v")}
          {state.leader.version}
        </p>
        {FOLLOWERS.map((id) => (
          <p key={id}>
            {t("Follower") + " "}
            {id}: <strong>{state.followers[id].value}</strong>
            {" " + t("· v")}
            {state.followers[id].version} ·{" "}
            {state.followers[id].version < state.leader.version
              ? t("behind")
              : t("caught up")}
          </p>
        ))}
      </div>
    </>
  );
}
