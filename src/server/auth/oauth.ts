import { createHash, randomBytes } from "node:crypto";
import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import type { Config } from "../config.ts";
import { cookieSecure } from "../config.ts";

export const OAUTH_STATE_COOKIE = "oauth_state";
const STATE_TTL_MS = 10 * 60 * 1000;

export interface OauthState {
  state: string;
  verifier: string;
  exp: number;
}

export function newOauthState(): OauthState {
  return {
    state: randomBytes(32).toString("base64url"),
    verifier: randomBytes(32).toString("base64url"),
    exp: Date.now() + STATE_TTL_MS,
  };
}

export function challengeS256(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function setOauthStateCookie(c: Context, cfg: Config, state: OauthState): void {
  setCookie(c, OAUTH_STATE_COOKIE, Buffer.from(JSON.stringify(state)).toString("base64url"), {
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
    secure: cookieSecure(cfg),
    maxAge: 600,
  });
}

export function readOauthStateCookie(c: Context): OauthState | null {
  const raw = getCookie(c, OAUTH_STATE_COOKIE);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as OauthState;
    if (!parsed.state || !parsed.verifier || typeof parsed.exp !== "number") return null;
    if (parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearOauthStateCookie(c: Context, cfg: Config): void {
  deleteCookie(c, OAUTH_STATE_COOKIE, {
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
    secure: cookieSecure(cfg),
  });
}

export function authorizeUrl(cfg: Config, state: OauthState): string {
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", cfg.githubClientId);
  url.searchParams.set("redirect_uri", `${cfg.publicUrl}/auth/github/callback`);
  url.searchParams.set("scope", "read:user");
  url.searchParams.set("state", state.state);
  url.searchParams.set("code_challenge", challengeS256(state.verifier));
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

export interface GithubProfile {
  login: string;
  avatarUrl: string;
}

export async function exchangeCode(cfg: Config, code: string, verifier: string): Promise<string> {
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: cfg.githubClientId,
      client_secret: cfg.githubClientSecret,
      code,
      redirect_uri: `${cfg.publicUrl}/auth/github/callback`,
      code_verifier: verifier,
    }),
  });
  if (!res.ok) throw new Error(`github token HTTP ${res.status}`);
  const body = (await res.json()) as { access_token?: string; error?: string };
  if (!body.access_token) throw new Error(body.error || "github token missing");
  return body.access_token;
}

export async function fetchGithubUser(token: string): Promise<GithubProfile> {
  const res = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "tokscale-dashboard",
    },
  });
  if (!res.ok) throw new Error(`github user HTTP ${res.status}`);
  const body = (await res.json()) as { login?: string; avatar_url?: string };
  if (!body.login) throw new Error("github user missing login");
  return { login: body.login, avatarUrl: body.avatar_url || "" };
}

export function loginAllowed(cfg: Config, login: string): boolean {
  return cfg.githubUsers.includes(login.toLowerCase());
}
