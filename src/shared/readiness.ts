import type { Account, Metric, ReadinessLevel } from "./types.ts";

export function remainingClass(pct: number): Exclude<ReadinessLevel, "unknown"> {
  if (pct < 10) return "critical";
  if (pct < 25) return "watch";
  return "ready";
}

export function metricReadiness(metric: Metric): Exclude<ReadinessLevel, "unknown"> {
  return remainingClass(Number(metric.remaining_percent));
}

export function readiness(account: Account): ReadinessLevel {
  const metrics = account.metrics || [];
  if (!metrics.length) return "unknown";
  return remainingClass(Math.min(...metrics.map((m) => Number(m.remaining_percent))));
}

export function overallReadiness(
  accounts: Account[],
): "Quota low" | "Ready with warnings" | "Ready" {
  const levels = accounts.map(readiness);
  if (levels.some((l) => l === "critical")) return "Quota low";
  if (levels.some((l) => l === "watch")) return "Ready with warnings";
  return "Ready";
}
