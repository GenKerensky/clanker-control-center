import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Account, Metric } from "../shared/types.ts";
import type { Config } from "./config.ts";

export const OPENCODE_GO_USAGE_URL = "https://opencode.ai/zen/go/v1/usage";

export const OPENCODE_GO_WINDOWS = [
  ["rolling", "5h", 12.0],
  ["weekly", "Weekly", 30.0],
  ["monthly", "Monthly", 60.0],
] as const;

export function opencodeAuthPath(cfg: Config): string {
  return join(cfg.home, ".local/share/opencode/auth.json");
}

export function readOpencodeGoKey(doc: unknown): string | null {
  if (!doc || typeof doc !== "object") return null;
  const entry = (doc as Record<string, unknown>)["opencode-go"];
  if (!entry || typeof entry !== "object") return null;
  const key = (entry as Record<string, unknown>).key;
  if (typeof key === "string" && key.trim()) return key.trim();
  return null;
}

export function metricsFromGoUsage(usage: Record<string, unknown>): Metric[] {
  return OPENCODE_GO_WINDOWS.map(([windowKey, label, limit]) => {
    const raw = usage[windowKey];
    const window = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
    const used = Number(window.percent || 0);
    const remaining = Math.max(0, 100 - used);
    const resets = window.resetsAt;
    return {
      label,
      used_percent: used,
      remaining_percent: remaining,
      remaining_label: `$${((limit * remaining) / 100).toFixed(2)} left`,
      resets_at: typeof resets === "string" ? resets : null,
    };
  });
}

export function accountFromGoUsage(usage: Record<string, unknown>): Account {
  return {
    provider: "OpenCode Go",
    plan: "Go",
    email: null,
    metrics: metricsFromGoUsage(usage),
  };
}

export async function fetchOpencodeGo(cfg: Config): Promise<Account> {
  const raw = await readFile(opencodeAuthPath(cfg), "utf8");
  const key = readOpencodeGoKey(JSON.parse(raw));
  if (!key) throw new Error("no opencode-go API key in ~/.local/share/opencode/auth.json");

  const res = await fetch(OPENCODE_GO_USAGE_URL, {
    headers: {
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
      "User-Agent": "tokscale-dashboard/local",
    },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    throw new Error(`OpenCode Go usage HTTP ${res.status}: ${detail}`);
  }
  const payload = (await res.json()) as { usage?: unknown };
  if (!payload.usage || typeof payload.usage !== "object") {
    throw new Error("OpenCode Go usage response missing usage object");
  }
  return accountFromGoUsage(payload.usage as Record<string, unknown>);
}
