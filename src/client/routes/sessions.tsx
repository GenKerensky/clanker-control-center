import { createEffect, createMemo, createSignal, Show } from "solid-js";
import { createFileRoute } from "@tanstack/solid-router";
import { TokenTable, type Col } from "@client/components/tables/TokenTable.tsx";
import { clientName, colorFor } from "@client/lib/colors.ts";
import { useSessionsQuery, useStatusQuery } from "@client/lib/data.ts";
import { fmtCost, fmtLastActive, fmtTok, lastActiveMs } from "@client/lib/format.ts";
import { postRefresh } from "@client/lib/api.ts";
import { validateSort } from "@client/lib/table-search.ts";
import type { SessionEntry } from "../../shared/types.ts";

const columns: Col<SessionEntry>[] = [
  {
    id: "session",
    header: "Session",
    sortValue: (e) => e.sessionId || e.session || "",
    cell: (e) => {
      const id = e.sessionId || e.session || "";
      return (
        <span title={id}>
          {id.slice(0, 28)}
          {id.length > 28 ? "…" : ""}
        </span>
      );
    },
  },
  { id: "client", header: "Client", sortValue: (e) => e.client, cell: (e) => clientName(e.client) },
  {
    id: "model",
    header: "Model",
    sortValue: (e) => e.model || "",
    cell: (e) => <span style={{ color: colorFor(e.model || "") }}>{e.model}</span>,
  },
  {
    id: "msgs",
    header: "Msgs",
    num: true,
    sortValue: (e) => e.messageCount || 0,
    cell: (e) => e.messageCount || 0,
  },
  {
    id: "total",
    header: "Total",
    num: true,
    sortValue: (e) =>
      (e.input || 0) +
      (e.output || 0) +
      (e.cacheRead || 0) +
      (e.cacheWrite || 0) +
      (e.reasoning || 0),
    cell: (e) =>
      fmtTok(
        (e.input || 0) +
          (e.output || 0) +
          (e.cacheRead || 0) +
          (e.cacheWrite || 0) +
          (e.reasoning || 0),
      ),
  },
  {
    id: "cost",
    header: "Cost",
    num: true,
    sortValue: (e) => e.cost,
    cell: (e) => <span class="c-cost">{fmtCost(e.cost)}</span>,
  },
  {
    id: "active",
    header: "Last Active",
    sortValue: (e) => lastActiveMs(e),
    cell: (e) => fmtLastActive(e),
  },
];

function SessionsPage() {
  const { sort, dir, q } = Route.useSearch()();
  const navigate = Route.useNavigate();
  const status = useStatusQuery();
  const sessions = useSessionsQuery(
    () => status.data ?? undefined,
    () => true,
  );
  const [kicked, setKicked] = createSignal(false);

  createEffect(() => {
    if (status.data && !status.data.hasSessions && !status.data.refreshingSessions && !kicked()) {
      setKicked(true);
      void postRefresh("sessions");
    }
  });

  const entries = createMemo(() => {
    const raw =
      sessions.data?.entries || (sessions.data as { models?: SessionEntry[] } | null)?.models || [];
    const query = (q || "").toLowerCase();
    if (!query) return raw;
    return raw.filter((e) => {
      const id = (e.sessionId || e.session || "").toLowerCase();
      return (
        id.includes(query) ||
        (e.model || "").toLowerCase().includes(query) ||
        (e.client || "").toLowerCase().includes(query)
      );
    });
  });

  return (
    <div class="grid gap-3">
      <input
        class="min-h-11 w-full rounded-[var(--r-well)] border border-[var(--bezel)] bg-[var(--bg-well)] px-3 text-sm shadow-[var(--shadow-inset)]"
        placeholder="Search session, model, client"
        value={q || ""}
        onInput={(e) =>
          void navigate({ search: { sort, dir, q: e.currentTarget.value || undefined } })
        }
      />
      <Show
        when={entries().length || status.data?.hasSessions}
        fallback={
          <p class="text-[var(--muted)]">
            {status.data?.refreshingSessions
              ? "Loading sessions from a full local scan…"
              : "No sessions file yet."}
          </p>
        }
      >
        <TokenTable
          rows={entries()}
          columns={columns}
          sort={{ id: sort, desc: dir === "desc" }}
          onSort={(next) =>
            void navigate({ search: { sort: next.id, dir: next.desc ? "desc" : "asc", q } })
          }
        />
      </Show>
    </div>
  );
}

export const Route = createFileRoute("/sessions")({
  validateSearch: (s: Record<string, unknown>) => ({
    ...validateSort(s),
    q: typeof s.q === "string" ? s.q : undefined,
  }),
  component: SessionsPage,
});
