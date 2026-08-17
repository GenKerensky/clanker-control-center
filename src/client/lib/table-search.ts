export interface SortSearch {
  sort: string;
  dir: "asc" | "desc";
}

export function validateSort(search: Record<string, unknown>, fallback = "cost"): SortSearch {
  return {
    sort: typeof search.sort === "string" ? search.sort : fallback,
    dir: search.dir === "asc" ? "asc" : "desc",
  };
}
