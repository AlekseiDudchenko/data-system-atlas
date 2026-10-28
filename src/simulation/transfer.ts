/**
 * An explanatory cost model for copying records from a source database to a
 * target database with one sequential transfer process. Every number is an
 * estimate derived from the constants below, not a measurement.
 */

export type Reading = "eager" | "lazy";

export type TransferPlan = Readonly<{
  records: number;
  /** Eager loads the whole result set first; lazy reads it page by page. */
  reading: Reading;
  /** Records sent to the target in one write round trip. 1 = per-record writes. */
  batchSize: number;
}>;

export type CostModel = Readonly<{
  /** Network round trip for one query or one write statement. */
  roundTripMs: number;
  /** Source work per record read. */
  readCostMs: number;
  /** Target work per record written. */
  writeCostMs: number;
  recordBytes: number;
  /** Records fetched per lazy read round trip. */
  pageSize: number;
  /** Memory available to the transfer process for buffered records. */
  memoryLimitBytes: number;
}>;

export const defaultCosts: CostModel = {
  roundTripMs: 2,
  readCostMs: 0.005,
  writeCostMs: 0.05,
  recordBytes: 1_000,
  pageSize: 1_000,
  memoryLimitBytes: 512_000_000,
};

export const recordOptions = [
  1_000, 10_000, 100_000, 1_000_000, 10_000_000,
] as const;
export const batchOptions = [1, 10, 100, 1_000, 10_000, 100_000] as const;

export type TransferOutcome = "completed" | "out-of-memory";

export type TransferEstimate = Readonly<{
  plan: TransferPlan;
  costs: CostModel;
  outcome: TransferOutcome;
  /** Time until completion, or until the process runs out of memory. */
  durationMs: number;
  /** Duration of the reading phase; equal to durationMs for lazy reading. */
  readPhaseMs: number;
  readRoundTrips: number;
  writeRoundTrips: number;
  recordsRead: number;
  recordsWritten: number;
  /** Memory the plan needs at its peak, even when it exceeds the limit. */
  memoryNeededBytes: number;
  /** How long the source query (cursor and its connection) stays open. */
  cursorOpenMs: number;
  /** Completed records per second; 0 when the transfer fails. */
  recordsPerSecond: number;
}>;

export function normalizePlan(plan: TransferPlan): TransferPlan {
  const records = Math.max(0, Math.floor(plan.records));
  const batchSize = Math.max(1, Math.floor(plan.batchSize));
  return { records, reading: plan.reading, batchSize };
}

export function estimateTransfer(
  input: TransferPlan,
  costs: CostModel = defaultCosts,
): TransferEstimate {
  const plan = normalizePlan(input);
  const { records, batchSize } = plan;
  const writeRoundTrips = Math.ceil(records / batchSize);
  const writeMs =
    writeRoundTrips * costs.roundTripMs + records * costs.writeCostMs;

  if (plan.reading === "eager") {
    const memoryNeededBytes = records * costs.recordBytes;
    const capacity = Math.floor(costs.memoryLimitBytes / costs.recordBytes);
    if (memoryNeededBytes > costs.memoryLimitBytes) {
      // The single query fails while its result is still being buffered.
      const failedAfter = costs.roundTripMs + capacity * costs.readCostMs;
      return {
        plan,
        costs,
        outcome: "out-of-memory",
        durationMs: failedAfter,
        readPhaseMs: failedAfter,
        readRoundTrips: 1,
        writeRoundTrips: 0,
        recordsRead: capacity,
        recordsWritten: 0,
        memoryNeededBytes,
        cursorOpenMs: failedAfter,
        recordsPerSecond: 0,
      };
    }
    const readMs = costs.roundTripMs + records * costs.readCostMs;
    const durationMs = readMs + writeMs;
    return {
      plan,
      costs,
      outcome: "completed",
      durationMs,
      readPhaseMs: readMs,
      readRoundTrips: 1,
      writeRoundTrips,
      recordsRead: records,
      recordsWritten: records,
      memoryNeededBytes,
      cursorOpenMs: readMs,
      recordsPerSecond: rate(records, durationMs),
    };
  }

  const readRoundTrips = Math.ceil(records / costs.pageSize);
  const readMs =
    readRoundTrips * costs.roundTripMs + records * costs.readCostMs;
  const durationMs = readMs + writeMs;
  const memoryNeededBytes =
    records === 0
      ? 0
      : (Math.min(costs.pageSize, records) + Math.min(batchSize, records)) *
        costs.recordBytes;
  if (memoryNeededBytes > costs.memoryLimitBytes) {
    // A batch that cannot fit fails on the first fill, before any write.
    const buffered = Math.floor(costs.memoryLimitBytes / costs.recordBytes);
    const failedAfter =
      Math.ceil(buffered / costs.pageSize) * costs.roundTripMs +
      buffered * costs.readCostMs;
    return {
      plan,
      costs,
      outcome: "out-of-memory",
      durationMs: failedAfter,
      readPhaseMs: failedAfter,
      readRoundTrips: Math.ceil(buffered / costs.pageSize),
      writeRoundTrips: 0,
      recordsRead: buffered,
      recordsWritten: 0,
      memoryNeededBytes,
      cursorOpenMs: failedAfter,
      recordsPerSecond: 0,
    };
  }
  return {
    plan,
    costs,
    outcome: "completed",
    durationMs,
    readPhaseMs: durationMs,
    readRoundTrips,
    writeRoundTrips,
    recordsRead: records,
    recordsWritten: records,
    memoryNeededBytes,
    cursorOpenMs: durationMs,
    recordsPerSecond: rate(records, durationMs),
  };
}

function rate(records: number, durationMs: number): number {
  return durationMs > 0 ? (records / durationMs) * 1_000 : 0;
}

export type TransferPhase = "idle" | "reading" | "writing" | "done" | "failed";

export type TransferProgress = Readonly<{
  elapsedMs: number;
  phase: TransferPhase;
  recordsRead: number;
  recordsWritten: number;
  memoryBytes: number;
}>;

/**
 * The visible state of a run at a point in modelled time. Reading and writing
 * progress linearly inside their phases; writes complete in whole batches.
 */
export function progressAt(
  estimate: TransferEstimate,
  elapsed: number,
): TransferProgress {
  const { plan, costs } = estimate;
  const t = Math.min(Math.max(elapsed, 0), estimate.durationMs);
  if (elapsed <= 0)
    return {
      elapsedMs: 0,
      phase: "idle",
      recordsRead: 0,
      recordsWritten: 0,
      memoryBytes: 0,
    };

  if (estimate.outcome === "out-of-memory") {
    const share = estimate.durationMs > 0 ? t / estimate.durationMs : 1;
    const recordsRead = Math.floor(estimate.recordsRead * share);
    const failed = elapsed >= estimate.durationMs;
    return {
      elapsedMs: t,
      phase: failed ? "failed" : "reading",
      recordsRead,
      recordsWritten: 0,
      memoryBytes: failed
        ? costs.memoryLimitBytes
        : Math.min(recordsRead * costs.recordBytes, costs.memoryLimitBytes),
    };
  }

  const done = elapsed >= estimate.durationMs;
  if (plan.reading === "eager") {
    if (t < estimate.readPhaseMs) {
      const recordsRead = Math.floor((plan.records * t) / estimate.readPhaseMs);
      return {
        elapsedMs: t,
        phase: "reading",
        recordsRead,
        recordsWritten: 0,
        memoryBytes: recordsRead * costs.recordBytes,
      };
    }
    const writeMs = estimate.durationMs - estimate.readPhaseMs;
    return {
      elapsedMs: t,
      phase: done ? "done" : "writing",
      recordsRead: plan.records,
      recordsWritten: done
        ? plan.records
        : wholeBatches(
            plan.records,
            plan.batchSize,
            writeMs > 0 ? (t - estimate.readPhaseMs) / writeMs : 1,
          ),
      memoryBytes: done ? 0 : plan.records * costs.recordBytes,
    };
  }

  const share = estimate.durationMs > 0 ? t / estimate.durationMs : 1;
  const recordsWritten = done
    ? plan.records
    : wholeBatches(plan.records, plan.batchSize, share);
  const recordsRead = done
    ? plan.records
    : Math.min(
        plan.records,
        Math.ceil(
          Math.min(plan.records, recordsWritten + plan.batchSize) /
            costs.pageSize,
        ) * costs.pageSize,
      );
  return {
    elapsedMs: t,
    phase: done ? "done" : "writing",
    recordsRead,
    recordsWritten,
    memoryBytes: done ? 0 : estimate.memoryNeededBytes,
  };
}

function wholeBatches(records: number, batchSize: number, share: number) {
  const batches = Math.floor(Math.ceil(records / batchSize) * share + 1e-9);
  return Math.min(records, batches * batchSize);
}
