import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";
import { createApp } from "../app.ts";
import { loadConfig, type Config } from "../config.ts";
import { resetJobsForTests } from "../jobs.ts";
import { encodeSession, issueSession } from "../auth/session.ts";

const SECRET = "n".repeat(32);
const TOKEN = "internal-token-value";

async function makeCfg(overrides: Record<string, string> = {}): Promise<Config> {
  const dir = await mkdtemp(join(tmpdir(), "tokscale-dash-"));
  return loadConfig({
    HOME: dir,
    TOKSCALE_DATA_DIR: dir,
    TOKSCALE_AUTH: "off",
    TOKSCALE_INTERNAL_TOKEN: TOKEN,
    TOKSCALE_PUBLIC_URL: "http://bazzite.tail123.ts.net:3333",
    TOKSCALE_DASH_PORT: "3333",
    ...overrides,
  });
}

describe("api", () => {
  beforeEach(() => {
    resetJobsForTests();
  });
  afterEach(() => {
    resetJobsForTests();
  });

  it("GET /api/health is unauthenticated", async () => {
    const app = createApp(await makeCfg());
    const res = await app.request("/api/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("GET refresh from non-loopback without bearer is 405", async () => {
    const app = createApp(await makeCfg());
    const res = await app.request("http://192.168.1.4:3333/api/refresh/graph");
    expect(res.status).toBe(405);
    expect(await res.json()).toEqual({ error: "use POST" });
  });

  it("GET refresh with bearer is allowed", async () => {
    const cfg = await makeCfg({ TOKSCALE_BIN: "/bin/true" });
    const app = createApp(cfg);
    const res = await app.request("/api/refresh/usage", {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { started: boolean };
    expect(body.started).toBe(true);
  });

  it("POST refresh without Origin is 403", async () => {
    const app = createApp(await makeCfg());
    const res = await app.request("/api/refresh/usage", { method: "POST" });
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "bad origin" });
  });

  it("POST refresh from 127.0.0.1 Origin is allowed when publicUrl is a tailnet name", async () => {
    const cfg = await makeCfg({ TOKSCALE_BIN: "/bin/true" });
    const app = createApp(cfg);
    const res = await app.request("/api/refresh/usage", {
      method: "POST",
      headers: { Origin: "http://127.0.0.1:3333" },
    });
    expect(res.status).toBe(200);
  });

  it("status includes TUI fields", async () => {
    const app = createApp(await makeCfg());
    const res = await app.request("/api/status");
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toMatchObject({
      refreshingTui: false,
      tuiTimestamp: null,
      tuiError: null,
      authEnabled: false,
      authenticated: true,
    });
    expect(body.jobs).toBeTruthy();
  });

  it("data GET 404s with the legacy error bodies", async () => {
    const app = createApp(await makeCfg());
    expect((await (await app.request("/api/data")).json()).error).toBe("no scan yet");
    expect((await (await app.request("/api/usage")).json()).error).toBe("no usage yet");
    expect((await (await app.request("/api/sessions")).json()).error).toBe("no sessions yet");
    expect((await (await app.request("/api/tui")).json()).error).toMatch(/no TUI cache/);
  });

  it("serves usage.json with no-store", async () => {
    const cfg = await makeCfg();
    await writeFile(
      join(cfg.dataDir, "usage.json"),
      JSON.stringify({ fetchedAt: "t", accounts: [] }),
    );
    const app = createApp(cfg);
    const res = await app.request("/api/usage");
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await res.json()).toEqual({ fetchedAt: "t", accounts: [] });
  });

  it("redacts unauthenticated status when auth is on", async () => {
    const cfg = await makeCfg({
      TOKSCALE_AUTH: "github",
      TOKSCALE_GITHUB_CLIENT_ID: "id",
      TOKSCALE_GITHUB_CLIENT_SECRET: "secret",
      TOKSCALE_SESSION_SECRET: SECRET,
      TOKSCALE_GITHUB_USERS: "falco",
    });
    await writeFile(
      join(cfg.dataDir, "data.json"),
      JSON.stringify({ meta: { generatedAt: "secret-stamp" } }),
    );
    const app = createApp(cfg);
    const res = await app.request("/api/status");
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      authenticated: boolean;
      generatedAt: string | null;
      hasData: boolean;
    };
    expect(body.authenticated).toBe(false);
    expect(body.generatedAt).toBeNull();
    expect(body.hasData).toBe(false);
  });

  it("returns 401 JSON on data GET when auth is on", async () => {
    const cfg = await makeCfg({
      TOKSCALE_AUTH: "github",
      TOKSCALE_GITHUB_CLIENT_ID: "id",
      TOKSCALE_GITHUB_CLIENT_SECRET: "secret",
      TOKSCALE_SESSION_SECRET: SECRET,
      TOKSCALE_GITHUB_USERS: "falco",
    });
    const app = createApp(cfg);
    const res = await app.request("/api/usage", { headers: { Accept: "application/json" } });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "unauthorized" });
  });

  it("allows a signed session to read data", async () => {
    const cfg = await makeCfg({
      TOKSCALE_AUTH: "github",
      TOKSCALE_GITHUB_CLIENT_ID: "id",
      TOKSCALE_GITHUB_CLIENT_SECRET: "secret",
      TOKSCALE_SESSION_SECRET: SECRET,
      TOKSCALE_GITHUB_USERS: "falco",
    });
    await writeFile(
      join(cfg.dataDir, "usage.json"),
      JSON.stringify({ fetchedAt: "t", accounts: [] }),
    );
    const cookie = encodeSession(issueSession({ login: "falco", avatarUrl: "" }), SECRET);
    const app = createApp(cfg);
    const res = await app.request("/api/usage", {
      headers: { Cookie: `tokscale_session=${cookie}`, Accept: "application/json" },
    });
    expect(res.status).toBe(200);
  });
});

describe("atomic write via usage job helpers", () => {
  it("replaces through a tmp file", async () => {
    const dir = await mkdtemp(join(tmpdir(), "tokscale-atomic-"));
    await mkdir(dir, { recursive: true });
    const { atomicWrite } = await import("../jobs.ts");
    const dest = join(dir, "usage.json");
    await atomicWrite(dest, '{"ok":true}');
    const { readFile } = await import("node:fs/promises");
    expect(await readFile(dest, "utf8")).toBe('{"ok":true}');
  });
});
