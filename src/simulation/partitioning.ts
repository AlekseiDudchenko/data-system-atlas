/** Fixed modulo routing and equal-cost request counters; no clocks, storage or I/O. */
export const KEYS = Array.from({ length: 12 }, (_, key) => key);
export const PARTITIONS = [0, 1, 2] as const;
export const CAPACITY = 4;
export type Workload = "even" | "hot";
export type Load = Readonly<{
  received: number;
  completed: number;
  queued: number;
}>;
export type PartitionState = Readonly<{
  step: number;
  workload: Workload;
  hotKey: number;
  loads: readonly Load[];
  lastArrivals: readonly number[];
}>;
export type PartitionEvent =
  | { type: "workload"; workload: Workload }
  | { type: "hot-key"; key: number }
  | { type: "batch" }
  | { type: "drain" }
  | { type: "reset" };
export const owner = (key: number) => key % PARTITIONS.length;
export function initialPartitioning(
  workload: Workload = "even",
  hotKey = 0,
): PartitionState {
  return {
    step: 0,
    workload,
    hotKey,
    loads: PARTITIONS.map(() => ({ received: 0, completed: 0, queued: 0 })),
    lastArrivals: PARTITIONS.map(() => 0),
  };
}
export function workloadKeys(
  workload: Workload,
  hotKey: number,
): readonly number[] {
  return workload === "even"
    ? KEYS
    : [
        ...Array<number>(9).fill(hotKey),
        (hotKey + 1) % KEYS.length,
        (hotKey + 2) % KEYS.length,
        (hotKey + 3) % KEYS.length,
      ];
}
export function partitionTransition(
  state: PartitionState,
  event: PartitionEvent,
): PartitionState {
  if (event.type === "reset")
    return initialPartitioning(state.workload, state.hotKey);
  if (event.type === "workload")
    return initialPartitioning(event.workload, state.hotKey);
  if (event.type === "hot-key") {
    if (!Number.isInteger(event.key) || !KEYS.includes(event.key)) return state;
    return initialPartitioning(state.workload, event.key);
  }
  const arrivals = PARTITIONS.map(() => 0);
  if (event.type === "batch")
    for (const key of workloadKeys(state.workload, state.hotKey))
      arrivals[owner(key)]!++;
  return {
    ...state,
    step: state.step + 1,
    lastArrivals: arrivals,
    loads: state.loads.map((load, id) => {
      const received = arrivals[id]!;
      const completed = Math.min(load.queued + received, CAPACITY);
      return {
        received: load.received + received,
        completed: load.completed + completed,
        queued: load.queued + received - completed,
      };
    }),
  };
}
