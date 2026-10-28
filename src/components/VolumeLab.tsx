import { useState } from "react";
import { fill, transferCopy as c } from "../content/transfers";
import {
  formatBytes,
  formatDuration,
  formatNumber,
  plural,
} from "../i18n/format";
import {
  batchOptions,
  estimateTransfer,
  progressAt,
  recordOptions,
  type TransferEstimate,
  type TransferPlan,
} from "../simulation/transfer";
import CompareTable from "./CompareTable";
import TransferDiagram from "./TransferDiagram";
import { useRun } from "./useRun";

export type VolumeScene = 0 | 1 | 2 | 3;
type Choice = { records: number; batchSize: number };

const defaults: Record<VolumeScene, Choice> = {
  0: { records: 1_000, batchSize: 1 },
  1: { records: 1_000_000, batchSize: 1 },
  2: { records: 1_000_000, batchSize: 1 },
  3: { records: 1_000_000, batchSize: 1_000 },
};

/** The plan a scene runs, and the plan it is compared with. */
function plans(scene: VolumeScene, choice: Choice) {
  const now: TransferPlan = {
    records: choice.records,
    reading: scene < 2 ? "eager" : "lazy",
    batchSize: scene === 3 ? choice.batchSize : 1,
  };
  const before: TransferPlan | null =
    scene === 0
      ? null
      : scene === 1
        ? { records: 1_000, reading: "eager", batchSize: 1 }
        : scene === 2
          ? { records: choice.records, reading: "eager", batchSize: 1 }
          : { records: choice.records, reading: "lazy", batchSize: 1 };
  return { now, before };
}

function strategy(plan: TransferPlan, scene: VolumeScene, isBefore: boolean) {
  if (isBefore && scene === 1)
    return fill(c.smallerTable, formatNumber("ru", plan.records));
  if (plan.reading === "eager") return c.eagerSingle;
  return plan.batchSize > 1
    ? fill(c.lazyBatch, formatNumber("ru", plan.batchSize))
    : c.lazySingle;
}

const records = (n: number) =>
  `${formatNumber("ru", n)} ${plural(n, c.words.record)}`;

export default function VolumeLab({
  scene,
  hydrated,
}: {
  scene: VolumeScene;
  hydrated: boolean;
}) {
  const [choice, setChoice] = useState<Choice>(defaults[scene]);
  const { share, ran, running, run, reset } = useRun();
  const { now, before } = plans(scene, choice);
  const estimate = estimateTransfer(now);
  const previous = before && estimateTransfer(before);
  const progress = progressAt(
    estimate,
    share === null ? 0 : estimate.durationMs * share,
  );
  const change = (update: Partial<Choice>) => {
    reset();
    setChoice((current) => ({ ...current, ...update }));
  };

  const status =
    progress.phase === "failed"
      ? fill(
          c.failed,
          formatDuration("ru", estimate.durationMs),
          formatBytes("ru", estimate.memoryNeededBytes),
          formatBytes("ru", estimate.costs.memoryLimitBytes),
        )
      : progress.phase === "done"
        ? fill(
            c.done,
            records(now.records),
            formatDuration("ru", estimate.durationMs),
          )
        : progress.phase === "reading"
          ? c.reading
          : progress.phase === "writing"
            ? c.writing
            : c.idle;

  const columns = previous ? [previous, estimate] : [estimate];
  const value = (pick: (e: TransferEstimate) => string) => columns.map(pick);

  return (
    <>
      <p className="lab-mode">{strategy(now, scene, false)}</p>
      <TransferDiagram
        estimate={estimate}
        progress={progress}
        running={running}
      />
      <div className="story-counters">
        <span>
          {c.elapsed}
          <strong>{formatDuration("ru", progress.elapsedMs)}</strong>
        </span>
        <span>
          {c.written}
          <strong>
            {formatNumber("ru", progress.recordsWritten)}
            <span> / {formatNumber("ru", now.records)}</span>
          </strong>
        </span>
      </div>
      <fieldset
        className="story-controls"
        disabled={!hydrated}
        aria-label={c.controls}
      >
        <div className="story-field">
          <label htmlFor="transfer-records">{c.records}</label>
          <select
            id="transfer-records"
            value={choice.records}
            onChange={(event) =>
              change({ records: Number(event.target.value) })
            }
          >
            {recordOptions.map((option) => (
              <option key={option} value={option}>
                {formatNumber("ru", option)}
              </option>
            ))}
          </select>
        </div>
        {scene === 3 && (
          <div className="story-field">
            <label htmlFor="transfer-batch">{c.batchSize}</label>
            <select
              id="transfer-batch"
              value={choice.batchSize}
              onChange={(event) =>
                change({ batchSize: Number(event.target.value) })
              }
            >
              {batchOptions.map((option) => (
                <option key={option} value={option}>
                  {option === 1 ? c.perRecord : formatNumber("ru", option)}
                </option>
              ))}
            </select>
          </div>
        )}
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
            ...(previous
              ? [
                  {
                    title: c.before,
                    subtitle: strategy(previous.plan, scene, true),
                  },
                ]
              : []),
            { title: c.after, subtitle: strategy(now, scene, false) },
          ]}
          rows={[
            {
              label: c.duration,
              values: value((e) =>
                e.outcome === "completed"
                  ? formatDuration("ru", e.durationMs)
                  : `${c.outOfMemory} · ${formatDuration("ru", e.durationMs)}`,
              ),
            },
            {
              label: c.throughput,
              values: value((e) =>
                e.outcome === "completed"
                  ? fill(c.perSecond, formatNumber("ru", e.recordsPerSecond))
                  : c.notReached,
              ),
            },
            {
              label: c.roundTrips,
              values: value((e) =>
                formatNumber("ru", e.readRoundTrips + e.writeRoundTrips),
              ),
            },
            {
              label: c.peakMemory,
              values: value((e) => formatBytes("ru", e.memoryNeededBytes)),
            },
            {
              label: c.cursorOpen,
              values: value((e) => formatDuration("ru", e.cursorOpenMs)),
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
          setChoice(defaults[scene]);
        }}
      >
        {c.reset} <span aria-hidden="true">↺</span>
      </button>
    </>
  );
}
