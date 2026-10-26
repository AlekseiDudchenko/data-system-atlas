import { useReducer, useState } from "react";
import {
  FOLLOWERS,
  initialState,
  transition,
  type Follower,
} from "../simulation/replication";
export default function ReplicationLab() {
  const [state, dispatch] = useReducer(transition, undefined, initialState);
  const [value, setValue] = useState("Goodbye");
  const [target, setTarget] = useState<Follower>("A");
  return (
    <section className="lab" aria-labelledby="lab-title">
      <div className="lab-heading">
        <div>
          <span className="eyebrow">LIVE EXPERIMENT / 01</span>
          <h2 id="lab-title">One write. Three perspectives.</h2>
        </div>
        <span className="step">Step {state.step}</span>
      </div>
      <p className="lab-hint">
        Write → read a follower → advance twice → read again. A write queues two
        messages; only advancing time delivers them.
      </p>
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
      <div className="controls-grid">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            dispatch({ type: "write", value });
          }}
        >
          <label htmlFor="value">1 / Write to the leader</label>
          <div className="inline">
            <input
              id="value"
              value={value}
              maxLength={80}
              required
              onChange={(e) => setValue(e.target.value)}
            />
            <button disabled={!value.trim()} type="submit">
              Write value
            </button>
          </div>
          <small>Accepted immediately. Replication takes two steps.</small>
        </form>
        <div>
          <label htmlFor="follower">2 / Read a replica</label>
          <div className="inline">
            <select
              id="follower"
              value={target}
              onChange={(e) => setTarget(e.target.value as Follower)}
            >
              <option value="A">Follower A</option>
              <option value="B">Follower B</option>
            </select>
            <button onClick={() => dispatch({ type: "read", target })}>
              Read follower
            </button>
          </div>
          <small>A read does not advance time or deliver updates.</small>
        </div>
      </div>
      <div className="network">
        <div>
          <span className="control-label">3 / Disrupt the network</span>
          <div className="inline">
            {FOLLOWERS.map((id) => (
              <label className="checkbox" key={id}>
                <input
                  type="checkbox"
                  checked={state.blocked[id]}
                  onChange={(e) =>
                    dispatch({
                      type: "block",
                      target: id,
                      blocked: e.target.checked,
                    })
                  }
                />
                Block follower {id}
              </label>
            ))}
          </div>
        </div>
        <div className="inline">
          <button onClick={() => dispatch({ type: "step" })}>
            Advance one step
          </button>
          <button
            className="secondary"
            onClick={() => {
              dispatch({ type: "reset" });
              setValue("Goodbye");
              setTarget("A");
            }}
          >
            Reset experiment
          </button>
        </div>
      </div>
      <p
        className={`read-result ${state.lastRead?.stale ? "stale" : ""}`}
        role="status"
        aria-live="polite"
      >
        {state.lastRead
          ? `Last read: Follower ${state.lastRead.target} returned “${state.lastRead.value}” (v${state.lastRead.version}). ${state.lastRead.stale ? "Stale read" : "Current read"} — leader was v${state.lastRead.leaderVersion} at read time.`
          : "No read yet. Predict the result, then read a follower."}
      </p>
      <div className="observations">
        <section aria-labelledby="queue-title">
          <h3 id="queue-title">
            In transit <span className="badge">{state.queue.length}</span>
          </h3>
          <p className="muted">FIFO per follower · delivery after two steps</p>
          {state.queue.length ? (
            <ul className="messages" tabIndex={0} aria-labelledby="queue-title">
              {state.queue.map((m) => (
                <li key={`${m.target}-${m.version}`}>
                  <strong>Leader → {m.target}</strong>
                  <span>
                    “{m.value}” · v{m.version}
                  </span>
                  <small>
                    {state.blocked[m.target]
                      ? "Blocked · retained"
                      : m.due <= state.step
                        ? "Ready next step"
                        : `Due at step ${m.due}`}
                  </small>
                </li>
              ))}
            </ul>
          ) : (
            <p>No pending messages.</p>
          )}
        </section>
        <section aria-labelledby="log-title">
          <h3 id="log-title">Event log</h3>
          <p className="muted">Most recent first · last 100 events</p>
          <ol
            className="event-log"
            reversed
            tabIndex={0}
            aria-labelledby="log-title"
          >
            {[...state.log].reverse().map((entry, i) => (
              <li key={`${state.log.length - i}-${entry}`}>{entry}</li>
            ))}
          </ol>
        </section>
      </div>
    </section>
  );
}
