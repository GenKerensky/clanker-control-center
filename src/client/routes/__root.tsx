import { createEffect, createMemo, createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { createRootRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/solid-router";
import { useQueryClient } from "@tanstack/solid-query";
import { Chassis } from "@client/components/chrome/Chassis.tsx";
import { Led, jobTone } from "@client/components/chrome/Led.tsx";
import { ChassisSwitch } from "@client/components/chrome/Switch.tsx";
import { Alert, AlertDescription } from "@client/components/ui/alert.tsx";
import { Button } from "@client/components/ui/button.tsx";
import { Tooltip, TooltipContent, TooltipTrigger } from "@client/components/ui/tooltip.tsx";
import { Motion } from "@client/lib/motion.tsx";
import { postLogout, postRefresh, AuthError } from "@client/lib/api.ts";
import { useStatusQuery, useUsageQuery, useTuiQuery } from "@client/lib/data.ts";
import { fmtTime } from "@client/lib/format.ts";
import { anyRefreshing } from "@client/lib/query.ts";

const TABS = [
  { to: "/", label: "Overview" },
  { to: "/usage", label: "Usage" },
  { to: "/models", label: "Models" },
  { to: "/daily", label: "Daily" },
  { to: "/hourly", label: "Hourly" },
  { to: "/monthly", label: "Monthly" },
  { to: "/sessions", label: "Sessions" },
  { to: "/stats", label: "Stats" },
  { to: "/agents", label: "Agents" },
] as const;

const MOBILE_TABS = [
  { to: "/", label: "Overview" },
  { to: "/usage", label: "Usage" },
  { to: "/sessions", label: "Sessions" },
  { to: "/stats", label: "Stats" },
  { to: "/models", label: "More" },
] as const;

function bannerOf(
  status: ReturnType<typeof useStatusQuery>["data"],
): { text: string; variant: "warning" | "destructive" | "default" } | null {
  if (!status) return null;
  if (status.refreshingUsage) return { text: "Refreshing quotas…", variant: "warning" };
  if (status.refreshing) return { text: "Rescanning local history…", variant: "warning" };
  if (status.refreshingTui) return { text: "Writing TUI cache…", variant: "warning" };
  if (status.refreshingSessions) return { text: "Loading sessions…", variant: "warning" };
  if (status.usageError) return { text: status.usageError, variant: "destructive" };
  if (status.error) return { text: status.error, variant: "destructive" };
  if (status.sessionsError) return { text: status.sessionsError, variant: "destructive" };
  if (status.tuiError) return { text: status.tuiError, variant: "destructive" };
  return null;
}

function RootChrome() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const qc = useQueryClient();
  const statusQuery = useStatusQuery();
  const usageQuery = useUsageQuery(() => statusQuery.data ?? undefined);
  const tuiQuery = useTuiQuery(() => statusQuery.data ?? undefined);
  const [actionsOpen, setActionsOpen] = createSignal(false);
  const [offline, setOffline] = createSignal(typeof navigator !== "undefined" && !navigator.onLine);

  onMount(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    onCleanup(() => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    });
  });

  createEffect(() => {
    const err = statusQuery.error;
    if (err instanceof AuthError) void navigate({ to: "/login" });
    const s = statusQuery.data;
    if (s?.authEnabled && !s.authenticated && pathname() !== "/login") {
      void navigate({ to: "/login" });
    }
    if (s && !s.authEnabled && pathname() === "/login") {
      void navigate({ to: "/" });
    }
  });

  const stamp = createMemo(() => {
    const usage = usageQuery.data;
    const tui = tuiQuery.data;
    if (usage?.fetchedAt) return `Quotas ${fmtTime(usage.fetchedAt)}`;
    const n = tui?.data.models.length || 0;
    return n ? `${n} models` : "";
  });

  const busy = () => anyRefreshing(statusQuery.data ?? undefined);

  const kick = async (kind: "usage" | "graph") => {
    try {
      await postRefresh(kind);
      await qc.invalidateQueries({ queryKey: ["status"] });
    } catch (err) {
      if (err instanceof AuthError) void navigate({ to: "/login" });
    }
  };

  const logout = async () => {
    await postLogout();
    await qc.invalidateQueries({ queryKey: ["status"] });
    void navigate({ to: "/login" });
  };

  const banner = () => bannerOf(statusQuery.data);
  const s = () => statusQuery.data;

  return (
    <Chassis>
      <header class="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1
            class="m-0 font-mono text-[15px] font-semibold tracking-wide text-[var(--neon)]"
            style={{ "text-shadow": "var(--glow-text)" }}
          >
            Clanker Control Center
          </h1>
          <Tooltip>
            <TooltipTrigger class="block text-left text-[11px] text-[var(--muted)]">
              {stamp()}
            </TooltipTrigger>
            <TooltipContent>
              Graph {fmtTime(s()?.generatedAt)} · TUI {fmtTime(s()?.tuiTimestamp)}
            </TooltipContent>
          </Tooltip>
        </div>
        <div class="hidden items-center gap-2 md:flex">
          <div
            class="flex gap-3 pr-2"
            title="Background job lamps: green ready, amber running, red failed"
          >
            <Led
              label="quotas"
              tone={jobTone(!!s()?.refreshingUsage, s()?.usageError, s()?.hasUsage)}
            />
            <Led label="history" tone={jobTone(!!s()?.refreshing, s()?.error, s()?.hasData)} />
            <Led
              label="sessions"
              tone={jobTone(!!s()?.refreshingSessions, s()?.sessionsError, s()?.hasSessions)}
            />
            <Led label="tui" tone={jobTone(!!s()?.refreshingTui, s()?.tuiError, s()?.hasTui)} />
          </div>
          <ChassisSwitch
            label="Refresh quotas"
            disabled={busy()}
            onPress={() => void kick("usage")}
          />
          <ChassisSwitch
            label="Rescan history"
            disabled={busy()}
            onPress={() => void kick("graph")}
          />
          <Show when={s()?.authEnabled && s()?.user}>
            <img
              src={s()!.user!.avatarUrl}
              alt={s()!.user!.login}
              class="size-8 rounded-full border border-[var(--bezel)]"
            />
            <Button variant="ghost" size="sm" onClick={() => void logout()}>
              Logout
            </Button>
          </Show>
        </div>
        <div class="flex items-center gap-2 md:hidden">
          <Led
            label="jobs"
            tone={jobTone(
              !!s()?.refreshingUsage ||
                !!s()?.refreshing ||
                !!s()?.refreshingSessions ||
                !!s()?.refreshingTui,
              s()?.usageError || s()?.error || s()?.sessionsError || s()?.tuiError,
              !!s()?.hasUsage,
            )}
          />
          <Button
            variant="chassis"
            size="sm"
            class="min-h-11"
            onClick={() => setActionsOpen((v) => !v)}
          >
            Actions
          </Button>
        </div>
      </header>

      <Show when={actionsOpen()}>
        <div class="mb-3 flex flex-col gap-2 rounded-[var(--r-plate)] border border-[var(--bezel)] bg-[var(--bg-plate)] p-3 md:hidden">
          <ChassisSwitch
            label="Refresh quotas"
            disabled={busy()}
            onPress={() => void kick("usage")}
          />
          <ChassisSwitch
            label="Rescan history"
            disabled={busy()}
            onPress={() => void kick("graph")}
          />
        </div>
      </Show>

      <nav class="mb-3 flex gap-1 overflow-x-auto border-b border-[var(--hairline)] pb-0">
        <For each={TABS}>
          {(tab) => {
            const active = () =>
              tab.to === "/" ? pathname() === "/" : pathname().startsWith(tab.to);
            return (
              <Link
                to={tab.to}
                class="min-h-11 shrink-0 px-3 py-2 text-[13px] tracking-[0.08em] uppercase"
                style={{
                  color: active() ? "var(--neon)" : "var(--muted)",
                  "border-bottom": active() ? "2px solid var(--neon)" : "2px solid transparent",
                  "box-shadow": active() ? "inset 0 2px 6px rgba(0,0,0,0.55)" : "none",
                  "text-shadow": active() ? "var(--glow-text)" : "none",
                }}
              >
                {tab.label}
              </Link>
            );
          }}
        </For>
      </nav>

      <Show when={offline()}>
        <Alert variant="default" class="mb-3">
          <AlertDescription>Chassis offline — last quotas {stamp() || "unknown"}.</AlertDescription>
        </Alert>
      </Show>
      <Show when={banner()}>
        {(b) => (
          <Motion initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} class="mb-3">
            <Alert variant={b().variant}>
              <AlertDescription>{b().text}</AlertDescription>
            </Alert>
          </Motion>
        )}
      </Show>

      <Motion initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <Outlet />
      </Motion>

      <nav class="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-[var(--bezel)] bg-[var(--bg-chassis)] pb-[env(safe-area-inset-bottom)] md:hidden">
        <For each={MOBILE_TABS}>
          {(tab) => {
            const active = () =>
              tab.to === "/" ? pathname() === "/" : pathname().startsWith(tab.to);
            return (
              <Link
                to={tab.to}
                class="flex min-h-11 min-w-11 flex-1 items-center justify-center text-[11px] uppercase"
                style={{ color: active() ? "var(--neon)" : "var(--muted)" }}
              >
                {tab.label}
              </Link>
            );
          }}
        </For>
      </nav>
      <div class="h-14 md:hidden" />
    </Chassis>
  );
}

export const Route = createRootRoute({
  component: RootChrome,
});
