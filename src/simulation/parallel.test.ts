import { describe, expect, it } from "vitest";
import {
  batchMs,
  parallelAt,
  parallelCosts,
  rangeSizes,
  simulateParallel,
  workerOptions,
} from "./parallel";

describe("parallel pull", () => {
  it("splits every batch into ranges, half into range one when skewed", () => {
    for (const workers of workerOptions)
      for (const skewed of [false, true]) {
        const sizes = rangeSizes({ workers, skewed });
        expect(sizes).toHaveLength(workers);
        expect(sizes.reduce((a, b) => a + b, 0)).toBe(parallelCosts.batches);
        if (skewed && workers > 1)
          expect(sizes[0]).toBeGreaterThanOrEqual(parallelCosts.batches / 2);
      }
  });

  it("matches the sequential estimate with one reader", () => {
    const run = simulateParallel({ workers: 1, skewed: false });
    expect(run.durationMs).toBe(parallelCosts.batches * batchMs(1));
    expect(run.durationMs).toBe(59_000);
  });

  it("speeds up until the target saturates, then stops paying off", () => {
    const duration = (workers: number) =>
      simulateParallel({ workers, skewed: false }).durationMs;
    expect(duration(2)).toBeCloseTo(duration(1) / 2);
    expect(duration(4)).toBeCloseTo(duration(1) / 4);
    // Twice the readers, barely faster: the target is the bottleneck.
    expect(duration(8)).toBeGreaterThan(duration(4) * 0.9);
    expect(duration(16)).toBeGreaterThan(duration(8) * 0.95);
  });

  it("never holds more connections than the pool", () => {
    for (const workers of workerOptions) {
      const run = simulateParallel({ workers, skewed: false });
      expect(run.peakConnections).toBe(
        Math.min(workers, parallelCosts.poolSize),
      );
    }
    const sixteen = simulateParallel({ workers: 16, skewed: false });
    expect(sixteen.workers.filter((w) => w.startMs > 0)).toHaveLength(8);
  });

  it("is limited by the largest range when data is skewed", () => {
    for (const workers of workerOptions.filter((w) => w > 1)) {
      const skewed = simulateParallel({ workers, skewed: true });
      const even = simulateParallel({ workers, skewed: false });
      expect(skewed.durationMs).toBeGreaterThan(even.durationMs);
      expect(skewed.durationMs).toBe(skewed.workers[0]!.endMs);
    }
  });

  it("reports finished batches monotonically", () => {
    const run = simulateParallel({ workers: 16, skewed: true });
    let previous = parallelAt(run, 0).done.reduce((a, b) => a + b, 0);
    expect(previous).toBe(0);
    for (let i = 1; i <= 40; i++) {
      const done = parallelAt(run, (run.durationMs * i) / 40).done.reduce(
        (a, b) => a + b,
        0,
      );
      expect(done).toBeGreaterThanOrEqual(previous);
      previous = done;
    }
    expect(previous).toBe(parallelCosts.batches);
    expect(parallelAt(run, run.durationMs).finished).toBe(true);
  });
});
