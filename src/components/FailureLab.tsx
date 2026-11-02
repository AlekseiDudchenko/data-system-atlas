import { useState } from "react";
import { fill } from "../content/transfers";
import { getTransferCopy } from "../content/localized";
import { useLocale } from "../i18n/react";
import type { Locale } from "../i18n";
import { formatDuration, formatNumber } from "../i18n/format";
import {
  batchState,
  failureAt,
  reliabilityAt,
  reliabilityCosts,
  simulateReliability,
  type BatchState,
  type CheckpointMode,
  type ReliabilityPlan,
  type ReliabilityState,
  type Step,
} from "../simulation/reliability";
import CompareTable from "./CompareTable";
import { useRun } from "./useRun";

export type FailureScene = 4 | 5 | 6;

const all = { drop: true, lostAck: true, crash: true };
const defaults: Record<FailureScene, ReliabilityPlan> = {
  4: {
    retry: false,
    writeMode: "insert",
    checkpoint: "none",
    failures: { drop: true, lostAck: true, crash: false },
  },
  5: { retry: true, writeMode: "insert", checkpoint: "none", failures: all },
  6: {
    retry: true,
    writeMode: "upsert",
    checkpoint: "after-write",
    failures: all,
  },
};

/** Each scene compares with the other choice for the decision it changes. */
function alternative(
  scene: FailureScene,
  plan: ReliabilityPlan,
): ReliabilityPlan {
  if (scene === 4) return { ...plan, retry: !plan.retry };
  if (scene === 5)
    return {
      ...plan,
      writeMode: plan.writeMode === "insert" ? "upsert" : "insert",
    };
  return {
    ...plan,
    checkpoint: plan.checkpoint === "none" ? "after-write" : "none",
  };
}

function describe(scene: FailureScene, plan: ReliabilityPlan, locale: Locale) {
  const f = getTransferCopy(locale).failure;
  const checkpointNames: Record<CheckpointMode, string> = {
    none: f.noCheckpoint,
    "after-write": `Checkpoint ${f.checkpointAfter}`,
    "before-write": `Checkpoint ${f.checkpointBefore}`,
  };

  if (scene === 4) return plan.retry ? f.withRetry : f.noRetry;
  if (scene === 5) return plan.writeMode === "upsert" ? "UPSERT" : "INSERT";
  return checkpointNames[plan.checkpoint];
}

export default function FailureLab({
  scene,
  hydrated,
}: {
  scene: FailureScene;
  hydrated: boolean;
}) {
  const locale = useLocale();
  const c = getTransferCopy(locale);
  const f = c.failure;
  const [plan, setPlan] = useState<ReliabilityPlan>(defaults[scene]);
  const { share, ran, running, run, reset } = useRun(4_000);
  const result = simulateReliability(plan);
  const state = reliabilityAt(
    result,
    share === null ? 0 : result.durationMs * share,
  );
  const change = (update: Partial<ReliabilityPlan>) => {
    reset();
    setPlan((current) => ({ ...current, ...update }));
  };
  const lastBatch = result.steps.at(-1)?.batch ?? 0;
  const repeatLabel = plan.writeMode === "insert" ? f.duplicates : f.rewritten;
  const details = [
    [repeatLabel, state.repeatedRecords],
    [f.missing, state.missingRecords],
  ]
    .filter(([, n]) => Number(n) > 0)
    .map(([label, n]) =>
      fill(f.detail, label!, formatNumber(locale, Number(n))),
    )
    .join(" ");
  const status =
    state.status === "done"
      ? `${fill(
          f.done,
          formatDuration(locale, result.durationMs),
          formatNumber(locale, state.uniqueRecords),
        )} ${details}`.trim()
      : state.status === "aborted"
        ? `${fill(
            f.aborted,
            lastBatch + 1,
            formatDuration(locale, result.durationMs),
            formatNumber(locale, state.uniqueRecords),
          )} ${details}`.trim()
        : state.status === "restarting"
          ? f.restarting
          : state.status === "waiting"
            ? f.waiting
            : state.status === "running"
              ? f.running
              : f.idle;

  const compare = alternative(scene, plan);
  const compared = [compare, plan].map((p) => {
    const r = simulateReliability(p);
    return { plan: p, run: r, state: reliabilityAt(r, r.durationMs) };
  });

  return (
    <>
      <p className="lab-mode">{describe(scene, plan, locale)}</p>
      <FailureDiagram state={state} plan={plan} />
      <div className="story-counters">
        <span>
          {c.elapsed}
          <strong>{formatDuration(locale, state.elapsedMs)}</strong>
        </span>
        <span>
          {f.unique}
          <strong>{formatNumber(locale, state.uniqueRecords)}</strong>
        </span>
        <span>
          {repeatLabel}
          <strong>{formatNumber(locale, state.repeatedRecords)}</strong>
        </span>
        <span>
          {f.missing}
          <strong>{formatNumber(locale, state.missingRecords)}</strong>
        </span>
      </div>
      <fieldset
        className="story-controls"
        disabled={!hydrated}
        aria-label={c.controls}
      >
        <label className="story-check">
          <input
            type="checkbox"
            checked={plan.retry}
            onChange={(event) => change({ retry: event.target.checked })}
          />
          {f.retry}
        </label>
        {scene >= 5 && (
          <div className="story-field">
            <label htmlFor="transfer-write-mode">{f.writeMode}</label>
            <select
              id="transfer-write-mode"
              value={plan.writeMode}
              onChange={(event) =>
                change({
                  writeMode: event.target.value as ReliabilityPlan["writeMode"],
                })
              }
            >
              <option value="insert">{f.insert}</option>
              <option value="upsert">{f.upsert}</option>
            </select>
          </div>
        )}
        {scene === 6 && (
          <div className="story-field">
            <label htmlFor="transfer-checkpoint">{f.checkpoint}</label>
            <select
              id="transfer-checkpoint"
              value={plan.checkpoint}
              onChange={(event) =>
                change({ checkpoint: event.target.value as CheckpointMode })
              }
            >
              <option value="none">{f.checkpointNone}</option>
              <option value="after-write">{f.checkpointAfter}</option>
              <option value="before-write">{f.checkpointBefore}</option>
            </select>
          </div>
        )}
        <button type="button" onClick={run} disabled={running}>
          {ran ? c.runAgain : c.run}
        </button>
      </fieldset>
      <fieldset
        className="story-failures"
        disabled={!hydrated}
        aria-label={f.failures}
      >
        <legend>{f.failures}</legend>
        {(["drop", "lostAck", "crash"] as const).map((kind) => (
          <label className="story-check" key={kind}>
            <input
              type="checkbox"
              checked={plan.failures[kind]}
              onChange={(event) =>
                change({
                  failures: { ...plan.failures, [kind]: event.target.checked },
                })
              }
            />
            {f[kind]}
          </label>
        ))}
      </fieldset>
      <p className="story-status" role="status">
        {status}
      </p>
      <EventLog events={state.events} />
      {ran && (
        <CompareTable
          columns={compared.map((item, i) => ({
            title: i === 0 ? f.alternative : c.after,
            subtitle: describe(scene, item.plan, locale),
          }))}
          rows={[
            {
              label: f.outcome,
              values: compared.map((item) =>
                item.state.status === "done" ? f.outcomeDone : f.outcomeAborted,
              ),
            },
            {
              label: c.duration,
              values: compared.map((item) =>
                formatDuration(locale, item.run.durationMs),
              ),
            },
            {
              label: f.unique,
              values: compared.map((item) =>
                formatNumber(locale, item.state.uniqueRecords),
              ),
            },
            {
              label: f.duplicates,
              values: compared.map((item) =>
                formatNumber(
                  locale,
                  item.plan.writeMode === "insert"
                    ? item.state.repeatedRecords
                    : 0,
                ),
              ),
            },
            {
              label: f.rewritten,
              values: compared.map((item) =>
                formatNumber(
                  locale,
                  item.plan.writeMode === "upsert"
                    ? item.state.repeatedRecords
                    : 0,
                ),
              ),
            },
            {
              label: f.missing,
              values: compared.map((item) =>
                formatNumber(locale, item.state.missingRecords),
              ),
            },
            {
              label: f.retries,
              values: compared.map((item) => String(item.state.retries)),
            },
            {
              label: f.restarts,
              values: compared.map((item) => String(item.state.restarts)),
            },
          ]}
        />
      )}
      <p className="workspace-hint">{c.estimateNote}</p>
      <button
        type="button"
        className="story-reset"
        disabled={!hydrated}
        onClick={() => {
          reset();
          setPlan(defaults[scene]);
        }}
      >
        {c.reset} <span aria-hidden="true">↺</span>
      </button>
    </>
  );
}

/** Merges neighbouring batches with the same state into one bar segment. */
function segments(state: ReliabilityState) {
  const result: { from: number; to: number; kind: BatchState }[] = [];
  for (let i = 0; i < reliabilityCosts.batches; i++) {
    const kind = batchState(state, i);
    const last = result.at(-1);
    if (last && last.kind === kind) last.to = i + 1;
    else result.push({ from: i, to: i + 1, kind });
  }
  return result;
}

function FailureDiagram({
  state,
  plan,
}: {
  state: ReliabilityState;
  plan: ReliabilityPlan;
}) {
  const locale = useLocale();
  const f = getTransferCopy(locale).failure;
  const scriptState: Record<ReliabilityState["status"], string> = {
    idle: f.stateIdle,
    running: f.stateRunning,
    waiting: f.stateWaiting,
    restarting: f.stateRestarting,
    done: f.stateDone,
    aborted: f.stateAborted,
  };

  const repeatName =
    plan.writeMode === "insert" ? f.legendDuplicate : f.legendRewritten;
  const marks = (["drop", "lostAck", "crash"] as const).filter(
    (kind) => plan.failures[kind],
  );
  return (
    <div className="failure-figure">
      <div className="failure-chips">
        <span>{fill(f.script, scriptState[state.status])}</span>
        <span>
          {state.checkpoint === null
            ? f.checkpointEmpty
            : fill(f.checkpointAt, formatNumber(locale, state.checkpoint))}
        </span>
        <span>
          {f.retries}: {state.retries} · {f.restarts}: {state.restarts}
        </span>
      </div>
      <p className="failure-title">{f.timeline}</p>
      <svg
        className="failure-timeline"
        viewBox="0 0 1000 44"
        preserveAspectRatio="none"
        role="img"
        aria-label={fill(
          f.diagramLabel,
          formatNumber(locale, state.uniqueRecords),
          formatNumber(locale, state.repeatedRecords),
          formatNumber(locale, state.missingRecords),
          fill(f.script, scriptState[state.status]),
        )}
      >
        {segments(state).map((segment) => {
          // Single batches stay visible at phone width.
          const width = Math.max(segment.to - segment.from, 8);
          const x =
            segment.to - segment.from < 8
              ? (segment.from + segment.to) / 2 - 4
              : segment.from;
          return (
            <rect
              key={segment.from}
              x={x}
              y="14"
              width={width}
              height="22"
              className={`batch-${segment.kind}`}
            />
          );
        })}
        {marks.map((kind) => (
          <path
            key={kind}
            d={`M${failureAt[kind] + 0.5} 0 l-6 9 h12 z`}
            className="failure-mark"
          />
        ))}
        {state.status !== "idle" && state.status !== "done" && (
          <rect
            x={Math.min(state.position, 999) - 1}
            y="10"
            width="3"
            height="30"
            className="failure-cursor"
          />
        )}
      </svg>
      <ul className="failure-legend">
        <li>
          <span className="swatch batch-written" /> {f.legendWritten}
        </li>
        <li>
          <span className="swatch batch-repeated" /> {repeatName}
        </li>
        <li>
          <span className="swatch batch-missing" /> {f.legendMissing}
        </li>
        <li>
          <span className="swatch batch-empty" /> {f.legendEmpty}
        </li>
        <li>
          <span className="swatch-mark" aria-hidden="true">
            ▼
          </span>{" "}
          {f.failures}
        </li>
      </ul>
    </div>
  );
}

function eventText(step: Step, locale: Locale) {
  const f = getTransferCopy(locale).failure;
  const batch = step.batch + 1;
  switch (step.kind) {
    case "drop":
      return fill(f.eventDrop, batch);
    case "lost-ack":
      return fill(f.eventLostAck, batch);
    case "retry":
      return fill(f.eventRetry, formatDuration(locale, step.value ?? 0));
    case "crash":
      return fill(f.eventCrash, batch);
    case "restart":
      return fill(f.eventRestart, (step.value ?? 0) + 1);
    case "abort":
      return f.eventAbort;
    default:
      return f.eventDone;
  }
}

function EventLog({ events }: { events: readonly Step[] }) {
  const locale = useLocale();
  const f = getTransferCopy(locale).failure;
  return (
    <div className="failure-log">
      <h3>{f.log}</h3>
      {events.length === 0 ? (
        <p>{f.logEmpty}</p>
      ) : (
        <ol>
          {events.slice(-6).map((step, i) => (
            <li key={`${step.t}-${i}`}>
              <span>{formatDuration(locale, step.t)}</span>{" "}
              {eventText(step, locale)}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
