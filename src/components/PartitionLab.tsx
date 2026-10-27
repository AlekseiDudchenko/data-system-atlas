import { useHydrated } from "./useHydrated";
import { useReducer } from "react";
import {
  CAPACITY,
  KEYS,
  PARTITIONS,
  initialPartitioning,
  owner,
  partitionTransition,
  type Workload,
} from "../simulation/partitioning";

export default function PartitionLab() {
  const hydrated = useHydrated();
  const [state, dispatch] = useReducer(partitionTransition, undefined, () =>
    initialPartitioning(),
  );
  const total = state.loads.reduce((sum, load) => sum + load.received, 0);
  const pending = state.loads.reduce((sum, load) => sum + load.queued, 0);
  const peak = Math.max(...state.loads.map((load) => load.received));
  const summary =
    state.step === 0
      ? "No requests yet. Predict the distribution, then send a batch."
      : `Step ${state.step}: ${total} requests received, ${total - pending} completed, ${pending} queued. Busiest partition received ${total ? Math.round((100 * peak) / total) : 0}% of requests so far.`;
  return (
    <section className="lab" aria-labelledby="partition-lab-title">
      <div className="lab-heading">
        <div>
          <span className="eyebrow">LIVE EXPERIMENT / 03</span>
          <h2 id="partition-lab-title">Same keys. Different pressure.</h2>
        </div>
        <span className="step">Step {state.step}</span>
      </div>
      <p className="lab-hint">
        12 keys → 3 partitions. Routing: key modulo 3. Each partition completes
        up to {CAPACITY} equal-cost requests per step.
      </p>
      <fieldset
        className="lab-controls"
        disabled={!hydrated}
        aria-label="Experiment controls"
      >
        <div className="controls-grid">
          <div>
            <label htmlFor="workload">1 / Choose a workload</label>
            <select
              id="workload"
              value={state.workload}
              onChange={(e) =>
                dispatch({
                  type: "workload",
                  workload: e.target.value as Workload,
                })
              }
            >
              <option value="even">Even keys — one request per key</option>
              <option value="hot">Hot key — nine requests to one key</option>
            </select>
            <small>
              Changing workload or hot key starts a fresh run. The routing stays
              fixed.
            </small>
          </div>
          <div>
            <label htmlFor="hot-key">2 / Choose the hot key</label>
            <select
              id="hot-key"
              value={state.hotKey}
              disabled={state.workload !== "hot"}
              onChange={(e) =>
                dispatch({ type: "hot-key", key: Number(e.target.value) })
              }
            >
              {KEYS.map((key) => (
                <option key={key} value={key}>
                  Key {key} → P{owner(key)}
                </option>
              ))}
            </select>
            <small>
              {state.workload === "hot"
                ? `Each batch: 9 × key ${state.hotKey}, plus keys ${(state.hotKey + 1) % 12}, ${(state.hotKey + 2) % 12}, ${(state.hotKey + 3) % 12} once each.`
                : "Each batch: keys 0 through 11, once each."}
            </small>
          </div>
        </div>
        <div className="inline partition-actions">
          <button onClick={() => dispatch({ type: "batch" })}>
            Send 12 requests + step
          </button>
          <button
            className="secondary"
            onClick={() => dispatch({ type: "drain" })}
          >
            Drain one step
          </button>
          <button
            className="secondary"
            onClick={() => dispatch({ type: "reset" })}
          >
            Reset run
          </button>
        </div>
      </fieldset>
      <p className="lab-hint">
        A batch arrives first, then every partition serves its own queue. Drain
        adds no requests. Reset clears counters and keeps your choices.
      </p>
      <svg
        className="partition-chart"
        viewBox="0 0 780 255"
        role="img"
        aria-label={state.loads
          .map(
            (load, id) =>
              `P${id}: ${load.received} received, ${load.completed} completed, ${load.queued} queued`,
          )
          .join(". ")}
      >
        <text x="10" y="22" fill="currentColor">
          Share of all requests received · fixed 0–100% scale
        </text>
        {PARTITIONS.map((id) => {
          const load = state.loads[id]!;
          const share = total ? load.received / total : 0;
          return (
            <g key={id}>
              <text x="10" y={64 + 70 * id} fill="currentColor">
                P{id}
              </text>
              <rect
                x="55"
                y={42 + 70 * id}
                width="520"
                height="30"
                rx="4"
                fill="#dce6dc"
              />
              <rect
                x="55"
                y={42 + 70 * id}
                width={520 * share}
                height="30"
                rx="4"
                fill={load.queued ? "#a25b13" : "#178176"}
              />
              <text x="590" y={63 + 70 * id} fill="currentColor">
                {Math.round(share * 100)}% · {load.queued} queued
              </text>
            </g>
          );
        })}
      </svg>
      <p
        className={`read-result ${pending ? "stale" : ""}`}
        role="status"
        aria-live="polite"
      >
        {summary}
      </p>
      <div className="partition-table-wrap">
        <table className="partition-table">
          <caption>Exact counters and fixed key ownership</caption>
          <thead>
            <tr>
              <th scope="col">Partition / keys</th>
              <th scope="col">Last step arrivals</th>
              <th scope="col">Received total</th>
              <th scope="col">Completed total</th>
              <th scope="col">Queued now</th>
            </tr>
          </thead>
          <tbody>
            {PARTITIONS.map((id) => (
              <tr key={id}>
                <th scope="row">
                  P{id}
                  <span className="partition-keys">
                    Keys {KEYS.filter((key) => owner(key) === id).join(", ")}
                  </span>
                </th>
                <td>{state.lastArrivals[id]}</td>
                <td>{state.loads[id]!.received}</td>
                <td>{state.loads[id]!.completed}</td>
                <td>{state.loads[id]!.queued}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="lab-hint">
        The keys stay evenly placed: four per partition. Traffic can still be
        skewed. Queued work stays on its owner; spare capacity elsewhere is not
        borrowed.
      </p>
    </section>
  );
}
