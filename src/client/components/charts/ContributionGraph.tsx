import { For } from "solid-js";
import { dateKeyInZone, fmtCost, BUCKET_TZ } from "@client/lib/format.ts";
import { Tooltip, TooltipContent, TooltipTrigger } from "@client/components/ui/tooltip.tsx";
import type { TuiDay } from "../../../shared/types.ts";

const GUTTER = 1;
const CELL = 11;

export function intensityFromCost(cost: number, maxCost: number): 0 | 1 | 2 | 3 | 4 {
  if (!cost) return 0;
  const p = cost / maxCost;
  if (p > 0.75) return 4;
  if (p > 0.45) return 3;
  if (p > 0.2) return 2;
  return 1;
}

export function heatmapStart(now = new Date(), tz = BUCKET_TZ): Date {
  const todayKey = dateKeyInZone(now, tz);
  const [y, m, d] = todayKey.split("-").map(Number);
  const todayNoon = Date.UTC(y, m - 1, d, 12, 0, 0);
  const startNoon = todayNoon - 364 * 86400000;
  const start = new Date(startNoon);
  start.setUTCDate(start.getUTCDate() - start.getUTCDay());
  return start;
}

export function ContributionGraph(props: { daily: TuiDay[] }) {
  const byDate = () => new Map(props.daily.map((d) => [d.date, d]));
  const maxCost = () => Math.max(1, ...props.daily.map((d) => d.cost || 0));
  const cells = () => {
    const start = heatmapStart();
    const days = byDate();
    const max = maxCost();
    const weeks: Array<Array<{ key: string; intensity: 0 | 1 | 2 | 3 | 4; cost: number | null }>> =
      [];
    const cur = new Date(start);
    for (let w = 0; w < 53; w++) {
      const week: (typeof weeks)[number] = [];
      for (let d = 0; d < 7; d++) {
        const key = cur.toISOString().slice(0, 10);
        const row = days.get(key);
        week.push({
          key,
          intensity: row ? intensityFromCost(row.cost, max) : 0,
          cost: row ? row.cost : null,
        });
        cur.setUTCDate(cur.getUTCDate() + 1);
      }
      weeks.push(week);
    }
    return weeks;
  };

  const fill = (i: number) => `var(--g${i})`;

  return (
    <div class="overflow-x-auto">
      <div class="inline-grid grid-cols-[28px_1fr] gap-1">
        <div
          class="grid grid-rows-7 gap-px text-[10px] text-[var(--muted)]"
          style={{ "row-gap": `${GUTTER}px` }}
        >
          <span />
          <span>Mon</span>
          <span />
          <span>Wed</span>
          <span />
          <span>Fri</span>
          <span />
        </div>
        <div class="flex" style={{ gap: `${GUTTER}px` }}>
          <For each={cells()}>
            {(week) => (
              <div class="grid grid-rows-7" style={{ gap: `${GUTTER}px` }}>
                <For each={week}>
                  {(cell) => (
                    <Tooltip>
                      <TooltipTrigger
                        as="div"
                        class="size-[11px] rounded-[1px]"
                        style={{
                          width: `${CELL}px`,
                          height: `${CELL}px`,
                          background: fill(cell.intensity),
                        }}
                      />
                      <TooltipContent>
                        {cell.key}
                        {cell.cost != null ? ` · ${fmtCost(cell.cost)}` : ""}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </For>
              </div>
            )}
          </For>
        </div>
      </div>
    </div>
  );
}
