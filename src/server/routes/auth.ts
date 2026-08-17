import { Hono } from "hono";
import type { Config } from "../config.ts";
import { log } from "../log.ts";
import {
  authorizeUrl,
  clearOauthStateCookie,
  exchangeCode,
  fetchGithubUser,
  loginAllowed,
  newOauthState,
  readOauthStateCookie,
  setOauthStateCookie,
} from "../auth/oauth.ts";
import { clearSessionCookie, issueSession, setSessionCookie } from "../auth/session.ts";
import { originAllowed } from "../auth/guard.ts";

export function authRoutes(cfg: Config): Hono {
  const app = new Hono();

  app.get("/github", (c) => {
    const state = newOauthState();
    setOauthStateCookie(c, cfg, state);
    return c.redirect(authorizeUrl(cfg, state));
  });

  app.get("/github/callback", async (c) => {
    const stored = readOauthStateCookie(c);
    clearOauthStateCookie(c, cfg);
    const state = c.req.query("state");
    const code = c.req.query("code");
    if (!stored || !state || stored.state !== state || !code) {
      return c.text("invalid oauth state", 400);
    }
    try {
      const token = await exchangeCode(cfg, code, stored.verifier);
      const user = await fetchGithubUser(token);
      if (!loginAllowed(cfg, user.login)) {
        log("info", "login deny", { login: user.login });
        return c.text("not on the allowlist", 403);
      }
      setSessionCookie(c, cfg, issueSession(user));
      log("info", "login ok", { login: user.login });
      return c.redirect("/");
    } catch (err) {
      log("error", "oauth callback failed", {
        err: err instanceof Error ? err.message : String(err),
      });
      return c.text("oauth failed", 502);
    }
  });

  app.post("/logout", (c) => {
    if (!originAllowed(c, cfg)) return c.json({ error: "bad origin" }, 403);
    clearSessionCookie(c, cfg);
    log("info", "logout");
    return c.body(null, 204);
  });

  return app;
}
