import { translator, type Locale } from "../i18n";
import { useHydrated } from "./useHydrated";
import { useReducer, useState } from "react";
import { FOLLOWERS, type Follower } from "../simulation/replication";
import { initialSession, sessionTransition } from "../simulation/session";
import ReplicationTopology from "./ReplicationTopology";

export default function SessionLab({ locale = "en" }: { locale?: Locale }) {
  const t = translator(locale);
  const hydrated = useHydrated();
  const [state, dispatch] = useReducer(
    sessionTransition,
    undefined,
    initialSession,
  );
  const [value, setValue] = useState(t("New name"));
  const [target, setTarget] = useState<Follower>("B");
  const waiting = state.read?.status === "waiting";
  return (
    <section className="lab" aria-labelledby="session-lab-title">
      <div className="lab-heading">
        <div>
          <span className="eyebrow">{t("LIVE EXPERIMENT / 02")}</span>
          <h2 id="session-lab-title">{t("Your write. Your next read.")}</h2>
        </div>
        <span className="step">
          {t("Step") + " "}
          {state.replication.step}
        </span>
      </div>
      <p className="lab-hint">
        {t(
          "Write → try an ordinary read → require your write → advance twice.",
        )}
      </p>
      <p className="session-summary">
        {t("Client:") + " "}
        <strong>{t("You")}</strong>
        {" " + t("· Session minimum:")}{" "}
        <strong>
          {t("v")}
          {state.minimumVersion}
        </strong>
      </p>
      <ReplicationTopology locale={locale} state={state.replication} />
      <fieldset
        className="lab-controls"
        disabled={!hydrated}
        aria-label={t("Experiment controls")}
      >
        <div className="controls-grid">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              dispatch({ type: "write", value });
            }}
          >
            <label htmlFor="session-value">
              {t("1 / Update your profile name")}
            </label>
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
                {t("Write name")}
              </button>
            </div>
            <small>
              {t(
                "Each acknowledged write raises your session minimum. One client, one operation at a time.",
              )}
            </small>
          </form>
          <div>
            <label htmlFor="session-follower">
              {t("2 / Choose a follower")}
            </label>
            <select
              id="session-follower"
              value={target}
              disabled={waiting}
              onChange={(e) => setTarget(e.target.value as Follower)}
            >
              <option value="A">{t("Follower A")}</option>
              <option value="B">{t("Follower B")}</option>
            </select>
            <div className="inline session-actions">
              <button
                disabled={waiting}
                onClick={() =>
                  dispatch({ type: "read", target, policy: "ordinary" })
                }
              >
                {t("Read immediately")}
              </button>
              <button
                disabled={waiting}
                onClick={() =>
                  dispatch({ type: "read", target, policy: "session" })
                }
              >
                {t("Read my writes")}
              </button>
            </div>
            <small>
              {t(
                "Immediate reads may be old. Session reads wait for at least your last acknowledged write.",
              )}
            </small>
          </div>
        </div>
        <div className="network">
          <div>
            <span className="control-label">
              {t("3 / Disrupt replication")}
            </span>
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
                  {t("Block follower") + " "}
                  {id}
                </label>
              ))}
            </div>
          </div>
          <div className="inline">
            <button onClick={() => dispatch({ type: "step" })}>
              {t("Advance one step")}
            </button>
            <button
              className="secondary"
              onClick={() => {
                dispatch({ type: "reset" });
                setValue(t("New name"));
                setTarget("B");
              }}
            >
              {t("Reset experiment")}
            </button>
          </div>
        </div>
      </fieldset>
      <p
        className={`read-result ${waiting || (state.read?.status === "returned" && state.read.result.stale) ? "stale" : ""}`}
        role="status"
        aria-live="polite"
      >
        {state.read?.status === "waiting"
          ? t(
              "Waiting on follower {0} for at least v{1}; it has v{2}. No value returned. Restore replication and advance time, or cancel this read.",
              state.read.target,
              state.read.minimumVersion,
              state.replication.followers[state.read.target].version,
            )
          : state.read?.status === "returned"
            ? t(
                "{0}: follower {1} returned “{2}” (v{3}). Required at least v{4}. {5} (leader v{6}). This result is historical.",
                state.read.policy === "session"
                  ? t("Session read")
                  : t("Immediate read"),
                state.read.target,
                state.read.result.value,
                state.read.result.version,
                state.read.minimumVersion,
                state.read.result.stale
                  ? t("Older than the leader")
                  : t("Current at completion"),
                state.read.result.leaderVersion,
              )
            : t("No read yet. Predict which policy can return an old name.")}
      </p>
      {waiting && (
        <button
          className="secondary"
          onClick={() => dispatch({ type: "cancel" })}
        >
          {t("Cancel waiting read")}
        </button>
      )}
      <p className="lab-hint">
        {state.replication.queue.length}
        {" " +
          t(
            "replication messages pending. Blocking a link retains its messages; restoring it delivers nothing until the next step. A waiting read stays on its chosen follower.",
          )}
      </p>
    </section>
  );
}
