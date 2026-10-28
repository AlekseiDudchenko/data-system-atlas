import { useId } from "react";
import { fill, transferCopy as c } from "../content/transfers";
import { formatBytes, formatNumber, plural } from "../i18n/format";
import type {
  TransferEstimate,
  TransferProgress,
} from "../simulation/transfer";

type Geometry = {
  viewBox: string;
  source: Box;
  process: Box;
  target: Box;
  /** Arrow paths: source → process and process → target. */
  read: Arrow;
  write: Arrow;
  /** Box titles sit above the boxes (wide) or inside them (tall). */
  titlesInside: boolean;
};
type Box = { x: number; y: number; width: number; height: number };
type Arrow = {
  path: string;
  labelX: number;
  labelY: number;
  anchor: "middle" | "start";
};

const wide: Geometry = {
  viewBox: "0 0 720 300",
  source: { x: 20, y: 70, width: 150, height: 170 },
  process: { x: 285, y: 95, width: 150, height: 120 },
  target: { x: 550, y: 70, width: 150, height: 170 },
  read: { path: "M170 155 H285", labelX: 227, labelY: 143, anchor: "middle" },
  write: { path: "M435 155 H550", labelX: 492, labelY: 143, anchor: "middle" },
  titlesInside: false,
};

/** A vertical variant keeps labels legible at phone width. */
const tall: Geometry = {
  viewBox: "0 0 360 470",
  source: { x: 20, y: 14, width: 320, height: 106 },
  process: { x: 20, y: 188, width: 320, height: 100 },
  target: { x: 20, y: 356, width: 320, height: 100 },
  read: { path: "M180 124 V184", labelX: 196, labelY: 150, anchor: "start" },
  write: { path: "M180 292 V352", labelX: 196, labelY: 318, anchor: "start" },
  titlesInside: true,
};

type Props = {
  estimate: TransferEstimate;
  progress: TransferProgress;
  running?: boolean;
};

/** Both variants render; CSS shows the one that fits the screen. */
export default function TransferDiagram(props: Props) {
  return (
    <div className="transfer-figure">
      <Diagram {...props} geometry={wide} className="transfer-wide" />
      <Diagram {...props} geometry={tall} className="transfer-tall" />
    </div>
  );
}

function Diagram({
  estimate,
  progress,
  running = false,
  geometry: g,
  className,
}: Props & { geometry: Geometry; className: string }) {
  const marker = `transfer-${useId().replaceAll(":", "")}`;
  const { plan, costs } = estimate;
  const total = Math.max(plan.records, 1);
  const readShare = progress.recordsRead / total;
  const writtenShare = progress.recordsWritten / total;
  const failed = progress.phase === "failed";
  const memoryShare = Math.min(
    progress.memoryBytes / costs.memoryLimitBytes,
    1,
  );
  const lazy = plan.reading === "lazy";
  const readCount =
    estimate.outcome === "completed" ? estimate.readRoundTrips : 1;
  const writeCount = Math.ceil(plan.records / plan.batchSize);
  const readFlow =
    running &&
    (progress.phase === "reading" || (lazy && progress.phase === "writing"));
  const writeFlow = running && progress.phase === "writing";
  const records = (n: number) =>
    `${formatNumber("ru", n)} ${plural(n, c.words.record)}`;
  const { source, process, target } = g;
  const inside = g.titlesInside;
  // Content area of the source and target boxes, below an inside title.
  const pad = 18;
  const top = (box: Box) => box.y + (inside ? 40 : 20);
  const contentHeight = (box: Box) => box.height - (inside ? 58 : 40);
  const contentWidth = (box: Box) => box.width - pad * 2;
  const title = (box: Box, text: string, caption?: string) =>
    inside ? (
      <>
        <text x={box.x + pad} y={box.y + 26} className="transfer-label">
          {text}
        </text>
        {caption && (
          <text
            x={box.x + box.width - pad}
            y={box.y + 26}
            textAnchor="end"
            className="transfer-caption"
          >
            {caption}
          </text>
        )}
      </>
    ) : (
      <>
        <text
          x={box.x + box.width / 2}
          y={box.y - 16}
          textAnchor="middle"
          className="transfer-label"
        >
          {text}
        </text>
        {caption && (
          <text
            x={box.x + box.width / 2}
            y={box.y + box.height + 22}
            textAnchor="middle"
            className="transfer-caption"
          >
            {caption}
          </text>
        )}
      </>
    );
  const arrowLabel = (arrow: Arrow, count: number, noun: string) => (
    <>
      <text
        x={arrow.labelX}
        y={arrow.labelY}
        textAnchor={arrow.anchor}
        className="transfer-count"
      >
        {formatNumber("ru", count)}
      </text>
      <text
        x={arrow.labelX}
        y={arrow.labelY + (inside ? 16 : 31)}
        textAnchor={arrow.anchor}
        className="transfer-link-label"
      >
        {noun}
      </text>
    </>
  );
  // Six stripes stand for the source table: rows when wide, columns when tall.
  const stripes = Array.from({ length: 6 }, (_, i) => {
    const read = readShare > 0 && i / 6 < readShare;
    const cls = read ? "transfer-row read" : "transfer-row";
    if (inside) {
      const step = contentWidth(source) / 6;
      return (
        <rect
          key={i}
          x={source.x + pad + i * step}
          y={top(source)}
          width={step - 8}
          height={contentHeight(source)}
          rx="3"
          className={cls}
        />
      );
    }
    return (
      <rect
        key={i}
        x={source.x + pad}
        y={top(source) + i * 22}
        width={contentWidth(source)}
        height="14"
        rx="3"
        className={cls}
      />
    );
  });
  const targetFill = inside
    ? {
        x: target.x + pad,
        y: top(target),
        width: contentWidth(target) * writtenShare,
        height: contentHeight(target),
      }
    : {
        x: target.x + pad,
        y: top(target) + contentHeight(target) * (1 - writtenShare),
        width: contentWidth(target),
        height: contentHeight(target) * writtenShare,
      };
  const gaugeY = process.y + (inside ? 54 : 65);
  return (
    <svg
      className={`transfer-diagram ${className}`}
      viewBox={g.viewBox}
      role="img"
      aria-label={fill(
        c.diagramLabel,
        c.source,
        c.process,
        c.target,
        formatNumber("ru", progress.recordsWritten),
        records(plan.records),
        formatBytes("ru", progress.memoryBytes),
        formatBytes("ru", costs.memoryLimitBytes),
      )}
    >
      <defs>
        <marker
          id={marker}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--story-accent)" />
        </marker>
      </defs>

      <rect {...source} rx="8" className="transfer-db" />
      {title(source, c.source, records(plan.records))}
      {stripes}

      <path
        d={g.read.path}
        fill="none"
        stroke="var(--story-accent)"
        strokeWidth="1.5"
        markerEnd={`url(#${marker})`}
      />
      {arrowLabel(
        g.read,
        readCount,
        lazy ? plural(readCount, c.words.page) : c.readAll,
      )}

      <rect
        {...process}
        rx="8"
        className={failed ? "transfer-process failed" : "transfer-process"}
      />
      {inside ? (
        <text x={process.x + pad} y={process.y + 26} className="transfer-label">
          {c.process}
        </text>
      ) : (
        <text
          x={process.x + process.width / 2}
          y={process.y + 27}
          textAnchor="middle"
          className="transfer-label"
        >
          {c.process}
        </text>
      )}
      <text x={process.x + 14} y={gaugeY - 8} className="transfer-small">
        {c.memory}
      </text>
      <rect
        x={process.x + 14}
        y={gaugeY}
        width={process.width - 28}
        height="12"
        rx="3"
        className="transfer-gauge"
      />
      <rect
        x={process.x + 14}
        y={gaugeY}
        width={(process.width - 28) * memoryShare}
        height="12"
        rx="3"
        className={
          failed ? "transfer-gauge-fill failed" : "transfer-gauge-fill"
        }
      />
      {failed ? (
        <text
          x={process.x + process.width / 2}
          y={gaugeY + 32}
          textAnchor="middle"
          className="transfer-small alert"
        >
          {c.outOfMemory}
        </text>
      ) : (
        <>
          <text
            x={process.x + 14}
            y={gaugeY + 32}
            className="transfer-small strong"
          >
            {formatBytes("ru", progress.memoryBytes)}
          </text>
          <text
            x={process.x + process.width - 14}
            y={gaugeY + 32}
            textAnchor="end"
            className="transfer-small"
          >
            {fill(c.limit, formatBytes("ru", costs.memoryLimitBytes))}
          </text>
        </>
      )}

      <path
        d={g.write.path}
        fill="none"
        stroke="var(--story-accent)"
        strokeWidth="1.5"
        strokeDasharray={failed ? "3 5" : undefined}
        markerEnd={`url(#${marker})`}
      />
      {arrowLabel(
        g.write,
        writeCount,
        plural(writeCount, plan.batchSize > 1 ? c.words.batch : c.words.insert),
      )}

      <rect {...target} rx="8" className="transfer-db" />
      {title(
        target,
        c.target,
        fill(c.writtenOf, formatNumber("ru", progress.recordsWritten)),
      )}
      <rect
        x={target.x + pad}
        y={top(target)}
        width={contentWidth(target)}
        height={contentHeight(target)}
        rx="3"
        className="transfer-row empty"
      />
      <rect {...targetFill} rx="3" className="transfer-fill" />

      {readFlow && <Packet path={g.read.path} wide={lazy} />}
      {writeFlow && <Packet path={g.write.path} wide={plan.batchSize > 1} />}
    </svg>
  );
}

function Packet({ path, wide }: { path: string; wide: boolean }) {
  return wide ? (
    <rect
      x="-9"
      y="-5"
      width="18"
      height="10"
      rx="2"
      className="transfer-packet"
    >
      <animateMotion dur="0.7s" path={path} repeatCount="indefinite" />
    </rect>
  ) : (
    <circle r="4" className="transfer-packet">
      <animateMotion dur="0.7s" path={path} repeatCount="indefinite" />
    </circle>
  );
}
