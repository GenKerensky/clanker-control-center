import { createFileRoute } from "@tanstack/solid-router";
import { TokenTable, type Col } from "@client/components/tables/TokenTable.tsx";
import { clientName, colorFor } from "@client/lib/colors.ts";
import { useStatusQuery, useTuiQuery } from "@client/lib/data.ts";
import { fmtCost, fmtCostFull, fmtTok } from "@client/lib/format.ts";
import { validateSort } from "@client/lib/table-search.ts";
import { cachex, costPerM, tokensOf } from "../../shared/tokens.ts";
import type { TuiModel } from "../../shared/types.ts";

const columns: Col<TuiModel>[] = [
  {
    id: "model",
    header: "Model",
    width: "minmax(10rem, 1.6fr)",
    sortValue: (m) => m.model,
    cell: (m) => <span style={{ color: colorFor(m.model) }}>{m.model}</span>,
  },
  { id: "provider", header: "Provider", sortValue: (m) => m.provider, cell: (m) => m.provider },
  { id: "client", header: "Source", sortValue: (m) => m.client, cell: (m) => clientName(m.client) },
  {
    id: "input",
    header: "Input",
    num: true,
    sortValue: (m) => m.tokens.input,
    cell: (m) => fmtTok(m.tokens.input),
  },
  {
    id: "output",
    header: "Output",
    num: true,
    sortValue: (m) => m.tokens.output,
    cell: (m) => fmtTok(m.tokens.output),
  },
  {
    id: "cr",
    header: "Cache R",
    num: true,
    sortValue: (m) => m.tokens.cacheRead,
    cell: (m) => fmtTok(m.tokens.cacheRead),
  },
  {
    id: "cw",
    header: "Cache W",
    num: true,
    sortValue: (m) => m.tokens.cacheWrite,
    cell: (m) => fmtTok(m.tokens.cacheWrite),
  },
  {
    id: "cx",
    header: "Cachex",
    num: true,
    sortValue: (m) => cachex(m.tokens),
    cell: (m) => `${cachex(m.tokens).toFixed(1)}x`,
  },
  {
    id: "total",
    header: "Total",
    num: true,
    sortValue: (m) => tokensOf(m.tokens),
    cell: (m) => fmtTok(tokensOf(m.tokens)),
  },
  {
    id: "ms",
    header: "ms/1K",
    num: true,
    sortValue: (m) => m.performance?.msPer1KTokens ?? 0,
    cell: (m) =>
      m.performance?.msPer1KTokens != null ? `${Math.round(m.performance.msPer1KTokens)}ms` : "—",
  },
  { id: "cost", header: "Cost", num: true, sortValue: (m) => m.cost, cell: (m) => fmtCost(m.cost) },
  {
    id: "cpm",
    header: "Cost/1M",
    num: true,
    sortValue: (m) => costPerM(m.cost, tokensOf(m.tokens)),
    cell: (m) => fmtCostFull(costPerM(m.cost, tokensOf(m.tokens))),
  },
];

function ModelsPage() {
  const { sort, dir } = Route.useSearch()();
  const navigate = Route.useNavigate();
  const status = useStatusQuery();
  const tui = useTuiQuery(() => status.data ?? undefined);
  return (
    <TokenTable
      rows={tui.data?.data.models || []}
      columns={columns}
      sort={{ id: sort, desc: dir === "desc" }}
      onSort={(next) =>
        void navigate({ search: { sort: next.id, dir: next.desc ? "desc" : "asc" } })
      }
    />
  );
}

export const Route = createFileRoute("/models")({
  validateSearch: (s: Record<string, unknown>) => validateSort(s),
  component: ModelsPage,
});
