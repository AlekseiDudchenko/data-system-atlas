import { describe, expect, it } from "vitest";
import {
  batchOptions,
  defaultCosts,
  estimateTransfer,
  progressAt,
  recordOptions,
  type TransferPlan,
} from "./transfer";

const plans: TransferPlan[] = recordOptions.flatMap((records) =>
  (["eager", "lazy"] as const).flatMap((reading) =>
    batchOptions.map((batchSize) => ({ records, reading, batchSize })),
  ),
);

describe("transfer estimate", () => {
  it("writes every record it reads when the transfer completes", () => {
    for (const plan of plans) {
      const estimate = estimateTransfer(plan);
      if (estimate.outcome !== "completed") continue;
      expect(estimate.recordsRead).toBe(plan.records);
      expect(estimate.recordsWritten).toBe(plan.records);
      expect(estimate.writeRoundTrips).toBe(
        Math.ceil(plan.records / plan.batchSize),
      );
      expect(estimate.recordsPerSecond).toBeCloseTo(
        (plan.records / estimate.durationMs) * 1_000,
      );
    }
  });

  it("matches the documented formula for a sequential copy", () => {
    const estimate = estimateTransfer({
      records: 1_000,
      reading: "eager",
      batchSize: 1,
    });
    const { roundTripMs, readCostMs, writeCostMs } = defaultCosts;
    expect(estimate.readRoundTrips).toBe(1);
    expect(estimate.writeRoundTrips).toBe(1_000);
    expect(estimate.durationMs).toBeCloseTo(
      roundTripMs + 1_000 * readCostMs + 1_000 * (roundTripMs + writeCostMs),
    );
    expect(estimate.memoryNeededBytes).toBe(1_000_000);
  });

  it("runs an eager read out of memory before writing anything", () => {
    const estimate = estimateTransfer({
      records: 1_000_000,
      reading: "eager",
      batchSize: 1,
    });
    expect(estimate.outcome).toBe("out-of-memory");
    expect(estimate.recordsWritten).toBe(0);
    expect(estimate.writeRoundTrips).toBe(0);
    expect(estimate.memoryNeededBytes).toBeGreaterThan(
      defaultCosts.memoryLimitBytes,
    );
    expect(estimate.recordsRead * defaultCosts.recordBytes).toBeLessThanOrEqual(
      defaultCosts.memoryLimitBytes,
    );
  });

  it("keeps lazy memory flat as the record count grows", () => {
    const memory = recordOptions
      .filter((records) => records >= defaultCosts.pageSize)
      .map(
        (records) =>
          estimateTransfer({ records, reading: "lazy", batchSize: 1 })
            .memoryNeededBytes,
      );
    expect(new Set(memory).size).toBe(1);
    const eager = recordOptions.map(
      (records) =>
        estimateTransfer({ records, reading: "eager", batchSize: 1 })
          .memoryNeededBytes,
    );
    expect(eager).toEqual([...eager].sort((a, b) => a - b));
  });

  it("holds the lazy cursor open for the whole transfer", () => {
    const lazy = estimateTransfer({
      records: 1_000_000,
      reading: "lazy",
      batchSize: 1,
    });
    expect(lazy.cursorOpenMs).toBe(lazy.durationMs);
    const eager = estimateTransfer({
      records: 100_000,
      reading: "eager",
      batchSize: 1,
    });
    expect(eager.cursorOpenMs).toBeLessThan(eager.durationMs);
  });

  it("trades fewer round trips for more buffered memory as batches grow", () => {
    const runs = batchOptions.map((batchSize) =>
      estimateTransfer({ records: 1_000_000, reading: "lazy", batchSize }),
    );
    for (let i = 1; i < runs.length; i++) {
      expect(runs[i]!.writeRoundTrips).toBeLessThan(
        runs[i - 1]!.writeRoundTrips,
      );
      expect(runs[i]!.durationMs).toBeLessThan(runs[i - 1]!.durationMs);
      expect(runs[i]!.memoryNeededBytes).toBeGreaterThan(
        runs[i - 1]!.memoryNeededBytes,
      );
    }
    // Per-record target work does not shrink, so savings flatten out.
    const last = runs.at(-1)!;
    expect(last.durationMs).toBeGreaterThan(
      1_000_000 * defaultCosts.writeCostMs,
    );
  });

  it("treats a batch of one as per-record writes", () => {
    const one = estimateTransfer({
      records: 5_000,
      reading: "lazy",
      batchSize: 1,
    });
    expect(one.writeRoundTrips).toBe(5_000);
  });

  it("normalizes nonsensical input", () => {
    const estimate = estimateTransfer({
      records: -3,
      reading: "lazy",
      batchSize: 0,
    });
    expect(estimate.plan).toEqual({
      records: 0,
      reading: "lazy",
      batchSize: 1,
    });
    expect(estimate.durationMs).toBe(0);
    expect(estimate.memoryNeededBytes).toBe(0);
  });
});

describe("transfer progress", () => {
  it("never writes more than it has read and ends at the estimate", () => {
    for (const plan of plans) {
      const estimate = estimateTransfer(plan);
      let previous = progressAt(estimate, 0);
      expect(previous.phase).toBe("idle");
      for (let step = 1; step <= 40; step++) {
        const now = progressAt(estimate, (estimate.durationMs * step) / 40);
        expect(now.recordsWritten).toBeLessThanOrEqual(now.recordsRead);
        expect(now.recordsWritten).toBeGreaterThanOrEqual(
          previous.recordsWritten,
        );
        expect(now.recordsRead).toBeGreaterThanOrEqual(previous.recordsRead);
        expect(now.memoryBytes).toBeLessThanOrEqual(
          Math.max(estimate.memoryNeededBytes, defaultCosts.memoryLimitBytes),
        );
        previous = now;
      }
      expect(previous.phase).toBe(
        estimate.outcome === "completed" ? "done" : "failed",
      );
      expect(previous.recordsWritten).toBe(estimate.recordsWritten);
    }
  });

  it("writes only in whole batches", () => {
    const estimate = estimateTransfer({
      records: 10_000,
      reading: "lazy",
      batchSize: 1_000,
    });
    for (const share of [0.05, 0.33, 0.5, 0.99]) {
      expect(
        progressAt(estimate, estimate.durationMs * share).recordsWritten %
          1_000,
      ).toBe(0);
    }
  });

  it("buffers the whole result set before an eager copy starts writing", () => {
    const estimate = estimateTransfer({
      records: 100_000,
      reading: "eager",
      batchSize: 1,
    });
    const reading = progressAt(estimate, estimate.readPhaseMs / 2);
    expect(reading.phase).toBe("reading");
    expect(reading.recordsWritten).toBe(0);
    const writing = progressAt(estimate, estimate.readPhaseMs + 1);
    expect(writing.phase).toBe("writing");
    expect(writing.memoryBytes).toBe(100_000 * defaultCosts.recordBytes);
  });
});
