import type { SessionEntry } from "../../shared/types.ts";

export function fmtTok(n: number): string {
  n = Number(n) || 0;
  const a = Math.abs(n);
  if (a >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (a >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (a >= 1e3) return (n / 1e3).toFixed(0) + "K";
  return String(Math.round(n));
}

export function fmtCost(n: number): string {
  n = Number(n) || 0;
  if (Math.abs(n) >= 1000) return "$" + (n / 1000).toFixed(1) + "K";
  return "$" + n.toFixed(2);
}

export function fmtCostFull(n: number): string {
  return "$" + (Number(n) || 0).toFixed(2);
}

export function fmtTime(iso: string | number | null | undefined): string {
  if (iso == null || iso === "") return "never";
  const d = typeof iso === "number" ? new Date(iso) : new Date(iso);
  return Number.isNaN(d.getTime()) ? String(iso) : d.toLocaleString();
}

export function fmtReset(iso: string | null | undefined): string {
  if (!iso) return "no reset";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const m = Math.round((d.getTime() - Date.now()) / 60000);
  if (m <= 0) return "resets now";
  if (m < 60) return `resets in ${m}m`;
  if (m < 36 * 60) return `resets in ${Math.round(m / 60)}h`;
  return (
    "resets " +
    d.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  );
}

export function lastActiveMs(e: SessionEntry): number {
  const raw = e.lastSeen ?? e.last_seen ?? e.lastActive ?? e.last_active;
  if (raw != null && raw !== "") {
    const n = Number(raw);
    if (Number.isFinite(n) && n > 1e12) return n;
    if (Number.isFinite(n) && n > 1e9) return n * 1000;
    const d = Date.parse(String(raw));
    if (!Number.isNaN(d)) return d;
  }
  const id = String(e.sessionId || e.session || "");
  const rollout = id.match(/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/);
  if (rollout) {
    const d = Date.parse(rollout[1].replace(/T(\d{2})-(\d{2})-(\d{2})/, "T$1:$2:$3"));
    if (!Number.isNaN(d)) return d;
  }
  const hex = id.replace(/-/g, "");
  if (/^[0-9a-f]{32}$/i.test(hex)) {
    const ms = parseInt(hex.slice(0, 12), 16);
    if (ms > 1e12 && ms < 2e12) return ms;
  }
  return 0;
}

export function fmtLastActive(e: SessionEntry): string {
  const ms = lastActiveMs(e);
  if (!ms) return "—";
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export const BUCKET_TZ = "America/New_York";

export function dateKeyInZone(d: Date, tz = BUCKET_TZ): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}
