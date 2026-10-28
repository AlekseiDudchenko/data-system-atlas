/**
 * Several readers copy independent key ranges of the same 1,000 batches.
 * The target writes at full speed for a few concurrent writers and slows down
 * beyond that; readers wait for a pooled connection. Model estimates only.
 */

export type ParallelPlan = Readonly<{ workers: number; skewed: boolean }>;

export const parallelCosts = {
  batches: 1_000,
  batchSize: 1_000,
  readMs: 7,
  roundTripMs: 2,
  writeMs: 50,
  /** Connections the target pool hands out. */
  poolSize: 8,
  /** Concurrent writers the target serves without slowing each one down. */
  fullSpeedWriters: 4,
} as const;

export const workerOptions = [1, 2, 4, 8, 16] as const;

export type WorkerRun = Readonly<{
  batches: number;
  startMs: number;
  endMs: number;
  /** Completion time of each of the worker's batches. */
  completions: readonly number[];
}>;

export type ParallelRun = Readonly<{
  plan: ParallelPlan;
  workers: readonly WorkerRun[];
  durationMs: number;
  /** Most connections in use at once. */
  peakConnections: number;
}>;

/** Splits the key space evenly; skewed data puts half the rows in range one. */
export function rangeSizes(plan: ParallelPlan): number[] {
  const n = Math.max(1, Math.floor(plan.workers));
  const total = parallelCosts.batches;
  const weights = Array.from({ length: n }, (_, i) =>
    plan.skewed ? (i === 0 ? 0.5 : 0) + 0.5 / n : 1 / n,
  );
  const sizes = weights.map((w) => Math.floor(w * total));
  // Hand out rounding leftovers to the first ranges.
  let left = total - sizes.reduce((a, b) => a + b, 0);
  for (let i = 0; left > 0; i = (i + 1) % n, left--) sizes[i]!++;
  return sizes;
}

export function batchMs(activeWriters: number): number {
  const c = parallelCosts;
  const slowdown = Math.max(1, activeWriters / c.fullSpeedWriters);
  return c.readMs + c.roundTripMs + c.writeMs * slowdown;
}

export function simulateParallel(plan: ParallelPlan): ParallelRun {
  const sizes = rangeSizes(plan);
  const slots = Math.min(sizes.length, parallelCosts.poolSize);
  const completions: number[][] = sizes.map(() => []);
  const start = sizes.map(() => 0);
  const end = sizes.map(() => 0);
  // Workers holding a connection: index → time their current batch completes.
  const running = new Map<number, number>();
  const waiting = sizes.map((_, i) => i);
  let peak = 0;
  const begin = (worker: number, t: number) => {
    start[worker] = t;
    if (sizes[worker] === 0) {
      end[worker] = t;
      return;
    }
    running.set(worker, t + batchMs(running.size + 1));
    peak = Math.max(peak, running.size);
  };
  while (waiting.length && running.size < slots) begin(waiting.shift()!, 0);
  // Readers that start together share the target from their first batch.
  for (const w of running.keys()) running.set(w, batchMs(running.size));
  while (running.size) {
    let worker = -1;
    let t = Infinity;
    for (const [w, due] of running)
      if (due < t || (due === t && w < worker)) [worker, t] = [w, due];
    completions[worker]!.push(t);
    if (completions[worker]!.length === sizes[worker]) {
      running.delete(worker);
      end[worker] = t;
      while (waiting.length && running.size < slots) begin(waiting.shift()!, t);
    } else {
      running.set(worker, t + batchMs(running.size));
    }
  }
  const workers = sizes.map((batches, i) => ({
    batches,
    startMs: start[i]!,
    endMs: end[i]!,
    completions: completions[i]!,
  }));
  return {
    plan,
    workers,
    durationMs: Math.max(...end),
    peakConnections: peak,
  };
}

export type ParallelState = Readonly<{
  elapsedMs: number;
  /** Batches each worker has finished. */
  done: readonly number[];
  waiting: readonly boolean[];
  finished: boolean;
}>;

export function parallelAt(run: ParallelRun, elapsed: number): ParallelState {
  const t = Math.min(Math.max(elapsed, 0), run.durationMs);
  return {
    elapsedMs: t,
    done: run.workers.map((w) => w.completions.filter((c) => c <= t).length),
    waiting: run.workers.map((w) => elapsed > 0 && w.startMs > t),
    finished: elapsed >= run.durationMs && elapsed > 0,
  };
}
