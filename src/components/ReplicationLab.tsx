import ReplicationTopology from "./ReplicationTopology";
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
      <ReplicationTopology state={state} />
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
