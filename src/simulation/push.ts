/**
 * Push-based transfer: a producer emits events on its own schedule and
 * consumers write them to the target. Simulated in 100 ms ticks for 60 s.
 * Failures happen at fixed times so every run is reproducible.
 */

export type PushPlan = Readonly<{
  /** Direct: the producer hands events to the consumer through a small buffer. */
  mode: "direct" | "queue";
  /** Events the producer emits per second. */
  rate: number;
  consumers: number;
  /** Events one consumer writes per second. */
  consumerRate: number;
  partitions: number;
  /** Seconds the target is unavailable, starting at `outageStartS`. */
  outageS: number;
  /** Events the queue retains (queue) or the producer buffers (direct). */
  capacity: number;
  /** One malformed event at `poisonAtS` on partition 1 that never succeeds. */
  poison: boolean;
  deadLetter: boolean;
  /** Consumer 1 crashes at `crashAtS` and restarts from committed offsets. */
  crash: boolean;
  commitEveryS: number;
  idempotent: boolean;
  /** Half of all events go to partition 1. */
  skewed: boolean;
}>;

export const pushTiming = {
  tickS: 0.1,
  durationS: 60,
  outageStartS: 10,
  poisonAtS: 10,
  /** Time per attempt at the poison event, and attempts before dead-lettering. */
  poisonRetryS: 1,
  poisonAttempts: 3,
  crashAtS: 33.7,
  restartS: 5,
} as const;

export type PushTick = Readonly<{
  /** Events waiting per partition (direct mode: one buffer). */
  depth: readonly number[];
  lag: number;
  produced: number;
  written: number;
  duplicates: number;
  lost: number;
  deadLettered: number;
  targetDown: boolean;
  /** Consumers stopped after a crash, until they restart. */
  stalled: readonly boolean[];
  /** Partition 1 is stuck on the poison event. */
  poisonBlocked: boolean;
  /** Failed attempts at the poison event so far. */
  poisonAttempts: number;
}>;

export type PushRun = Readonly<{
  plan: PushPlan;
  ticks: readonly PushTick[];
  maxLag: number;
  /** Seconds from the end of the last disruption until lag is back to normal. */
  recoveryS: number | null;
}>;

/** Which consumer owns a partition; consumers beyond the partition count idle. */
export function owner(partition: number, consumers: number): number {
  return partition % Math.max(1, consumers);
}

export function simulatePush(plan: PushPlan): PushRun {
  const t = pushTiming;
  const ticks = Math.round(t.durationS / t.tickS);
  const partitions = plan.mode === "direct" ? 1 : Math.max(1, plan.partitions);
  const consumers = plan.mode === "direct" ? 1 : Math.max(1, plan.consumers);
  const perTick = Math.round(plan.rate * t.tickS);
  const capacityPerTick = Math.round(plan.consumerRate * t.tickS);
  const limit = Math.floor(plan.capacity / partitions);
  // Offsets per partition: produced, read (written to target), committed.
  const produced = Array<number>(partitions).fill(0);
  const position = Array<number>(partitions).fill(0);
  const committed = Array<number>(partitions).fill(0);
  let written = 0;
  let duplicates = 0;
  let lost = 0;
  let deadLettered = 0;
  let poisonOffset: number | null = null;
  let poisonAttempts = 0;
  let poisonTicks = 0;
  let crashedUntil = -1;
  const result: PushTick[] = [];
  const poisonTick = Math.round(t.poisonAtS / t.tickS);
  const crashTick = Math.round(t.crashAtS / t.tickS);
  const outageFrom = Math.round(t.outageStartS / t.tickS);
  const outageTo = outageFrom + Math.round(plan.outageS / t.tickS);
  const commitEvery = Math.max(1, Math.round(plan.commitEveryS / t.tickS));
  const retryTicks = Math.round(t.poisonRetryS / t.tickS);

  for (let k = 0; k < ticks; k++) {
    // Produce: spread evenly with a rotating remainder; skew sends half to p0.
    const hot = plan.skewed && partitions > 1 ? Math.floor(perTick / 2) : 0;
    const spread = perTick - hot;
    for (let p = 0; p < partitions; p++) {
      const extra = (p - (k % partitions) + partitions) % partitions;
      produced[p]! +=
        Math.floor(spread / partitions) +
        (extra < spread % partitions ? 1 : 0) +
        (p === 0 ? hot : 0);
    }
    if (plan.poison && k === poisonTick) poisonOffset = produced[0]!;

    // Crash: the consumer loses its uncommitted progress and restarts later.
    if (plan.crash && k === crashTick) {
      for (let p = 0; p < partitions; p++) {
        if (owner(p, consumers) !== 0) continue;
        const redo = position[p]! - committed[p]!;
        if (!plan.idempotent) duplicates += redo;
        written -= plan.idempotent ? redo : 0;
        position[p] = committed[p]!;
      }
      crashedUntil = k + Math.round(t.restartS / t.tickS);
    }

    const targetDown = k >= outageFrom && k < outageTo;
    const stalled = Array.from({ length: consumers }, () => false);
    if (k < crashedUntil) stalled[0] = true;

    if (!targetDown) {
      for (let c = 0; c < consumers && c < partitions; c++) {
        if (stalled[c]) continue;
        const owned: number[] = [];
        for (let p = 0; p < partitions; p++)
          if (owner(p, consumers) === c) owned.push(p);
        let budget = capacityPerTick;
        // Serve owned partitions in turns until the budget or queues run out.
        for (let pass = 0; budget > 0 && pass < 4; pass++) {
          const open = owned.filter(
            (p) => produced[p]! > position[p]! && !blocked(p),
          );
          if (!open.length) break;
          const share = Math.max(1, Math.floor(budget / open.length));
          for (const p of open) {
            let take = Math.min(share, budget, produced[p]! - position[p]!);
            if (
              p === 0 &&
              poisonOffset !== null &&
              position[0]! <= poisonOffset
            )
              take = Math.min(take, poisonOffset - position[0]!);
            position[p]! += take;
            written += take;
            budget -= take;
            if (
              p === 0 &&
              poisonOffset !== null &&
              position[0] === poisonOffset
            )
              break;
          }
        }
        if (owned.includes(0) && atPoison()) {
          poisonTicks++;
          if (poisonTicks % retryTicks === 0) poisonAttempts++;
          if (plan.deadLetter && poisonAttempts >= t.poisonAttempts) {
            deadLettered++;
            position[0]!++;
            poisonOffset = null;
          }
        }
      }
    }

    // Retention: the oldest unread events are dropped beyond the limit.
    // Checked after writing: what the consumers took this tick is safe.
    for (let p = 0; p < partitions; p++) {
      const excess = produced[p]! - position[p]! - limit;
      if (excess > 0) {
        lost += excess;
        position[p]! += excess;
        committed[p] = Math.max(committed[p]!, position[p]!);
      }
    }

    if ((k + 1) % commitEvery === 0)
      for (let p = 0; p < partitions; p++) committed[p] = position[p]!;

    const depth = produced.map((n, p) => n - position[p]!);
    result.push({
      depth,
      lag: depth.reduce((a, b) => a + b, 0),
      produced: produced.reduce((a, b) => a + b, 0),
      written,
      duplicates,
      lost,
      deadLettered,
      targetDown,
      stalled,
      poisonBlocked: atPoison(),
      poisonAttempts,
    });
  }

  function atPoison() {
    return poisonOffset !== null && position[0] === poisonOffset;
  }
  function blocked(p: number) {
    return p === 0 && atPoison();
  }

  const lags = result.map((r) => r.lag);
  const maxLag = Math.max(...lags);
  // Normal lag: what one tick of production leaves behind.
  const normal = Math.max(perTick, 1);
  const disruptions = [
    plan.outageS > 0 ? outageTo : -1,
    plan.poison ? poisonTick : -1,
    plan.crash ? crashedUntil : -1,
  ];
  const lastDisruption = Math.max(...disruptions);
  let recoveryS: number | null = null;
  if (lastDisruption >= 0) {
    for (let k = lastDisruption; k < ticks; k++)
      if (lags.slice(k).every((lag) => lag <= normal)) {
        recoveryS = Math.round((k - lastDisruption) * t.tickS * 10) / 10;
        break;
      }
  }
  return { plan, ticks: result, maxLag, recoveryS };
}

export function pushAt(run: PushRun, elapsedS: number) {
  const index = Math.min(
    run.ticks.length - 1,
    Math.max(0, Math.floor(elapsedS / pushTiming.tickS)),
  );
  return { index, tick: run.ticks[index]!, elapsedS: index * pushTiming.tickS };
}
