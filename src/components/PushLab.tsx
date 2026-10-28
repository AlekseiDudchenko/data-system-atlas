import { useState } from "react";
import { pushCopy as c } from "../content/push";
import { fill } from "../content/transfers";
import { formatDuration, formatNumber, plural } from "../i18n/format";
import {
  owner,
  pushAt,
  pushTiming,
  simulatePush,
  type PushPlan,
  type PushRun,
  type PushTick,
} from "../simulation/push";
import CompareTable from "./CompareTable";
import { useRun } from "./useRun";

export type PushScene = 0 | 1 | 2 | 3 | 4;

type Knobs = {
  outageS: number;
  consumerRate: number;
  deadLetter: boolean;
  commitEveryS: number;
  idempotent: boolean;
  rate: number;
  consumers: number;
  skewed: boolean;
};

const defaults: Knobs = {
  outageS: 15,
  consumerRate: 1_500,
  deadLetter: false,
  commitEveryS: 2,
  idempotent: false,
  rate: 6_000,
  consumers: 4,
  skewed: false,
};

const quiet: PushPlan = {
  mode: "queue",
  rate: 1_000,
  consumers: 1,
  consumerRate: 1_500,
  partitions: 4,
  outageS: 0,
  capacity: 100_000,
  poison: false,
  deadLetter: false,
  crash: false,
  commitEveryS: 2,
  idempotent: false,
  skewed: false,
};

function planFor(scene: PushScene, k: Knobs): PushPlan {
  switch (scene) {
    case 0:
      return {
        ...quiet,
        mode: "direct",
        partitions: 1,
        capacity: 1_000,
        outageS: k.outageS,
      };
    case 1:
      return {
        ...quiet,
        capacity: 20_000,
        outageS: k.outageS,
        consumerRate: k.consumerRate,
      };
    case 2:
      return { ...quiet, consumers: 2, poison: true, deadLetter: k.deadLetter };
    case 3:
      return {
        ...quiet,
        crash: true,
        commitEveryS: k.commitEveryS,
        idempotent: k.idempotent,
      };
    case 4:
      return {
        ...quiet,
        partitions: 8,
        consumerRate: 1_000,
        rate: k.rate,
        consumers: k.consumers,
        skewed: k.skewed,
      };
  }
}

/** The plan each scene is compared with: the other side of its decision. */
function alternative(scene: PushScene, plan: PushPlan): PushPlan | null {
  switch (scene) {
    case 0:
      return null;
    case 1:
      return {
        ...plan,
        mode: "direct",
        partitions: 1,
        consumers: 1,
        capacity: 1_000,
      };
    case 2:
      return { ...plan, deadLetter: !plan.deadLetter };
    case 3:
      return { ...plan, idempotent: !plan.idempotent };
    case 4:
      return { ...plan, consumers: plan.consumers === 1 ? 4 : 1 };
  }
}

function describe(scene: PushScene, plan: PushPlan) {
  switch (scene) {
    case 0:
    case 1:
      return plan.mode === "direct" ? c.modeDirect : c.modeQueue;
    case 2:
      return plan.deadLetter ? c.withDlq : c.withoutDlq;
    case 3:
      return plan.idempotent ? c.withIdempotent : c.withoutIdempotent;
    case 4:
      return plan.consumers === 1
        ? c.oneConsumer
        : fill(c.consumersOf, plan.consumers);
  }
}

const events = (n: number) =>
  `${formatNumber("ru", n)} ${plural(n, c.words.event)}`;
const seconds = (s: number) => formatDuration("ru", s * 1_000);

export default function PushLab({
  scene,
  hydrated,
}: {
  scene: PushScene;
  hydrated: boolean;
}) {
  const [knobs, setKnobs] = useState<Knobs>(defaults);
  const { share, ran, running, run, reset } = useRun(4_000);
  const plan = planFor(scene, knobs);
  const result = simulatePush(plan);
  const started = share !== null;
  const { index, tick, elapsedS } = pushAt(
    result,
    started ? pushTiming.durationS * share : 0,
  );
  const shown: PushTick | null = started ? tick : null;
  const change = (update: Partial<Knobs>) => {
    reset();
    setKnobs((current) => ({ ...current, ...update }));
  };
  const finished = started && share >= 1;
  const end = result.ticks.at(-1)!;
  const details = [
    [c.lost, end.lost],
    [c.duplicates, end.duplicates],
    [c.dlq, end.deadLettered],
  ]
    .filter(([, n]) => Number(n) > 0)
    .map(([label, n]) => fill(c.detail, label!, formatNumber("ru", Number(n))));
  const recovery =
    result.recoveryS !== null
      ? fill(c.recovered, seconds(result.recoveryS))
      : plan.outageS > 0 || plan.poison || plan.crash
        ? c.notRecovered
        : "";
  const status = finished
    ? [
        fill(c.done, events(end.written), formatNumber("ru", end.lag)),
        ...details,
        recovery,
      ]
        .filter(Boolean)
        .join(" ")
    : started
      ? c.running
      : c.idle;

  const other = alternative(scene, plan);
  const compared = (other ? [other, plan] : [plan]).map((p) => simulatePush(p));

  return (
    <>
      <p className="lab-mode">{describe(scene, plan)}</p>
      <PushFlow plan={plan} tick={shown} />
      <LagChart run={result} upTo={started ? index : -1} />
      <div className="story-counters">
        <span>
          {c.elapsed}
          <strong>{seconds(elapsedS)}</strong>
        </span>
        <span>
          {c.lag}
          <strong>{formatNumber("ru", shown?.lag ?? 0)}</strong>
        </span>
        <span>
          {c.written}
          <strong>{formatNumber("ru", shown?.written ?? 0)}</strong>
        </span>
        <span>
          {c.lost}
          <strong>{formatNumber("ru", shown?.lost ?? 0)}</strong>
        </span>
        {scene === 2 && (
          <span>
            {c.dlq}
            <strong>{shown?.deadLettered ?? 0}</strong>
          </span>
        )}
        {scene === 3 && (
          <span>
            {c.duplicates}
            <strong>{formatNumber("ru", shown?.duplicates ?? 0)}</strong>
          </span>
        )}
      </div>
      <fieldset
        className="story-controls"
        disabled={!hydrated}
        aria-label={c.controls}
      >
        {scene <= 1 && (
          <Select
            id="push-outage"
            label={c.outage}
            value={knobs.outageS}
            options={[0, 5, 15, 30]}
            format={(v) => (v === 0 ? c.outageNone : fill(c.seconds, v))}
            onChange={(outageS) => change({ outageS })}
          />
        )}
        {scene === 1 && (
          <Select
            id="push-consumer-rate"
            label={c.consumerRate}
            value={knobs.consumerRate}
            options={[1_200, 1_500, 3_000]}
            format={(v) => fill(c.perSecond, formatNumber("ru", v))}
            onChange={(consumerRate) => change({ consumerRate })}
          />
        )}
        {scene === 2 && (
          <Check
            label={c.deadLetter}
            checked={knobs.deadLetter}
            onChange={(deadLetter) => change({ deadLetter })}
          />
        )}
        {scene === 3 && (
          <>
            <Select
              id="push-commit"
              label={c.commitEvery}
              value={knobs.commitEveryS}
              options={[0.5, 2, 5]}
              format={(v) => fill(c.seconds, formatNumber("ru", v, 1))}
              onChange={(commitEveryS) => change({ commitEveryS })}
            />
            <Check
              label={c.idempotent}
              checked={knobs.idempotent}
              onChange={(idempotent) => change({ idempotent })}
            />
          </>
        )}
        {scene === 4 && (
          <>
            <Select
              id="push-rate"
              label={c.rate}
              value={knobs.rate}
              options={[2_000, 4_000, 6_000]}
              format={(v) => fill(c.perSecond, formatNumber("ru", v))}
              onChange={(rate) => change({ rate })}
            />
            <Select
              id="push-consumers"
              label={c.consumerCount}
              value={knobs.consumers}
              options={[1, 2, 4, 8, 12]}
              format={String}
              onChange={(consumers) => change({ consumers })}
            />
            <Check
              label={c.skewed}
              checked={knobs.skewed}
              onChange={(skewed) => change({ skewed })}
            />
          </>
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
          columns={compared.map((r, i) => ({
            title: other && i === 0 ? c.alternative : c.now,
            subtitle: describe(scene, r.plan),
          }))}
          rows={[
            {
              label: c.maxLag,
              values: compared.map((r) => formatNumber("ru", r.maxLag)),
            },
            {
              label: c.recovery,
              values: compared.map((r) =>
                r.recoveryS !== null
                  ? seconds(r.recoveryS)
                  : r.plan.outageS > 0 || r.plan.poison || r.plan.crash
                    ? c.never
                    : c.notApplicable,
              ),
            },
            {
              label: c.lagEnd,
              values: compared.map((r) =>
                formatNumber("ru", r.ticks.at(-1)!.lag),
              ),
            },
            {
              label: c.written,
              values: compared.map((r) =>
                formatNumber("ru", r.ticks.at(-1)!.written),
              ),
            },
            {
              label: c.lost,
              values: compared.map((r) =>
                formatNumber("ru", r.ticks.at(-1)!.lost),
              ),
            },
            {
              label: c.duplicates,
              values: compared.map((r) =>
                formatNumber("ru", r.ticks.at(-1)!.duplicates),
              ),
            },
            {
              label: c.dlq,
              values: compared.map((r) => String(r.ticks.at(-1)!.deadLettered)),
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
          setKnobs(defaults);
        }}
      >
        {c.reset} <span aria-hidden="true">↺</span>
      </button>
    </>
  );
}

function Select({
  id,
  label,
  value,
  options,
  format,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  options: readonly number[];
  format: (value: number) => string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="story-field">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {format(option)}
          </option>
        ))}
      </select>
    </div>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="story-check">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}

function PushFlow({ plan, tick }: { plan: PushPlan; tick: PushTick | null }) {
  const direct = plan.mode === "direct";
  const partitions = direct ? 1 : plan.partitions;
  const consumers = direct ? 1 : plan.consumers;
  const limit = Math.floor(plan.capacity / partitions);
  const down = tick?.targetDown ?? false;
  const consumerState = (i: number) => {
    if (!tick) return "";
    if (i >= partitions) return c.stateIdle;
    if (tick.stalled[i]) return c.stateCrashed;
    if (down) return c.stateWaiting;
    if (tick.poisonBlocked && owner(0, consumers) === i) return c.stateRetrying;
    return c.stateWriting;
  };
  return (
    <div className="push-flow">
      <div className="push-node">
        <span className="push-name">{c.producer}</span>
        <strong>{fill(c.perSecond, formatNumber("ru", plan.rate))}</strong>
      </div>
      <span className="push-arrow" aria-hidden="true">
        →
      </span>
      <div className="push-node push-queue">
        <span className="push-name">{direct ? c.buffer : c.queue}</span>
        <ol className="push-partitions">
          {Array.from({ length: partitions }, (_, p) => {
            const depth = tick?.depth[p] ?? 0;
            return (
              <li key={p}>
                <span className="part-label">
                  {direct ? "" : fill(c.partition, p + 1)}
                </span>
                <span className="part-bar" aria-hidden="true">
                  <span
                    className={depth >= limit ? "part-fill full" : "part-fill"}
                    style={{ width: `${Math.min(depth / limit, 1) * 100}%` }}
                  />
                </span>
                <span className="part-count">{formatNumber("ru", depth)}</span>
              </li>
            );
          })}
        </ol>
        <small>{fill(c.capacity, formatNumber("ru", plan.capacity))}</small>
      </div>
      <span className="push-arrow" aria-hidden="true">
        →
      </span>
      <div className="push-node">
        <span className="push-name">{c.consumers}</span>
        <ul className="push-consumers">
          {Array.from({ length: consumers }, (_, i) => (
            <li
              key={i}
              className={
                tick && (tick.stalled[i] || i >= partitions) ? "off" : ""
              }
            >
              <span className="consumer-name">{fill(c.consumer, i + 1)}</span>{" "}
              {consumerState(i)}
            </li>
          ))}
        </ul>
      </div>
      <span className="push-arrow" aria-hidden="true">
        →
      </span>
      <div
        className={
          down ? "push-node push-target down" : "push-node push-target"
        }
      >
        <span className="push-name">{c.target}</span>
        <strong>{down ? c.targetDown : c.targetUp}</strong>
      </div>
    </div>
  );
}

function LagChart({ run, upTo }: { run: PushRun; upTo: number }) {
  const width = 600;
  const height = 120;
  const total = run.ticks.length;
  const top = Math.max(run.maxLag, 200);
  const x = (i: number) => (i / (total - 1)) * width;
  const y = (lag: number) => height - (lag / top) * (height - 6);
  const points = run.ticks
    .slice(0, upTo + 1)
    .map((t, i) => `${x(i).toFixed(1)},${y(t.lag).toFixed(1)}`)
    .join(" ");
  const { outageStartS, poisonAtS, crashAtS, durationS } = pushTiming;
  const at = (s: number) => (s / durationS) * width;
  const shownMax =
    upTo >= 0 ? Math.max(...run.ticks.slice(0, upTo + 1).map((t) => t.lag)) : 0;
  return (
    <figure className="lag-chart">
      <figcaption>
        <span>{c.chart}</span>
        <span>{fill(c.chartMax, formatNumber("ru", shownMax))}</span>
      </figcaption>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={fill(
          c.chartLabel,
          formatNumber("ru", shownMax),
          formatNumber("ru", upTo >= 0 ? run.ticks[upTo]!.lag : 0),
        )}
      >
        {run.plan.outageS > 0 && (
          <rect
            x={at(outageStartS)}
            y="0"
            width={at(run.plan.outageS)}
            height={height}
            className="lag-outage"
          />
        )}
        {run.plan.poison && (
          <line
            x1={at(poisonAtS)}
            x2={at(poisonAtS)}
            y1="0"
            y2={height}
            className="lag-event"
          />
        )}
        {run.plan.crash && (
          <line
            x1={at(crashAtS)}
            x2={at(crashAtS)}
            y1="0"
            y2={height}
            className="lag-event"
          />
        )}
        <line x1="0" x2={width} y1={height} y2={height} className="lag-axis" />
        {upTo >= 0 && <polyline points={points} className="lag-line" />}
        {upTo >= 0 && upTo < total - 1 && (
          <line
            x1={x(upTo)}
            x2={x(upTo)}
            y1="0"
            y2={height}
            className="lag-cursor"
          />
        )}
      </svg>
      <div className="lag-axis-labels" aria-hidden="true">
        <span>{c.chartStart}</span>
        {run.plan.outageS > 0 && (
          <span
            className="lag-outage-label"
            style={{ left: `${(outageStartS / durationS) * 100}%` }}
          >
            {c.chartOutage}
          </span>
        )}
        <span>{c.chartEnd}</span>
      </div>
    </figure>
  );
}
