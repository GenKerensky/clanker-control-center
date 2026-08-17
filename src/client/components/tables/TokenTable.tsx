import { For, createMemo, type JSX } from "solid-js";
import { createTable, tableFeatures, type RowData } from "@tanstack/solid-table";
import { createVirtualizer } from "@tanstack/solid-virtual";

export interface Col<T> {
  id: string;
  header: string;
  num?: boolean;
  width?: string;
  sortValue: (row: T) => string | number;
  cell: (row: T) => JSX.Element | string | number | null;
}

const features = tableFeatures({});

export interface TokenTableProps<T> {
  rows: T[];
  columns: Col<T>[];
  sort: { id: string; desc: boolean };
  onSort: (next: { id: string; desc: boolean }) => void;
  estimateSize?: number;
}

function track(col: Col<unknown>): string {
  if (col.width) return col.width;
  return col.num ? "minmax(4.75rem, 0.7fr)" : "minmax(7.5rem, 1.2fr)";
}

export function TokenTable<T extends RowData>(props: TokenTableProps<T>) {
  const sorted = createMemo(() => {
    const col = props.columns.find((c) => c.id === props.sort.id);
    const acc = col?.sortValue;
    const dir = props.sort.desc ? -1 : 1;
    return props.rows.slice().sort((a, b) => {
      if (!acc) return 0;
      const av = acc(a);
      const bv = acc(b);
      if (typeof av === "string" || typeof bv === "string") {
        return String(av).localeCompare(String(bv)) * dir;
      }
      return ((Number(av) || 0) - (Number(bv) || 0)) * dir;
    });
  });

  const table = createTable({
    features,
    columns: [],
    get data() {
      return sorted();
    },
  });
  void table.getRowModel;

  const cols = createMemo(() => props.columns.map((c) => track(c as Col<unknown>)).join(" "));
  const rowH = () => props.estimateSize ?? 32;

  let parentRef: HTMLDivElement | undefined = undefined;
  const virtualizer = createVirtualizer({
    get count() {
      return sorted().length;
    },
    getScrollElement: () => parentRef ?? null,
    estimateSize: () => rowH(),
    overscan: 12,
  });

  const clickHead = (id: string) => {
    if (props.sort.id === id) props.onSort({ id, desc: !props.sort.desc });
    else props.onSort({ id, desc: true });
  };

  return (
    <div
      ref={(el) => {
        parentRef = el ?? undefined;
      }}
      class="max-h-[70vh] overflow-auto rounded-[var(--r-well)] bg-[var(--bg-well)] shadow-[var(--shadow-inset)]"
    >
      <div class="plate-grid" style={{ "--plate-cols": cols() }}>
        <div class="plate-grid-head" role="row">
          <For each={props.columns}>
            {(c) => (
              <div
                class={c.num ? "plate-grid-cell num" : "plate-grid-cell"}
                role="columnheader"
                onClick={() => clickHead(c.id)}
              >
                {c.header}
                {props.sort.id === c.id ? (props.sort.desc ? " ▾" : " ▴") : ""}
              </div>
            )}
          </For>
        </div>
        <div class="relative" style={{ height: `${virtualizer.getTotalSize()}px` }}>
          <For each={virtualizer.getVirtualItems()}>
            {(v) => {
              const row = sorted()[v.index];
              if (!row) return null;
              return (
                <div
                  data-index={v.index}
                  role="row"
                  class="plate-grid-row"
                  ref={(el) => virtualizer.measureElement(el)}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    height: `${rowH()}px`,
                    transform: `translateY(${v.start}px)`,
                  }}
                >
                  <For each={props.columns}>
                    {(c) => (
                      <div class={c.num ? "plate-grid-cell num" : "plate-grid-cell"} role="cell">
                        {c.cell(row)}
                      </div>
                    )}
                  </For>
                </div>
              );
            }}
          </For>
        </div>
      </div>
    </div>
  );
}
