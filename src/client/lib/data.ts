import { useQuery, useQueryClient } from "@tanstack/solid-query";
import { createEffect } from "solid-js";
import { fetchSessions, fetchStatus, fetchTui, fetchUsage } from "./api.ts";
import { statusPollMs } from "./query.ts";
import type { Status } from "../../shared/types.ts";

export function useStatusQuery() {
  return useQuery(() => ({
    queryKey: ["status"],
    queryFn: fetchStatus,
    refetchInterval: (q) => statusPollMs(q.state.data ?? undefined),
  }));
}

export function useUsageQuery(status: () => Status | null | undefined) {
  return useQuery(() => ({
    queryKey: ["usage"],
    queryFn: fetchUsage,
    enabled: !!status()?.hasUsage,
  }));
}

export function useTuiQuery(status: () => Status | null | undefined) {
  return useQuery(() => ({
    queryKey: ["tui"],
    queryFn: fetchTui,
    enabled: !!status()?.hasTui,
  }));
}

export function useSessionsQuery(status: () => Status | null | undefined, enabled: () => boolean) {
  const qc = useQueryClient();
  let wasRefreshing = false;
  createEffect(() => {
    const s = status();
    const now = !!s?.refreshingSessions;
    if (wasRefreshing && !now) void qc.invalidateQueries({ queryKey: ["sessions"] });
    if (s && !s.refreshing && wasGraph(s)) void qc.invalidateQueries({ queryKey: ["sessions"] });
    wasRefreshing = now;
  });
  return useQuery(() => ({
    queryKey: ["sessions"],
    queryFn: fetchSessions,
    enabled: enabled() && !!status()?.hasSessions,
  }));
}

let lastGraph = false;
function wasGraph(s: Status): boolean {
  const prev = lastGraph;
  lastGraph = !!s.refreshing;
  return prev && !s.refreshing;
}
