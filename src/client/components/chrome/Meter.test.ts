import { describe, expect, it } from "vite-plus/test";
import { litSegments } from "./Bargraph.tsx";

describe("bargraph segments", () => {
  it("rounds remaining/100*12 and clamps", () => {
    expect(litSegments(0)).toBe(0);
    expect(litSegments(100)).toBe(12);
    expect(litSegments(50)).toBe(6);
    expect(litSegments(120)).toBe(12);
    expect(litSegments(-4)).toBe(0);
  });
});
