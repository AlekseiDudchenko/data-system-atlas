/**
 * A batch-by-batch model of a lazy, batched transfer (1,000 batches of 1,000
 * records) that meets three scripted failures. Failures happen at fixed
 * batches so every run is reproducible; times are model estimates.
 */

export type WriteMode = "insert" | "upsert";
/** When the script saves its position relative to the batch write. */
export type CheckpointMode = "none" | "after-write" | "before-write";
export type Failures = Readonly<{
  /** The connection drops before the batch reaches the target, twice. */
  drop: boolean;
  /** The target commits the batch, but the acknowledgement is lost. */
  lostAck: boolean;
  /** The script process dies between the write and the checkpoint. */
  crash: boolean;
}>;

export type ReliabilityPlan = Readonly<{
  retry: boolean;
  writeMode: WriteMode;
  checkpoint: CheckpointMode;
  failures: Failures;
}>;

export const reliabilityCosts = {
  batches: 1_000,
  batchSize: 1_000,
  /** Fetching one page from the source cursor. */
  readMs: 7,
  roundTripMs: 2,
  /** Target work for one batch of plain inserts or upserts. */
  insertMs: 50,
  upsertMs: 60,
  /** How long the script waits before treating a write as failed. */
  timeoutMs: 1_000,
  /** Exponential backoff before each retry of the same batch. */
  backoffMs: [100, 200, 400, 800] as readonly number[],
  /** Saving the checkpoint is one more round trip. */
  checkpointMs: 2,
  /** Time to notice a dead script and start it again. */
  restartMs: 10_000,
} as const;

/** Zero-based batch index where each failure strikes. */
export const failureAt = { drop: 120, lostAck: 370, crash: 640 } as const;
const dropAttempts = 2;

export type StepKind =
  | "commit"
  | "drop"
  | "lost-ack"
  | "retry"
  | "checkpoint"
  | "crash"
  | "restart"
  | "abort"
  | "done";

export type Step = Readonly<{
  /** Modelled time when the step completes. */
  t: number;
  kind: StepKind;
  batch: number;
  /** Retry: backoff waited. Checkpoint: saved position. Restart: resume batch. */
  value?: number;
}>;

export type ReliabilityRun = Readonly<{
  plan: ReliabilityPlan;
  steps: readonly Step[];
  durationMs: number;
}>;

export function simulateReliability(plan: ReliabilityPlan): ReliabilityRun {
  const c = reliabilityCosts;
  const writeMs =
    c.roundTripMs + (plan.writeMode === "upsert" ? c.upsertMs : c.insertMs);
  const steps: Step[] = [];
  let t = 0;
  let batch = 0;
  let saved = 0;
  let dropsLeft = plan.failures.drop ? dropAttempts : 0;
  let ackLost = !plan.failures.lostAck;
  let crashed = !plan.failures.crash;

  const save = (position: number) => {
    t += c.checkpointMs;
    saved = position;
    steps.push({ t, kind: "checkpoint", batch, value: position });
  };
  const crashHere = () => {
    if (crashed || batch !== failureAt.crash) return false;
    crashed = true;
    steps.push({ t, kind: "crash", batch });
    t += c.restartMs;
    const resume = plan.checkpoint === "none" ? 0 : saved;
    steps.push({ t, kind: "restart", batch, value: resume });
    batch = resume;
    return true;
  };
  /** Writes the current batch with retries; false when the job aborts. */
  const write = () => {
    for (let attempt = 0; ; attempt++) {
      if (batch === failureAt.drop && dropsLeft > 0) {
        dropsLeft--;
        t += c.timeoutMs;
        steps.push({ t, kind: "drop", batch });
      } else {
        t += writeMs;
        if (batch === failureAt.lostAck && !ackLost) {
          ackLost = true;
          t += c.timeoutMs;
          steps.push({ t, kind: "lost-ack", batch });
        } else {
          steps.push({ t, kind: "commit", batch });
          return true;
        }
      }
      if (!plan.retry) {
        steps.push({ t, kind: "abort", batch });
        return false;
      }
      const wait = c.backoffMs[Math.min(attempt, c.backoffMs.length - 1)]!;
      t += wait;
      steps.push({ t, kind: "retry", batch, value: wait });
    }
  };

  while (batch < c.batches) {
    t += c.readMs;
    if (plan.checkpoint === "before-write") {
      save(batch + 1);
      if (crashHere()) continue;
      if (!write()) return { plan, steps, durationMs: t };
    } else {
      if (!write()) return { plan, steps, durationMs: t };
      if (crashHere()) continue;
      if (plan.checkpoint === "after-write") save(batch + 1);
    }
    batch++;
  }
  steps.push({ t, kind: "done", batch: c.batches });
  return { plan, steps, durationMs: t };
}

export type BatchState = "empty" | "written" | "repeated" | "missing";

export type ReliabilityState = Readonly<{
  elapsedMs: number;
  status: "idle" | "running" | "waiting" | "restarting" | "done" | "aborted";
  /** Times each batch was committed to the target. */
  writes: readonly number[];
  /** Furthest batch the script has moved past. */
  position: number;
  checkpoint: number | null;
  uniqueRecords: number;
  /** Extra copies: duplicate rows for inserts, rewritten rows for upserts. */
  repeatedRecords: number;
  /** Batches the script moved past without ever writing. */
  missingRecords: number;
  retries: number;
  restarts: number;
  events: readonly Step[];
}>;

const notable: readonly StepKind[] = [
  "drop",
  "lost-ack",
  "retry",
  "crash",
  "restart",
  "abort",
  "done",
];

/** Replays a run up to modelled time `elapsed`. */
export function reliabilityAt(
  run: ReliabilityRun,
  elapsed: number,
): ReliabilityState {
  const c = reliabilityCosts;
  const writes = Array<number>(c.batches).fill(0);
  let position = 0;
  let checkpoint: number | null = null;
  let retries = 0;
  let restarts = 0;
  let last: StepKind | null = null;
  const events: Step[] = [];
  for (const step of run.steps) {
    if (step.t > elapsed) break;
    last = step.kind;
    if (notable.includes(step.kind)) events.push(step);
    switch (step.kind) {
      case "commit":
      case "lost-ack":
        writes[step.batch]!++;
        position = Math.max(position, step.batch + 1);
        break;
      case "checkpoint":
        checkpoint = step.value ?? null;
        position = Math.max(position, step.batch);
        break;
      case "retry":
        retries++;
        break;
      case "restart":
        restarts++;
        break;
    }
  }
  const finished = last === "done" || last === "abort";
  const missing = writes.filter((n, i) => n === 0 && i < position).length;
  const unique = writes.filter((n) => n > 0).length;
  const repeated = writes.reduce((sum, n) => sum + Math.max(0, n - 1), 0);
  return {
    elapsedMs: Math.min(Math.max(elapsed, 0), run.durationMs),
    status:
      elapsed <= 0
        ? "idle"
        : last === "done"
          ? "done"
          : last === "abort"
            ? "aborted"
            : last === "crash"
              ? "restarting"
              : last === "drop" || last === "lost-ack"
                ? "waiting"
                : finished
                  ? "done"
                  : "running",
    writes,
    position,
    checkpoint,
    uniqueRecords: unique * c.batchSize,
    repeatedRecords: repeated * c.batchSize,
    missingRecords: missing * c.batchSize,
    retries,
    restarts,
    events,
  };
}

export function batchState(state: ReliabilityState, batch: number): BatchState {
  const n = state.writes[batch] ?? 0;
  if (n > 1) return "repeated";
  if (n === 1) return "written";
  return batch < state.position ? "missing" : "empty";
}
