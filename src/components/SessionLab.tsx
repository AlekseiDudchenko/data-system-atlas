import { useReducer, useState } from "react";
import { FOLLOWERS, type Follower } from "../simulation/replication";
import { initialSession, sessionTransition } from "../simulation/session";
import ReplicationTopology from "./ReplicationTopology";

export default function SessionLab() {
  const [state, dispatch] = useReducer(
    sessionTransition,
    undefined,
    initialSession,
  );
  const [value, setValue] = useState("New name");
  const [target, setTarget] = useState<Follower>("B");
  const waiting = state.read?.status === "waiting";
  return (
    <section className="lab" aria-labelledby="session-lab-title">
      <div className="lab-heading">
        <div>
          <span className="eyebrow">LIVE EXPERIMENT / 02</span>
          <h2 id="session-lab-title">Your write. Your next read.</h2>
        </div>
        <span className="step">Step {state.replication.step}</span>
      </div>
      <p className="lab-hint">
        Write → try an ordinary read → require your write → advance twice.
      </p>
      <p className="session-summary">
        Client: <strong>You</strong> · Session minimum:{" "}
        <strong>v{state.minimumVersion}</strong>
      </p>
      <ReplicationTopology state={state.replication} />
      <div className="controls-grid">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            dispatch({ type: "write", value });
          }}
        >
          <label htmlFor="session-value">1 / Update your profile name</label>
          <div className="inline">
            <input
              id="session-value"
              required
              maxLength={80}
              value={value}
              disabled={waiting}
              onChange={(e) => setValue(e.target.value)}
            />
            <button type="submit" disabled={waiting || !value.trim()}>
              Write name
            </button>
          </div>
          <small>
            Each acknowledged write raises your session minimum. One client, one
            operation at a time.
          </small>
        </form>
        <div>
          <label htmlFor="session-follower">2 / Choose a follower</label>
          <select
            id="session-follower"
            value={target}
            disabled={waiting}
            onChange={(e) => setTarget(e.target.value as Follower)}
          >
            <option value="A">Follower A</option>
            <option value="B">Follower B</option>
          </select>
          <div className="inline session-actions">
            <button
              disabled={waiting}
              onClick={() =>
                dispatch({ type: "read", target, policy: "ordinary" })
              }
            >
              Read immediately
            </button>
            <button
              disabled={waiting}
              onClick={() =>
                dispatch({ type: "read", target, policy: "session" })
              }
            >
              Read my writes
            </button>
          </div>
          <small>
            Immediate reads may be old. Session reads wait for at least your
            last acknowledged write.
          </small>
        </div>
      </div>
      <div className="network">
        <div>
          <span className="control-label">3 / Disrupt replication</span>
          <div className="inline">
            {FOLLOWERS.map((id) => (
              <label className="checkbox" key={id}>
                <input
                  type="checkbox"
                  checked={state.replication.blocked[id]}
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
              setValue("New name");
              setTarget("B");
            }}
          >
            Reset experiment
          </button>
        </div>
      </div>
      <p
        className={`read-result ${waiting || (state.read?.status === "returned" && state.read.result.stale) ? "stale" : ""}`}
        role="status"
        aria-live="polite"
      >
        {state.read?.status === "waiting"
          ? `Waiting on follower ${state.read.target} for at least v${state.read.minimumVersion}; it has v${state.replication.followers[state.read.target].version}. No value returned. Restore replication and advance time, or cancel this read.`
          : state.read?.status === "returned"
            ? `${state.read.policy === "session" ? "Session read" : "Immediate read"}: follower ${state.read.target} returned “${state.read.result.value}” (v${state.read.result.version}). Required at least v${state.read.minimumVersion}. ${state.read.result.stale ? "Older than the leader" : "Current at completion"} (leader v${state.read.result.leaderVersion}). This result is historical.`
            : "No read yet. Predict which policy can return an old name."}
      </p>
      {waiting && (
        <button
          className="secondary"
          onClick={() => dispatch({ type: "cancel" })}
        >
          Cancel waiting read
        </button>
      )}
      <p className="lab-hint">
        {state.replication.queue.length} replication messages pending. Blocking
        a link retains its messages; restoring it delivers nothing until the
        next step. A waiting read stays on its chosen follower.
      </p>
    </section>
  );
}
