import { describe, expect, it } from "vite-plus/test";
import { ConfigError, loadConfig, originAllowlist } from "./config.ts";

describe("loadConfig", () => {
  it("defaults auth off and loopback bind", () => {
    const cfg = loadConfig({ HOME: "/tmp/home" });
    expect(cfg.auth).toBe("off");
    expect(cfg.host).toBe("127.0.0.1");
    expect(cfg.port).toBe(3333);
    expect(cfg.writeTuiCache).toBe(true);
    expect(cfg.jobTimeoutMs).toBe(300000);
  });

  it("refuses github auth with an empty allowlist", () => {
    expect(() =>
      loadConfig({
        HOME: "/tmp",
        TOKSCALE_AUTH: "github",
        TOKSCALE_GITHUB_CLIENT_ID: "id",
        TOKSCALE_GITHUB_CLIENT_SECRET: "secret",
        TOKSCALE_SESSION_SECRET: "s".repeat(32),
        TOKSCALE_GITHUB_USERS: "",
      }),
    ).toThrow(ConfigError);
  });

  it("includes 127.0.0.1 on the origin allowlist when publicUrl is a tailnet name", () => {
    const cfg = loadConfig({
      HOME: "/tmp",
      TOKSCALE_PUBLIC_URL: "http://bazzite.tail123.ts.net:3333",
      TOKSCALE_DASH_PORT: "3333",
    });
    const allowed = originAllowlist(cfg);
    expect(allowed.has("http://bazzite.tail123.ts.net:3333")).toBe(true);
    expect(allowed.has("http://127.0.0.1:3333")).toBe(true);
    expect(allowed.has("http://localhost:3333")).toBe(true);
  });
});
