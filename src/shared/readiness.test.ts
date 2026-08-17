import { describe, expect, it } from "vite-plus/test";
import { overallReadiness, readiness, remainingClass } from "./readiness.ts";
import type { Account } from "./types.ts";

function account(remaining: number[]): Account {
  return {
    provider: "Test",
    plan: null,
    email: null,
    metrics: remaining.map((remaining_percent, i) => ({
      label: `m${i}`,
      used_percent: 100 - remaining_percent,
      remaining_percent,
      remaining_label: null,
      resets_at: null,
    })),
  };
}

describe("remainingClass", () => {
  it("buckets remaining percent", () => {
    expect(remainingClass(9)).toBe("critical");
    expect(remainingClass(10)).toBe("watch");
    expect(remainingClass(24)).toBe("watch");
    expect(remainingClass(25)).toBe("ready");
  });
});

describe("readiness", () => {
  it("uses the worst metric", () => {
    expect(readiness(account([80, 8, 40]))).toBe("critical");
    expect(readiness(account([80, 20]))).toBe("watch");
    expect(readiness(account([]))).toBe("unknown");
  });
});

describe("overallReadiness", () => {
  it("summarizes accounts", () => {
    expect(overallReadiness([account([50]), account([8])])).toBe("Quota low");
    expect(overallReadiness([account([50]), account([20])])).toBe("Ready with warnings");
    expect(overallReadiness([account([50])])).toBe("Ready");
  });
});
