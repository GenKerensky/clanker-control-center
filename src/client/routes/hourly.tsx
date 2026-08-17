import { createFileRoute } from "@tanstack/solid-router";
import { TokenTable, type Col } from "@client/components/tables/TokenTable.tsx";
import { clientName } from "@client/lib/colors.ts";
import { useStatusQuery, useTuiQuery } from "@client/lib/data.ts";
import { fmtCost, fmtCostFull, fmtTok } from "@client/lib/format.ts";
import { validateSort } from "@client/lib/table-search.ts";
import { cachex, costPerM, tokensOf } from "../../shared/tokens.ts";
import type { TuiHour } from "../../shared/types.ts";

const columns: Col<TuiHour>[] = [
  {
    id: "hour",
    header: "Hour",
    sortValue: (h) => h.datetime,
    cell: (h) => `${h.datetime.slice(5, 10)} ${h.datetime.slice(11, 16)}`,
  },
  {
    id: "source",
    header: "Source",
    sortValue: (h) => (h.clients || []).join(","),
    cell: (h) => (h.clients || []).map(clientName).join(", "),
  },
  {
    id: "turn",
    header: "Turn",
    num: true,
    sortValue: (h) => h.turnCount || 0,
    cell: (h) => h.turnCount || "—",
  },
  {
    id: "msgs",
    header: "Msgs",
    num: true,
    sortValue: (h) => h.messageCount || 0,
    cell: (h) => h.messageCount || 0,
  },
  {
    id: "input",
    header: "Input",
    num: true,
    sortValue: (h) => h.tokens.input,
    cell: (h) => fmtTok(h.tokens.input),
  },
  {
    id: "output",
    header: "Output",
    num: true,
    sortValue: (h) => h.tokens.output,
    cell: (h) => fmtTok(h.tokens.output),
  },
  {
    id: "cr",
    header: "Cache R",
    num: true,
    sortValue: (h) => h.tokens.cacheRead,
    cell: (h) => fmtTok(h.tokens.cacheRead),
  },
  {
    id: "cw",
    header: "Cache W",
    num: true,
    sortValue: (h) => h.tokens.cacheWrite,
    cell: (h) => fmtTok(h.tokens.cacheWrite),
  },
  {
    id: "cx",
    header: "Cachex",
    num: true,
    sortValue: (h) => cachex(h.tokens),
    cell: (h) => `${cachex(h.tokens).toFixed(1)}x`,
  },
  {
    id: "total",
    header: "Total",
    num: true,
    sortValue: (h) => tokensOf(h.tokens),
    cell: (h) => fmtTok(tokensOf(h.tokens)),
  },
  { id: "cost", header: "Cost", num: true, sortValue: (h) => h.cost, cell: (h) => fmtCost(h.cost) },
  {
    id: "cpm",
    header: "Cost/1M",
    num: true,
    sortValue: (h) => costPerM(h.cost, tokensOf(h.tokens)),
    cell: (h) => fmtCostFull(costPerM(h.cost, tokensOf(h.tokens))),
  },
];

function HourlyPage() {
  const { sort, dir } = Route.useSearch()();
  const navigate = Route.useNavigate();
  const status = useStatusQuery();
  const tui = useTuiQuery(() => status.data ?? undefined);
  return (
    <TokenTable
      rows={tui.data?.data.hourly || []}
      columns={columns}
      sort={{ id: sort, desc: dir === "desc" }}
      onSort={(next) =>
        void navigate({ search: { sort: next.id, dir: next.desc ? "desc" : "asc" } })
      }
    />
  );
}

export const Route = createFileRoute("/hourly")({
  validateSearch: (s: Record<string, unknown>) => validateSort(s, "hour"),
  component: HourlyPage,
});
