import { createFileRoute } from "@tanstack/solid-router";
import { TokenTable, type Col } from "@client/components/tables/TokenTable.tsx";
import { useStatusQuery, useTuiQuery } from "@client/lib/data.ts";
import { fmtCost, fmtCostFull, fmtTok } from "@client/lib/format.ts";
import { validateSort } from "@client/lib/table-search.ts";
import { cachex, costPerM, tokensOf } from "../../shared/tokens.ts";
import type { TuiDay } from "../../shared/types.ts";

const columns: Col<TuiDay>[] = [
  { id: "date", header: "Date", sortValue: (d) => d.date, cell: (d) => d.date.slice(5) },
  {
    id: "turn",
    header: "Turn",
    num: true,
    sortValue: (d) => d.turnCount || 0,
    cell: (d) => d.turnCount || "—",
  },
  {
    id: "msgs",
    header: "Msgs",
    num: true,
    sortValue: (d) => d.messageCount || 0,
    cell: (d) => d.messageCount || 0,
  },
  {
    id: "input",
    header: "Input",
    num: true,
    sortValue: (d) => d.tokens.input,
    cell: (d) => <span class="c-in">{fmtTok(d.tokens.input)}</span>,
  },
  {
    id: "output",
    header: "Output",
    num: true,
    sortValue: (d) => d.tokens.output,
    cell: (d) => <span class="c-out">{fmtTok(d.tokens.output)}</span>,
  },
  {
    id: "cr",
    header: "Cache R",
    num: true,
    sortValue: (d) => d.tokens.cacheRead,
    cell: (d) => <span class="c-cr">{fmtTok(d.tokens.cacheRead)}</span>,
  },
  {
    id: "cw",
    header: "Cache W",
    num: true,
    sortValue: (d) => d.tokens.cacheWrite,
    cell: (d) => <span class="c-cw">{fmtTok(d.tokens.cacheWrite)}</span>,
  },
  {
    id: "cx",
    header: "Cachex",
    num: true,
    sortValue: (d) => cachex(d.tokens),
    cell: (d) => <span class="c-cx">{cachex(d.tokens).toFixed(1)}x</span>,
  },
  {
    id: "total",
    header: "Total",
    num: true,
    sortValue: (d) => tokensOf(d.tokens),
    cell: (d) => <span class="c-tot">{fmtTok(tokensOf(d.tokens))}</span>,
  },
  {
    id: "cost",
    header: "Cost",
    num: true,
    sortValue: (d) => d.cost,
    cell: (d) => <span class="c-cost">{fmtCost(d.cost)}</span>,
  },
  {
    id: "cpm",
    header: "Cost/1M",
    num: true,
    sortValue: (d) => costPerM(d.cost, tokensOf(d.tokens)),
    cell: (d) => <span class="c-cpm">{fmtCostFull(costPerM(d.cost, tokensOf(d.tokens)))}</span>,
  },
];

function DailyPage() {
  const { sort, dir } = Route.useSearch()();
  const navigate = Route.useNavigate();
  const status = useStatusQuery();
  const tui = useTuiQuery(() => status.data ?? undefined);
  return (
    <TokenTable
      rows={tui.data?.data.daily || []}
      columns={columns}
      sort={{ id: sort, desc: dir === "desc" }}
      onSort={(next) =>
        void navigate({ search: { sort: next.id, dir: next.desc ? "desc" : "asc" } })
      }
    />
  );
}

export const Route = createFileRoute("/daily")({
  validateSearch: (s: Record<string, unknown>) => validateSort(s),
  component: DailyPage,
});
