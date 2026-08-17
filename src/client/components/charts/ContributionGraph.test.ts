import { describe, expect, it } from "vite-plus/test";
import { intensityFromCost } from "./ContributionGraph.tsx";

describe("heatmap intensity", () => {
  it("buckets cost against max", () => {
    expect(intensityFromCost(0, 10)).toBe(0);
    expect(intensityFromCost(1, 10)).toBe(1);
    expect(intensityFromCost(3, 10)).toBe(2);
    expect(intensityFromCost(5, 10)).toBe(3);
    expect(intensityFromCost(8, 10)).toBe(4);
  });
});
