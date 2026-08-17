import { describe, expect, it } from "vite-plus/test";
import { accountFromGoUsage, metricsFromGoUsage, readOpencodeGoKey } from "./opencode-go.ts";

describe("metricsFromGoUsage", () => {
  it("builds dollar remaining labels from window limits", () => {
    const metrics = metricsFromGoUsage({
      rolling: { percent: 25, resetsAt: "2026-08-16T20:00:00Z" },
      weekly: { percent: 50 },
      monthly: { percent: 0 },
    });
    expect(metrics).toHaveLength(3);
    expect(metrics[0]).toMatchObject({
      label: "5h",
      used_percent: 25,
      remaining_percent: 75,
      remaining_label: "$9.00 left",
      resets_at: "2026-08-16T20:00:00Z",
    });
    expect(metrics[1].remaining_label).toBe("$15.00 left");
    expect(metrics[2].remaining_label).toBe("$60.00 left");
  });
});

describe("accountFromGoUsage", () => {
  it("wraps the reconstructed account", () => {
    const account = accountFromGoUsage({ rolling: { percent: 0 } });
    expect(account.provider).toBe("OpenCode Go");
    expect(account.plan).toBe("Go");
    expect(account.email).toBeNull();
  });
});

describe("readOpencodeGoKey", () => {
  it("reads opencode-go.key", () => {
    expect(readOpencodeGoKey({ "opencode-go": { key: " sk " } })).toBe("sk");
    expect(readOpencodeGoKey({})).toBeNull();
    expect(readOpencodeGoKey(null)).toBeNull();
  });
});
