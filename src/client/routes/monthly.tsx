import { createMemo } from "solid-js";
import { createFileRoute } from "@tanstack/solid-router";
import { TokenTable, type Col } from "@client/components/tables/TokenTable.tsx";
import { useStatusQuery, useTuiQuery } from "@client/lib/data.ts";
import { fmtCost, fmtCostFull, fmtTok } from "@client/lib/format.ts";
import { validateSort } from "@client/lib/table-search.ts";
import { addTokens, cachex, costPerM, emptyTokens, tokensOf } from "../../shared/tokens.ts";
import type { TokenBreakdown } from "../../shared/types.ts";

interface MonthRow {
  month: string;
  turn: number;
  msgs: number;
  tokens: TokenBreakdown;
  cost: number;
}

const columns: Col<MonthRow>[] = [
  { id: "month", header: "Month", sortValue: (r) => r.month, cell: (r) => r.month },
  { id: "turn", header: "Turn", num: true, sortValue: (r) => r.turn, cell: (r) => r.turn || "—" },
  { id: "msgs", header: "Msgs", num: true, sortValue: (r) => r.msgs, cell: (r) => r.msgs },
  {
    id: "input",
    header: "Input",
    num: true,
    sortValue: (r) => r.tokens.input,
    cell: (r) => fmtTok(r.tokens.input),
  },
  {
    id: "output",
    header: "Output",
    num: true,
    sortValue: (r) => r.tokens.output,
    cell: (r) => fmtTok(r.tokens.output),
  },
  {
    id: "cr",
    header: "Cache R",
    num: true,
    sortValue: (r) => r.tokens.cacheRead,
    cell: (r) => fmtTok(r.tokens.cacheRead),
  },
  {
    id: "cw",
    header: "Cache W",
    num: true,
    sortValue: (r) => r.tokens.cacheWrite,
    cell: (r) => fmtTok(r.tokens.cacheWrite),
  },
  {
    id: "cx",
    header: "Cachex",
    num: true,
    sortValue: (r) => cachex(r.tokens),
    cell: (r) => `${cachex(r.tokens).toFixed(1)}x`,
  },
  {
    id: "total",
    header: "Total",
    num: true,
    sortValue: (r) => tokensOf(r.tokens),
    cell: (r) => fmtTok(tokensOf(r.tokens)),
  },
  { id: "cost", header: "Cost", num: true, sortValue: (r) => r.cost, cell: (r) => fmtCost(r.cost) },
  {
    id: "cpm",
    header: "Cost/1M",
    num: true,
    sortValue: (r) => costPerM(r.cost, tokensOf(r.tokens)),
    cell: (r) => fmtCostFull(costPerM(r.cost, tokensOf(r.tokens))),
  },
];

function MonthlyPage() {
  const { sort, dir } = Route.useSearch()();
  const navigate = Route.useNavigate();
  const status = useStatusQuery();
  const tui = useTuiQuery(() => status.data ?? undefined);
  const rows = createMemo(() => {
    const map = new Map<string, MonthRow>();
    for (const d of tui.data?.data.daily || []) {
      const m = d.date.slice(0, 7);
      const cur = map.get(m) || { month: m, turn: 0, msgs: 0, tokens: emptyTokens(), cost: 0 };
      cur.turn += d.turnCount || 0;
      cur.msgs += d.messageCount || 0;
      cur.cost += d.cost || 0;
      addTokens(cur.tokens, d.tokens);
      map.set(m, cur);
    }
    return [...map.values()];
  });
  return (
    <TokenTable
      rows={rows()}
      columns={columns}
      sort={{ id: sort, desc: dir === "desc" }}
      onSort={(next) =>
        void navigate({ search: { sort: next.id, dir: next.desc ? "desc" : "asc" } })
      }
    />
  );
}

export const Route = createFileRoute("/monthly")({
  validateSearch: (s: Record<string, unknown>) => validateSort(s, "month"),
  component: MonthlyPage,
});
