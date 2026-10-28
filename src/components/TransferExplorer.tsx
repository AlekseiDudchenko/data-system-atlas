import { useEffect, useRef, useState } from "react";
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
import TransferDiagram from "./TransferDiagram";
import { useHydrated } from "./useHydrated";

type SceneIndex = 0 | 1 | 2 | 3;
type Choice = { records: number; batchSize: number };

const defaults: Record<SceneIndex, Choice> = {
  0: { records: 1_000, batchSize: 1 },
  1: { records: 1_000_000, batchSize: 1 },
  2: { records: 1_000_000, batchSize: 1 },
  3: { records: 1_000_000, batchSize: 1_000 },
};

/** The plan a scene runs, and the plan it is compared with. */
function plans(scene: SceneIndex, choice: Choice) {
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

function strategy(plan: TransferPlan, scene: SceneIndex, isBefore: boolean) {
  if (isBefore && scene === 1)
    return fill(c.smallerTable, formatNumber("ru", plan.records));
  if (plan.reading === "eager") return c.eagerSingle;
  return plan.batchSize > 1
    ? fill(c.lazyBatch, formatNumber("ru", plan.batchSize))
    : c.lazySingle;
}

const records = (n: number) =>
  `${formatNumber("ru", n)} ${plural(n, c.words.record)}`;

const ANIMATION_MS = 2_600;

export default function TransferExplorer() {
  const hydrated = useHydrated();
  const [scene, setScene] = useState<SceneIndex>(0);
  const [choice, setChoice] = useState<Choice>(defaults[0]);
  // Share of the modelled duration shown; null before the first run.
  const [share, setShare] = useState<number | null>(null);
  const [ran, setRan] = useState(false);
  const active = useRef<SceneIndex>(0);
  const frame = useRef<number>(0);

  const stop = () => cancelAnimationFrame(frame.current);
  const switchScene = (next: SceneIndex) => {
    if (active.current === next) return;
    active.current = next;
    stop();
    setScene(next);
    setChoice(defaults[next]);
    setShare(null);
    setRan(false);
  };

  useEffect(() => {
    if (!window.matchMedia("(min-width: 900px)").matches) return;
    const scenes = Array.from(
      document.querySelectorAll<HTMLElement>("[data-scene]"),
    );
    const observer = new IntersectionObserver(
      () => {
        // Read current positions, since queued entries can precede a manual jump.
        const anchor = window.innerHeight * 0.3;
        const visible = scenes.find((element) => {
          const bounds = element.getBoundingClientRect();
          return bounds.top <= anchor && bounds.bottom > anchor;
        });
        if (visible) switchScene(Number(visible.dataset.scene) as SceneIndex);
      },
      { rootMargin: "-15% 0px -55% 0px", threshold: 0 },
    );
    scenes.forEach((element) => observer.observe(element));
    return () => {
      observer.disconnect();
      stop();
    };
  }, []);

  const { now, before } = plans(scene, choice);
  const estimate = estimateTransfer(now);
  const previous = before && estimateTransfer(before);
  const progress = progressAt(
    estimate,
    share === null ? 0 : estimate.durationMs * share,
  );
  const running = share !== null && share < 1;

  const run = () => {
    stop();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShare(1);
      setRan(true);
      return;
    }
    const start = performance.now();
    const tick = (time: number) => {
      const next = Math.min((time - start) / ANIMATION_MS, 1);
      setShare(next);
      if (next < 1) frame.current = requestAnimationFrame(tick);
      else setRan(true);
    };
    setShare(0);
    frame.current = requestAnimationFrame(tick);
  };

  const change = (update: Partial<Choice>) => {
    stop();
    setChoice((current) => ({ ...current, ...update }));
    setShare(null);
    setRan(false);
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

  return (
    <div className={`story-explorer ${hydrated ? "is-interactive" : ""}`}>
      <div className="story-narrative">
        {c.scenes.map((item, i) => (
          <section
            key={i}
            id={`scene-${i + 1}`}
            data-scene={i}
            className={`story-scene ${scene === i ? "active" : ""}`}
            aria-labelledby={`scene-title-${i}`}
          >
            <span className="story-index">0{i + 1} / 04</span>
            <h2 id={`scene-title-${i}`}>{item.title}</h2>
            <p>{item.body}</p>
            <p className="scene-insight">{item.insight}</p>
            <a
              href="#story-workspace"
              className="scene-open"
              onClick={(event) => {
                event.preventDefault();
                switchScene(i as SceneIndex);
                document
                  .getElementById("story-workspace")
                  ?.focus({ preventScroll: true });
              }}
            >
              {c.controls} <span aria-hidden="true">↗</span>
            </a>
          </section>
        ))}
      </div>
      <div className="story-workspace" id="story-workspace" tabIndex={-1}>
        <nav className="scene-nav" aria-label={c.scenesLabel}>
          {c.scenes.map((item, i) => (
            <button
              key={i}
              type="button"
              disabled={!hydrated}
              aria-label={item.title}
              aria-pressed={scene === i}
              onClick={() => {
                switchScene(i as SceneIndex);
                if (window.matchMedia("(min-width: 900px)").matches) {
                  document
                    .getElementById(`scene-${i + 1}`)
                    ?.scrollIntoView({ block: "start", behavior: "instant" });
                }
              }}
            >
              0{i + 1}
            </button>
          ))}
          <span className="workspace-mode">{strategy(now, scene, false)}</span>
        </nav>
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
        {ran && <Comparison scene={scene} now={estimate} before={previous} />}
        <p className="workspace-hint">{c.estimateNote}</p>
        <button
          type="button"
          className="story-reset"
          disabled={!hydrated}
          onClick={() => {
            stop();
            setChoice(defaults[scene]);
            setShare(null);
            setRan(false);
          }}
        >
          {c.reset} <span aria-hidden="true">↺</span>
        </button>
      </div>
    </div>
  );
}

function Comparison({
  scene,
  now,
  before,
}: {
  scene: SceneIndex;
  now: TransferEstimate;
  before: TransferEstimate | null;
}) {
  const columns = before ? [before, now] : [now];
  const rows: [string, (estimate: TransferEstimate) => string][] = [
    [
      c.duration,
      (e) =>
        e.outcome === "completed"
          ? formatDuration("ru", e.durationMs)
          : `${c.outOfMemory} · ${formatDuration("ru", e.durationMs)}`,
    ],
    [
      c.throughput,
      (e) =>
        e.outcome === "completed"
          ? fill(c.perSecond, formatNumber("ru", e.recordsPerSecond))
          : c.notReached,
    ],
    [
      c.roundTrips,
      (e) => formatNumber("ru", e.readRoundTrips + e.writeRoundTrips),
    ],
    [c.peakMemory, (e) => formatBytes("ru", e.memoryNeededBytes)],
    [c.cursorOpen, (e) => formatDuration("ru", e.cursorOpenMs)],
  ];
  return (
    <div className="story-compare">
      <table>
        <caption>{c.compare}</caption>
        <thead>
          <tr>
            <th scope="col">{c.metric}</th>
            {before && (
              <th scope="col">
                {c.before}
                <span>{strategy(before.plan, scene, true)}</span>
              </th>
            )}
            <th scope="col">
              {c.after}
              <span>{strategy(now.plan, scene, false)}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <th scope="row">{label}</th>
              {columns.map((estimate, i) => (
                <td key={i}>{value(estimate)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
