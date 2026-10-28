import { useState } from "react";
import { fill, transferCopy as c } from "../content/transfers";
import { formatDuration, formatNumber, plural } from "../i18n/format";
import {
  parallelAt,
  parallelCosts,
  simulateParallel,
  workerOptions,
  type ParallelPlan,
  type ParallelRun,
} from "../simulation/parallel";
import CompareTable from "./CompareTable";
import { useRun } from "./useRun";

const p = c.parallel;
const defaults: ParallelPlan = { workers: 4, skewed: false };
const batches = (n: number) =>
  `${formatNumber("ru", n)} ${plural(n, c.words.batch)}`;

function describe(plan: ParallelPlan) {
  return `${fill(p.workersLabel, plan.workers)} · ${plan.skewed ? p.skewedShort : p.even}`;
}

export default function ParallelLab({ hydrated }: { hydrated: boolean }) {
  const [plan, setPlan] = useState<ParallelPlan>(defaults);
  const { share, ran, running, run, reset } = useRun(3_000);
  const result = simulateParallel(plan);
  const single = simulateParallel({ workers: 1, skewed: plan.skewed });
  const state = parallelAt(
    result,
    share === null ? 0 : result.durationMs * share,
  );
  const change = (update: Partial<ParallelPlan>) => {
    reset();
    setPlan((current) => ({ ...current, ...update }));
  };
  const speedup = (r: ParallelRun) =>
    formatNumber("ru", single.durationMs / r.durationMs, 1);
  const finished = state.done.reduce((a, b) => a + b, 0);
  const largest = Math.max(...result.workers.map((w) => w.batches));
  const status = state.finished
    ? fill(p.done, formatDuration("ru", result.durationMs), speedup(result))
    : share !== null
      ? p.running
      : p.idle;

  return (
    <>
      <p className="lab-mode">{describe(plan)}</p>
      <div className="parallel-figure">
        <p className="failure-title">
          {fill(p.pool, parallelCosts.poolSize, parallelCosts.fullSpeedWriters)}
        </p>
        <ol className="parallel-lanes">
          {result.workers.map((worker, i) => {
            const done = state.done[i] ?? 0;
            return (
              <li key={i}>
                <span className="lane-name">{fill(p.lane, i + 1)}</span>
                <span
                  className="lane-track"
                  style={{ width: `${(worker.batches / largest) * 100}%` }}
                >
                  <span
                    className="lane-fill"
                    style={{
                      width: `${worker.batches ? (done / worker.batches) * 100 : 100}%`,
                    }}
                  />
                </span>
                <span className="lane-count">
                  {state.waiting[i]
                    ? p.waiting
                    : `${formatNumber("ru", done)} / ${formatNumber("ru", worker.batches)}`}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
      <div className="story-counters">
        <span>
          {c.elapsed}
          <strong>{formatDuration("ru", state.elapsedMs)}</strong>
        </span>
        <span>
          {c.written}
          <strong>
            {formatNumber("ru", finished * parallelCosts.batchSize)}
            <span>
              {" "}
              /{" "}
              {formatNumber(
                "ru",
                parallelCosts.batches * parallelCosts.batchSize,
              )}
            </span>
          </strong>
        </span>
      </div>
      <fieldset
        className="story-controls"
        disabled={!hydrated}
        aria-label={c.controls}
      >
        <div className="story-field">
          <label htmlFor="transfer-workers">{p.workers}</label>
          <select
            id="transfer-workers"
            value={plan.workers}
            onChange={(event) =>
              change({ workers: Number(event.target.value) })
            }
          >
            {workerOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <label className="story-check">
          <input
            type="checkbox"
            checked={plan.skewed}
            onChange={(event) => change({ skewed: event.target.checked })}
          />
          {p.skewed}
        </label>
        <button type="button" onClick={run} disabled={running}>
          {ran ? c.runAgain : c.run}
        </button>
      </fieldset>
      <p className="story-status" role="status">
        {status}
      </p>
      {ran && (
        <CompareTable
          columns={[
            { title: c.before, subtitle: describe(single.plan) },
            { title: c.after, subtitle: describe(plan) },
          ]}
          rows={[single, result].reduce(
            (rows, r) => {
              const sizes = r.workers.map((w) => w.batches);
              const values = [
                formatDuration("ru", r.durationMs),
                `×${speedup(r)}`,
                String(r.peakConnections),
                batches(Math.max(...sizes)),
                batches(Math.min(...sizes)),
              ];
              values.forEach((value, i) => rows[i]!.values.push(value));
              return rows;
            },
            [p.duration, p.speedup, p.connections, p.longest, p.shortest].map(
              (label) => ({ label, values: [] as string[] }),
            ),
          )}
        />
      )}
      <p className="workspace-hint">{c.estimateNote}</p>
      <button
        type="button"
        className="story-reset"
        disabled={!hydrated}
        onClick={() => {
          reset();
          setPlan(defaults);
        }}
      >
        {c.reset} <span aria-hidden="true">↺</span>
      </button>
    </>
  );
}
