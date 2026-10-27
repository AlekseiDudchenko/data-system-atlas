import { formatLog } from "../i18n/log";
import { translator, type Locale } from "../i18n";
import { useHydrated } from "./useHydrated";
import ReplicationTopology from "./ReplicationTopology";
import { useReducer, useState } from "react";
import {
  FOLLOWERS,
  initialState,
  transition,
  type Follower,
} from "../simulation/replication";
export default function ReplicationLab({ locale = "en" }: { locale?: Locale }) {
  const t = translator(locale);
  const hydrated = useHydrated();
  const [state, dispatch] = useReducer(transition, undefined, initialState);
  const [value, setValue] = useState("Goodbye");
  const [target, setTarget] = useState<Follower>("A");
  return (
    <section className="lab" aria-labelledby="lab-title">
      <div className="lab-heading">
        <div>
          <span className="eyebrow">{t("LIVE EXPERIMENT / 01")}</span>
          <h2 id="lab-title">{t("One write. Three perspectives.")}</h2>
        </div>
        <span className="step">
          {t("Step") + " "}
          {state.step}
        </span>
      </div>
      <p className="lab-hint">
        {t(
          "Write → read a follower → advance twice → read again. A write queues two messages; only advancing time delivers them.",
        )}
      </p>
      <ReplicationTopology locale={locale} state={state} />
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
            <label htmlFor="value">{t("1 / Write to the leader")}</label>
            <div className="inline">
              <input
                id="value"
                value={value}
                maxLength={80}
                required
                onChange={(e) => setValue(e.target.value)}
              />
              <button disabled={!value.trim()} type="submit">
                {t("Write value")}
              </button>
            </div>
            <small>
              {t("Accepted immediately. Replication takes two steps.")}
            </small>
          </form>
          <div>
            <label htmlFor="follower">{t("2 / Read a replica")}</label>
            <div className="inline">
              <select
                id="follower"
                value={target}
                onChange={(e) => setTarget(e.target.value as Follower)}
              >
                <option value="A">{t("Follower A")}</option>
                <option value="B">{t("Follower B")}</option>
              </select>
              <button onClick={() => dispatch({ type: "read", target })}>
                {t("Read follower")}
              </button>
            </div>
            <small>
              {t("A read does not advance time or deliver updates.")}
            </small>
          </div>
        </div>
        <div className="network">
          <div>
            <span className="control-label">
              {t("3 / Disrupt the network")}
            </span>
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
                setValue("Goodbye");
                setTarget("A");
              }}
            >
              {t("Reset experiment")}
            </button>
          </div>
        </div>
      </fieldset>
      <p
        className={`read-result ${state.lastRead?.stale ? "stale" : ""}`}
        role="status"
        aria-live="polite"
      >
        {state.lastRead
          ? t(
              "Last read: Follower {0} returned “{1}” (v{2}). {3} — leader was v{4} at read time.",
              state.lastRead.target,
              state.lastRead.value,
              state.lastRead.version,
              state.lastRead.stale ? t("Stale read") : t("Current read"),
              state.lastRead.leaderVersion,
            )
          : t("No read yet. Predict the result, then read a follower.")}
      </p>
      <div className="observations">
        <section aria-labelledby="queue-title">
          <h3 id="queue-title">
            {t("In transit") + " "}
            <span className="badge">{state.queue.length}</span>
          </h3>
          <p className="muted">
            {t("FIFO per follower · delivery after two steps")}
          </p>
          {state.queue.length ? (
            <ul className="messages" tabIndex={0} aria-labelledby="queue-title">
              {state.queue.map((m) => (
                <li key={`${m.target}-${m.version}`}>
                  <strong>
                    {t("Leader →") + " "}
                    {m.target}
                  </strong>
                  <span>
                    “{m.value}
                    {t("” · v")}
                    {m.version}
                  </span>
                  <small>
                    {state.blocked[m.target]
                      ? t("Blocked · retained")
                      : m.due <= state.step
                        ? t("Ready next step")
                        : t("Due at step {0}", m.due)}
                  </small>
                </li>
              ))}
            </ul>
          ) : (
            <p>{t("No pending messages.")}</p>
          )}
        </section>
        <section aria-labelledby="log-title">
          <h3 id="log-title">{t("Event log")}</h3>
          <p className="muted">{t("Most recent first · last 100 events")}</p>
          <ol
            className="event-log"
            reversed
            tabIndex={0}
            aria-labelledby="log-title"
          >
            {[...state.log].reverse().map((entry, i) => (
              <li key={`${state.log.length - i}-${entry.step}`}>
                {formatLog(entry, locale)}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </section>
  );
}
