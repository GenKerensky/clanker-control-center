import { createFileRoute } from "@tanstack/solid-router";
import { TokenTable, type Col } from "@client/components/tables/TokenTable.tsx";
import { clientName } from "@client/lib/colors.ts";
import { useStatusQuery, useTuiQuery } from "@client/lib/data.ts";
import { fmtCost, fmtTok } from "@client/lib/format.ts";
import { validateSort } from "@client/lib/table-search.ts";
import { tokensOf } from "../../shared/tokens.ts";
import type { TuiAgent } from "../../shared/types.ts";

const columns: Col<TuiAgent>[] = [
  { id: "agent", header: "Agent", sortValue: (a) => a.agent, cell: (a) => a.agent },
  {
    id: "source",
    header: "Source",
    sortValue: (a) => a.clients || "",
    cell: (a) =>
      (a.clients || "")
        .split(",")
        .map((s) => clientName(s.trim()))
        .join(", "),
  },
  {
    id: "total",
    header: "Tokens",
    num: true,
    sortValue: (a) => tokensOf(a.tokens),
    cell: (a) => fmtTok(tokensOf(a.tokens)),
  },
  { id: "cost", header: "Cost", num: true, sortValue: (a) => a.cost, cell: (a) => fmtCost(a.cost) },
  {
    id: "msgs",
    header: "Msgs",
    num: true,
    sortValue: (a) => a.messageCount || 0,
    cell: (a) => a.messageCount || 0,
  },
];

function AgentsPage() {
  const { sort, dir } = Route.useSearch()();
  const navigate = Route.useNavigate();
  const status = useStatusQuery();
  const tui = useTuiQuery(() => status.data ?? undefined);
  return (
    <TokenTable
      rows={tui.data?.data.agents || []}
      columns={columns}
      sort={{ id: sort, desc: dir === "desc" }}
      onSort={(next) =>
        void navigate({ search: { sort: next.id, dir: next.desc ? "desc" : "asc" } })
      }
    />
  );
}

export const Route = createFileRoute("/agents")({
  validateSearch: (s: Record<string, unknown>) => validateSort(s),
  component: AgentsPage,
});
