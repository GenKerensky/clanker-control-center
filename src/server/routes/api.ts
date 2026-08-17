import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { Hono } from "hono";
import type { Config } from "../config.ts";
import { buildStatus, paths, startGraphRefresh, startJob } from "../jobs.ts";
import { bearerOk, currentUser, dataGuard, isLoopback, refreshGuard } from "../auth/guard.ts";
import { readSession } from "../auth/session.ts";

const NO_STORE = { "Cache-Control": "no-store" };

async function sendJsonFile(
  c: {
    json: (b: unknown, s?: number) => Response;
    body: (b: string, s?: number, h?: Record<string, string>) => Response;
  },
  filePath: string,
  missing: string,
) {
  if (!existsSync(filePath)) return c.json({ error: missing }, 404);
  const raw = await readFile(filePath, "utf8");
  return c.body(raw, 200, { "Content-Type": "application/json", ...NO_STORE });
}

export function apiRoutes(cfg: Config): Hono {
  const app = new Hono();
  const p = paths(cfg);

  app.get("/health", (c) => c.json({ ok: true }));

  app.get("/status", async (c) => {
    const session = cfg.auth === "off" ? null : readSession(c, cfg);
    const viaBearer = bearerOk(c, cfg.internalToken);
    const viaLoopback = isLoopback(c);
    const full = cfg.auth === "off" || !!session || viaBearer || viaLoopback;
    const status = await buildStatus(cfg, {
      authenticated: full,
      user: session ? { login: session.login, avatarUrl: session.avatarUrl } : null,
    });
    if (cfg.auth === "github" && !session) {
      status.authenticated = false;
      status.user = null;
    }
    return c.json(status, 200, NO_STORE);
  });

  app.get("/me", (c) => {
    const session = cfg.auth === "off" ? null : readSession(c, cfg);
    return c.json(
      {
        authEnabled: cfg.auth === "github",
        authenticated: cfg.auth === "off" || !!session,
        user: session ? { login: session.login, avatarUrl: session.avatarUrl } : null,
      },
      200,
      NO_STORE,
    );
  });

  const data = new Hono();
  data.use("*", dataGuard(cfg));
  data.get("/data", (c) => sendJsonFile(c, p.data, "no scan yet"));
  data.get("/usage", (c) => sendJsonFile(c, p.usage, "no usage yet"));
  data.get("/tui", (c) =>
    sendJsonFile(c, p.tuiCache, "no TUI cache yet — open tokscale tui once, or Rescan history"),
  );
  data.get("/sessions", (c) => sendJsonFile(c, p.sessions, "no sessions yet"));
  app.route("/", data);

  const refresh = new Hono();
  refresh.use("*", refreshGuard(cfg));

  const withStatus = async (c: Parameters<typeof currentUser>[0], started: boolean) => {
    const session = currentUser(c) ?? (cfg.auth === "off" ? null : readSession(c, cfg));
    const status = await buildStatus(cfg, {
      authenticated: cfg.auth === "off" || !!session,
      user: session ? { login: session.login, avatarUrl: session.avatarUrl } : null,
    });
    return c.json({ started, ...status }, 200, NO_STORE);
  };

  const usageRefresh = async (c: Parameters<typeof currentUser>[0]) => {
    const started = startJob("usage", cfg);
    return withStatus(c, started);
  };

  refresh.get("/refresh", usageRefresh);
  refresh.post("/refresh", usageRefresh);
  refresh.get("/refresh/usage", usageRefresh);
  refresh.post("/refresh/usage", usageRefresh);

  const graphRefresh = async (c: Parameters<typeof currentUser>[0]) => {
    const started = startGraphRefresh(cfg);
    return withStatus(c, started);
  };
  refresh.get("/refresh/graph", graphRefresh);
  refresh.post("/refresh/graph", graphRefresh);

  const sessionsRefresh = async (c: Parameters<typeof currentUser>[0]) => {
    const started = startJob("sessions", cfg);
    return withStatus(c, started);
  };
  refresh.get("/refresh/sessions", sessionsRefresh);
  refresh.post("/refresh/sessions", sessionsRefresh);

  app.route("/", refresh);
  return app;
}
