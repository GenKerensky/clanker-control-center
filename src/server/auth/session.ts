import { createHmac, timingSafeEqual } from "node:crypto";
import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import type { AuthUser } from "../../shared/types.ts";
import type { Config } from "../config.ts";
import { cookieSecure } from "../config.ts";

export const SESSION_COOKIE = "tokscale_session";
const SESSION_TTL_SEC = 30 * 24 * 60 * 60;
const SLIDE_IF_REMAINING_SEC = 7 * 24 * 60 * 60;

export interface SessionPayload extends AuthUser {
  iat: number;
  exp: number;
}

function b64url(buf: Buffer | string): string {
  const b = typeof buf === "string" ? Buffer.from(buf) : buf;
  return b.toString("base64url");
}

function sign(secret: string, payloadB64: string): string {
  return createHmac("sha256", secret).update(payloadB64).digest("base64url");
}

export function encodeSession(payload: SessionPayload, secret: string): string {
  const payloadB64 = b64url(JSON.stringify(payload));
  return `${payloadB64}.${sign(secret, payloadB64)}`;
}

export function decodeSession(value: string, secret: string): SessionPayload | null {
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;
  const payloadB64 = value.slice(0, dot);
  const mac = value.slice(dot + 1);
  const expected = sign(secret, payloadB64);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf8"),
    ) as SessionPayload;
    if (!payload.login || typeof payload.exp !== "number") return null;
    if (payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function issueSession(user: AuthUser): SessionPayload {
  const iat = Math.floor(Date.now() / 1000);
  return { login: user.login, avatarUrl: user.avatarUrl, iat, exp: iat + SESSION_TTL_SEC };
}

function cookieOpts(cfg: Config) {
  return {
    path: "/",
    httpOnly: true,
    sameSite: "Lax" as const,
    secure: cookieSecure(cfg),
  };
}

export function setSessionCookie(c: Context, cfg: Config, payload: SessionPayload): void {
  setCookie(c, SESSION_COOKIE, encodeSession(payload, cfg.sessionSecret), {
    ...cookieOpts(cfg),
    maxAge: SESSION_TTL_SEC,
  });
}

export function clearSessionCookie(c: Context, cfg: Config): void {
  deleteCookie(c, SESSION_COOKIE, cookieOpts(cfg));
}

export function readSession(c: Context, cfg: Config): SessionPayload | null {
  if (!cfg.sessionSecret) return null;
  const raw = getCookie(c, SESSION_COOKIE);
  if (!raw) return null;
  return decodeSession(raw, cfg.sessionSecret);
}

export function maybeSlideSession(
  c: Context,
  cfg: Config,
  session: SessionPayload,
): SessionPayload {
  const remaining = session.exp - Math.floor(Date.now() / 1000);
  if (remaining >= SLIDE_IF_REMAINING_SEC) return session;
  const next = issueSession(session);
  setSessionCookie(c, cfg, next);
  return next;
}
