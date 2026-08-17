import { Show } from "solid-js";
import { createFileRoute } from "@tanstack/solid-router";
import { Bezel } from "@client/components/chrome/Bezel.tsx";
import { ContributionGraph } from "@client/components/charts/ContributionGraph.tsx";
import { useStatusQuery, useTuiQuery } from "@client/lib/data.ts";
import { fmtCost, fmtCostFull, fmtTok } from "@client/lib/format.ts";

function StatsPage() {
  const status = useStatusQuery();
  const tui = useTuiQuery(() => status.data ?? undefined);
  const data = () => tui.data?.data;
  return (
    <Show when={data()} fallback={<p class="text-[var(--muted)]">No TUI cache yet.</p>}>
      {(d) => {
        const fav = () =>
          d()
            .models.slice()
            .sort((a, b) => b.cost - a.cost)[0];
        return (
          <div class="grid gap-4">
            <Bezel title="Contribution graph (53 weeks)">
              <ContributionGraph daily={d().daily} />
            </Bezel>
            <div class="grid grid-cols-2 gap-3 lg:grid-cols-3">
              <Bezel title="Favorite model">
                <div class="crt crt-scan px-2 py-1">{fav()?.model || "—"}</div>
              </Bezel>
              <Bezel title="Active days">
                <div class="crt crt-scan px-2 py-1">{d().daily.length}</div>
              </Bezel>
              <Bezel title="Current streak">
                <div class="crt crt-scan px-2 py-1">{d().currentStreak || 0} days</div>
              </Bezel>
              <Bezel title="Longest streak">
                <div class="crt crt-scan px-2 py-1">{d().longestStreak || 0} days</div>
              </Bezel>
              <Bezel title="Total tokens">
                <div class="crt crt-scan px-2 py-1">{fmtTok(d().totalTokens)}</div>
              </Bezel>
              <Bezel title="Total cost">
                <div class="crt crt-scan px-2 py-1">{fmtCost(d().totalCost)}</div>
              </Bezel>
            </div>
            <p class="text-[var(--muted)]">
              Your total spending is {fmtCostFull(d().totalCost)} on AI coding assistants!
            </p>
          </div>
        );
      }}
    </Show>
  );
}

export const Route = createFileRoute("/stats")({
  component: StatsPage,
});
