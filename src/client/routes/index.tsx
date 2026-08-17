import { For, Show } from "solid-js";
import { createFileRoute } from "@tanstack/solid-router";
import { Bezel } from "@client/components/chrome/Bezel.tsx";
import { StackedDayBars } from "@client/components/charts/StackedDayBars.tsx";
import { colorFor } from "@client/lib/colors.ts";
import { useStatusQuery, useTuiQuery } from "@client/lib/data.ts";
import { fmtCost, fmtTok } from "@client/lib/format.ts";
import { tokensOf } from "../../shared/tokens.ts";

function OverviewPage() {
  const status = useStatusQuery();
  const tui = useTuiQuery(() => status.data ?? undefined);
  const data = () => tui.data?.data;
  const writeCache = status.data?.jobs?.tui !== undefined;

  return (
    <Show
      when={data()}
      fallback={
        <p class="text-[var(--muted)]">
          No TUI cache yet. Open <code>tokscale tui</code> once, or Rescan history
          {writeCache ? " (writes the TUI cache)" : ""}.
        </p>
      }
    >
      {(d) => {
        const models = () =>
          d()
            .models.slice()
            .sort((a, b) => b.cost - a.cost);
        return (
          <div class="grid gap-4">
            <Bezel title="Tokens per day">
              <StackedDayBars daily={d().daily} models={d().models} />
            </Bezel>
            <Bezel title="Models by cost">
              <div class="mb-2 flex justify-end text-xs text-[var(--muted)]">
                Total {fmtCost(d().totalCost)}
              </div>
              <ul class="m-0 list-none p-0">
                <For each={models().slice(0, 16)}>
                  {(m) => {
                    const tot = tokensOf(m.tokens);
                    const pct = d().totalCost ? (m.cost / d().totalCost) * 100 : 0;
                    return (
                      <li class="border-b border-[var(--hairline)] py-2">
                        <span
                          class="mr-2 inline-block size-2 rounded-full"
                          style={{ background: colorFor(m.model) }}
                        />
                        <b>{m.model}</b>{" "}
                        <span class="text-[var(--muted)]">({pct.toFixed(1)}%)</span>
                        <div class="text-[12px] text-[var(--muted)]">
                          In {fmtTok(m.tokens.input)} · Out {fmtTok(m.tokens.output)} · CR{" "}
                          {fmtTok(m.tokens.cacheRead)} · CW {fmtTok(m.tokens.cacheWrite)} ·{" "}
                          {fmtTok(tot)} · {fmtCost(m.cost)}
                        </div>
                      </li>
                    );
                  }}
                </For>
              </ul>
            </Bezel>
          </div>
        );
      }}
    </Show>
  );
}

export const Route = createFileRoute("/")({
  component: OverviewPage,
});
