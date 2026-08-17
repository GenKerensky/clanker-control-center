import { describe, expect, it } from "vite-plus/test";
import { cachex, costPerM, tokensOf } from "./tokens.ts";

describe("tokensOf / cachex / costPerM", () => {
  it("sums token kinds", () => {
    expect(tokensOf({ input: 10, output: 20, cacheRead: 30, cacheWrite: 40, reasoning: 5 })).toBe(
      105,
    );
  });

  it("returns 0 cachex when denom is 0", () => {
    expect(cachex({ input: 0, output: 0, cacheRead: 10, cacheWrite: 0, reasoning: 0 })).toBe(0);
    expect(cachex({ input: 10, output: 10, cacheRead: 20, cacheWrite: 0, reasoning: 0 })).toBe(2);
  });

  it("computes cost per million", () => {
    expect(costPerM(2, 1_000_000)).toBe(2);
    expect(costPerM(5, 0)).toBe(0);
  });
});
