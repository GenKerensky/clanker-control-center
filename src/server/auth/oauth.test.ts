import { describe, expect, it } from "vite-plus/test";
import { challengeS256, loginAllowed, newOauthState } from "./oauth.ts";
import { cookieSecure, loadConfig } from "../config.ts";

describe("oauth state", () => {
  it("issues 32-byte state and verifier", () => {
    const s = newOauthState();
    expect(s.state.length).toBeGreaterThan(20);
    expect(s.verifier.length).toBeGreaterThan(20);
    expect(s.exp).toBeGreaterThan(Date.now());
  });

  it("computes S256 challenge", () => {
    expect(challengeS256("abc")).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

describe("allowlist", () => {
  it("is case-insensitive", () => {
    const cfg = loadConfig({
      TOKSCALE_AUTH: "github",
      TOKSCALE_GITHUB_CLIENT_ID: "id",
      TOKSCALE_GITHUB_CLIENT_SECRET: "secret",
      TOKSCALE_SESSION_SECRET: "s".repeat(32),
      TOKSCALE_GITHUB_USERS: "Falco,Other",
      HOME: "/tmp",
    });
    expect(loginAllowed(cfg, "falco")).toBe(true);
    expect(loginAllowed(cfg, "FALCO")).toBe(true);
    expect(loginAllowed(cfg, "nope")).toBe(false);
  });
});

describe("secure-iff-https", () => {
  it("is false on HTTP publicUrl including a tailnet hostname", () => {
    const cfg = loadConfig({
      TOKSCALE_PUBLIC_URL: "http://bazzite.tail123.ts.net:3333",
      HOME: "/tmp",
    });
    expect(cookieSecure(cfg)).toBe(false);
  });

  it("is true on https publicUrl", () => {
    const cfg = loadConfig({
      TOKSCALE_PUBLIC_URL: "https://bazzite.tail123.ts.net",
      HOME: "/tmp",
    });
    expect(cookieSecure(cfg)).toBe(true);
  });
});
