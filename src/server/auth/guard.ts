import type { Context, MiddlewareHandler } from "hono";
import { getConnInfo } from "@hono/node-server/conninfo";
import type { Config } from "../config.ts";
import { originAllowlist } from "../config.ts";
import { maybeSlideSession, readSession, type SessionPayload } from "./session.ts";

export function bearerOk(c: Context, token: string | null): boolean {
  if (!token) return false;
  const header = c.req.header("authorization") || "";
  if (!header.toLowerCase().startsWith("bearer ")) return false;
  return header.slice(7) === token;
}

export function isLoopback(c: Context): boolean {
  if (c.req.header("x-forwarded-for")) return false;
  try {
    const info = getConnInfo(c);
    const addr = info.remote.address || "";
    return addr === "127.0.0.1" || addr === "::1" || addr === "::ffff:127.0.0.1";
  } catch {
    return false;
  }
}

export function originAllowed(c: Context, cfg: Config): boolean {
  const origin = c.req.header("origin");
  if (!origin) return false;
  return originAllowlist(cfg).has(origin);
}

function wantsHtml(c: Context): boolean {
  return (c.req.header("accept") || "").includes("text/html");
}

function acceptsJson(c: Context): boolean {
  return (c.req.header("accept") || "").includes("application/json");
}

export function currentUser(c: Context): SessionPayload | null {
  return (c.get("user") as SessionPayload | undefined) ?? null;
}

export function dataGuard(cfg: Config): MiddlewareHandler {
  return async (c, next) => {
    if (cfg.auth === "off") return next();
    if (bearerOk(c, cfg.internalToken)) return next();
    const session = readSession(c, cfg);
    if (!session) {
      if (wantsHtml(c) && !acceptsJson(c)) return c.redirect("/login");
      return c.json({ error: "unauthorized" }, 401);
    }
    c.set("user", maybeSlideSession(c, cfg, session));
    return next();
  };
}

export function refreshGuard(cfg: Config): MiddlewareHandler {
  return async (c, next) => {
    if (isLoopback(c) || bearerOk(c, cfg.internalToken)) return next();
    if (c.req.method === "GET") return c.json({ error: "use POST" }, 405);
    if (!originAllowed(c, cfg)) return c.json({ error: "bad origin" }, 403);
    if (cfg.auth === "off") return next();
    const session = readSession(c, cfg);
    if (!session) {
      if (wantsHtml(c) && !acceptsJson(c)) return c.redirect("/login");
      return c.json({ error: "unauthorized" }, 401);
    }
    c.set("user", maybeSlideSession(c, cfg, session));
    return next();
  };
}
