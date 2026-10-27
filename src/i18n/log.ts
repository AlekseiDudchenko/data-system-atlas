import type { LogEntry } from "../simulation/replication";
import { translator, type Locale } from "./index";

export function formatLog(entry: LogEntry, locale: Locale): string {
  const t = translator(locale);
  let message: string;
  switch (entry.type) {
    case "initial":
      message = t("All replicas begin at v0: “{0}”.", entry.value);
      break;
    case "write":
      message = t(
        "Leader accepted v{0}: “{1}”. Two updates queued.",
        entry.version,
        entry.value,
      );
      break;
    case "read":
      message = t(
        "Read follower {0}: “{1}” (v{2}) — {3} at read time.",
        entry.target,
        entry.value,
        entry.version,
        t(entry.stale ? "Stale read" : "Current read"),
      );
      break;
    case "block":
      message = t(
        "Replication to {0} {1}. Queued updates are retained.",
        entry.target,
        t(entry.blocked ? "blocked" : "restored"),
      );
      break;
    case "delivery":
      message = entry.count
        ? t(
            "Delivered {0} update(s), in write order per follower.",
            entry.count,
          )
        : t(
            "No updates delivered. Links may be blocked or messages are not due yet.",
          );
      break;
  }
  return t("Step {0} · {1}", entry.step, message);
}
