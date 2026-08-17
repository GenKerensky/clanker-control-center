import { For, Show, createMemo } from "solid-js";
import { createFileRoute } from "@tanstack/solid-router";
import { Bezel } from "@client/components/chrome/Bezel.tsx";
import { Bargraph } from "@client/components/chrome/Bargraph.tsx";
import { Meter } from "@client/components/chrome/Meter.tsx";
import { useStatusQuery, useUsageQuery } from "@client/lib/data.ts";
import { fmtReset } from "@client/lib/format.ts";
import { overallReadiness, readiness, remainingClass } from "../../shared/readiness.ts";
import type { Account } from "../../shared/types.ts";

function badge(status: ReturnType<typeof readiness>): string {
  if (status === "critical") return "Quota Low";
  if (status === "watch") return "Watch";
  if (status === "ready") return "Ready";
  return "—";
}

function AccountCard(props: { account: Account }) {
  const status = () => readiness(props.account);
  const ident = () =>
    [props.account.plan, props.account.email || props.account.account?.label || ""]
      .filter(Boolean)
      .join(" · ");
  const wide = () => typeof window === "undefined" || window.innerWidth >= 640;
  return (
    <Bezel>
      <div class="mb-3 flex items-start justify-between gap-3">
        <div>
          <div class="font-semibold">{props.account.provider}</div>
          <div class="text-xs text-[var(--muted)]">{ident()}</div>
        </div>
        <span
          class="rounded-full border px-2 py-1 text-[11px] font-semibold uppercase"
          style={{
            color:
              status() === "critical"
                ? "var(--crit)"
                : status() === "watch"
                  ? "var(--watch)"
                  : "var(--neon)",
            "border-color": "currentColor",
          }}
        >
          {badge(status())}
        </span>
      </div>
      <For each={props.account.metrics || []}>
        {(m) => {
          const left = () => Number(m.remaining_percent);
          const klass = () => remainingClass(left());
          return (
            <div class="mb-3">
              <div class="flex justify-between text-sm">
                <span>{m.label}</span>
                <span
                  style={{
                    color:
                      klass() === "critical"
                        ? "var(--crit)"
                        : klass() === "watch"
                          ? "var(--watch)"
                          : "var(--neon)",
                  }}
                >
                  {m.remaining_label || `${Math.round(left())}% left`}
                </span>
              </div>
              <Show
                when={wide()}
                fallback={<Bargraph remaining={left()} label={m.label} tone={klass()} />}
              >
                <Meter remaining={left()} label={m.label} tone={klass()} />
              </Show>
              <div class="mt-1 flex justify-between text-[11px] text-[var(--muted)]">
                <span>{Math.round(m.used_percent || 0)}% used</span>
                <span>{fmtReset(m.resets_at)}</span>
              </div>
            </div>
          );
        }}
      </For>
    </Bezel>
  );
}

function UsagePage() {
  const status = useStatusQuery();
  const usage = useUsageQuery(() => status.data ?? undefined);
  const accounts = () => usage.data?.accounts || [];
  const ready = createMemo(() => accounts().filter((a) => readiness(a) === "ready").length);
  const watch = createMemo(() => accounts().filter((a) => readiness(a) === "watch").length);
  const crit = createMemo(() => accounts().filter((a) => readiness(a) === "critical").length);
  const next = createMemo(
    () =>
      accounts()
        .flatMap((a) => (a.metrics || []).map((m) => ({ a, m })))
        .filter((x) => x.m.resets_at)
        .sort((x, y) => new Date(x.m.resets_at!).getTime() - new Date(y.m.resets_at!).getTime())[0],
  );

  return (
    <Show when={accounts().length} fallback={<p class="text-[var(--muted)]">No quota data yet.</p>}>
      <div class="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Bezel title="State">
          <div class="crt crt-scan px-2 py-1 text-lg">{overallReadiness(accounts())}</div>
        </Bezel>
        <Bezel title="Ready">
          <div class="crt crt-scan px-2 py-1 text-lg">
            {ready()} / {accounts().length}
          </div>
        </Bezel>
        <Bezel title="At risk">
          <div class="crt crt-scan px-2 py-1 text-lg">{watch() + crit()}</div>
        </Bezel>
        <Bezel title="Next reset">
          <div class="crt crt-scan px-2 py-1 text-sm">
            {next() ? `${next()!.a.provider} · ${fmtReset(next()!.m.resets_at)}` : "—"}
          </div>
        </Bezel>
      </div>
      <div class="grid gap-3 md:grid-cols-2">
        <For each={accounts()}>{(a) => <AccountCard account={a} />}</For>
      </div>
    </Show>
  );
}

export const Route = createFileRoute("/usage")({
  component: UsagePage,
});
