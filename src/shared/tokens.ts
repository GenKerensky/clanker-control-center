import type { TokenBreakdown } from "./types.ts";

export function tokensOf(t: TokenBreakdown | null | undefined): number {
  if (!t) return 0;
  return (
    (t.input || 0) + (t.output || 0) + (t.cacheRead || 0) + (t.cacheWrite || 0) + (t.reasoning || 0)
  );
}

export function cachex(t: TokenBreakdown | null | undefined): number {
  if (!t) return 0;
  const denom = (t.input || 0) + (t.output || 0);
  return denom ? tokensOf(t) / denom : 0;
}

export function costPerM(cost: number, total: number): number {
  return total ? (cost * 1e6) / total : 0;
}

export function emptyTokens(): TokenBreakdown {
  return { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0 };
}

export function addTokens(
  into: TokenBreakdown,
  add: TokenBreakdown | null | undefined,
): TokenBreakdown {
  if (!add) return into;
  into.input += add.input || 0;
  into.output += add.output || 0;
  into.cacheRead += add.cacheRead || 0;
  into.cacheWrite += add.cacheWrite || 0;
  into.reasoning += add.reasoning || 0;
  return into;
}
