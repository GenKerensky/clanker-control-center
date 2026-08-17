import { describe, expect, it } from "vite-plus/test";
import { fmtCost, fmtTok, lastActiveMs } from "./format.ts";

describe("fmtTok / fmtCost", () => {
  it("abbreviates", () => {
    expect(fmtTok(1_500_000)).toBe("1.5M");
    expect(fmtCost(1200)).toBe("$1.2K");
    expect(fmtCost(12.3)).toBe("$12.30");
  });
});

describe("lastActiveMs", () => {
  it("prefers lastSeen", () => {
    expect(lastActiveMs({ lastSeen: 1_700_000_000_000 } as never)).toBe(1_700_000_000_000);
    expect(lastActiveMs({ last_seen: 1_700_000_000 } as never)).toBe(1_700_000_000_000);
  });

  it("parses rollout session ids", () => {
    const ms = lastActiveMs({
      sessionId: "rollout-2026-08-16T12-30-00-abc",
    } as never);
    expect(ms).toBe(Date.parse("2026-08-16T12:30:00"));
  });

  it("parses uuid-shaped hex in the 1e12..2e12 window", () => {
    const hex = (0x18c2e0e1000).toString(16).padStart(12, "0") + "aaaaaaaaaaaaaaaaaaaa";
    const ms = lastActiveMs({ sessionId: hex } as never);
    expect(ms).toBe(0x18c2e0e1000);
  });

  it("falls back to 0", () => {
    expect(lastActiveMs({ sessionId: "ses_nope" } as never)).toBe(0);
  });
});
