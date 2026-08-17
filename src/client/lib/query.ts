import { QueryClient } from "@tanstack/solid-query";
import type { Status } from "../../shared/types.ts";

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}

export function statusPollMs(status: Status | null | undefined): number {
  if (!status) return 15_000;
  if (
    status.refreshing ||
    status.refreshingUsage ||
    status.refreshingSessions ||
    status.refreshingTui
  ) {
    return 2_500;
  }
  return 15_000;
}

export function anyRefreshing(status: Status | null | undefined): boolean {
  return !!(
    status?.refreshing ||
    status?.refreshingUsage ||
    status?.refreshingSessions ||
    status?.refreshingTui
  );
}
