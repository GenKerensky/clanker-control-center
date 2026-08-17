import type {
  RefreshResponse,
  SessionsReport,
  Status,
  TuiCache,
  UsagePayload,
} from "../../shared/types.ts";

export class AuthError extends Error {
  override name = "AuthError";
}

async function request<T>(url: string, init?: RequestInit): Promise<T | null> {
  const res = await fetch(url, {
    credentials: "include",
    cache: "no-store",
    ...init,
    headers: Object.assign({ Accept: "application/json" }, init?.headers),
  });
  if (res.status === 401) throw new AuthError("unauthorized");
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `${res.status} ${url}`);
  }
  if (res.status === 204) return null;
  return (await res.json()) as T;
}

export function fetchStatus(): Promise<Status | null> {
  return request<Status>("/api/status");
}

export function fetchUsage(): Promise<UsagePayload | null> {
  return request<UsagePayload>("/api/usage");
}

export function fetchTui(): Promise<TuiCache | null> {
  return request<TuiCache>("/api/tui");
}

export function fetchSessions(): Promise<SessionsReport | null> {
  return request<SessionsReport>("/api/sessions");
}

export function postRefresh(kind: "usage" | "graph" | "sessions"): Promise<RefreshResponse | null> {
  return request<RefreshResponse>(`/api/refresh/${kind}`, { method: "POST" });
}

export function postLogout(): Promise<null> {
  return request<null>("/auth/logout", { method: "POST" });
}
