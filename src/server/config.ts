import { homedir } from "node:os";
import { join } from "node:path";

export type AuthMode = "off" | "github";

export interface Config {
  host: string;
  port: number;
  bin: string;
  publicUrl: string;
  auth: AuthMode;
  githubClientId: string;
  githubClientSecret: string;
  githubUsers: string[];
  sessionSecret: string;
  internalToken: string | null;
  jobTimeoutMs: number;
  writeTuiCache: boolean;
  dataDir: string;
  tuiCachePath: string;
  home: string;
}

export class ConfigError extends Error {
  override name = "ConfigError";
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const home = env.HOME || homedir();
  const host = env.TOKSCALE_DASH_HOST || "127.0.0.1";
  const port = Number(env.TOKSCALE_DASH_PORT || "3333");
  if (!Number.isFinite(port) || port <= 0) {
    throw new ConfigError(`invalid TOKSCALE_DASH_PORT: ${env.TOKSCALE_DASH_PORT}`);
  }

  const auth: AuthMode = env.TOKSCALE_AUTH === "github" ? "github" : "off";
  const githubUsers = (env.TOKSCALE_GITHUB_USERS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const githubClientId = env.TOKSCALE_GITHUB_CLIENT_ID || "";
  const githubClientSecret = env.TOKSCALE_GITHUB_CLIENT_SECRET || "";
  const sessionSecret = env.TOKSCALE_SESSION_SECRET || "";

  if (auth === "github") {
    if (!githubClientId)
      throw new ConfigError("TOKSCALE_GITHUB_CLIENT_ID required when TOKSCALE_AUTH=github");
    if (!githubClientSecret) {
      throw new ConfigError("TOKSCALE_GITHUB_CLIENT_SECRET required when TOKSCALE_AUTH=github");
    }
    if (Buffer.byteLength(sessionSecret) < 32) {
      throw new ConfigError(
        "TOKSCALE_SESSION_SECRET must be at least 32 bytes when TOKSCALE_AUTH=github",
      );
    }
    if (githubUsers.length === 0) {
      throw new ConfigError("TOKSCALE_GITHUB_USERS is empty — refuse to listen with an open OAuth");
    }
  }

  const dataDir = env.TOKSCALE_DATA_DIR || join(home, ".local/share/tokscale-dashboard");
  const publicUrl = (env.TOKSCALE_PUBLIC_URL || `http://${host}:${port}`).replace(/\/$/, "");
  const timeoutRaw = env.TOKSCALE_JOB_TIMEOUT_MS || "300000";
  const jobTimeoutMs = Number(timeoutRaw);
  if (!Number.isFinite(jobTimeoutMs) || jobTimeoutMs <= 0) {
    throw new ConfigError(`invalid TOKSCALE_JOB_TIMEOUT_MS: ${timeoutRaw}`);
  }

  return {
    host,
    port,
    bin:
      env.TOKSCALE_BIN ||
      join(home, ".bun/install/global/node_modules/@tokscale/cli-linux-x64-gnu/bin/tokscale"),
    publicUrl,
    auth,
    githubClientId,
    githubClientSecret,
    githubUsers,
    sessionSecret,
    internalToken: env.TOKSCALE_INTERNAL_TOKEN || null,
    jobTimeoutMs,
    writeTuiCache: env.TOKSCALE_WRITE_TUI_CACHE !== "0",
    dataDir,
    tuiCachePath: join(home, ".config/tokscale/cache/tui-data-cache.json"),
    home,
  };
}

export function originAllowlist(cfg: Config): Set<string> {
  return new Set([
    new URL(cfg.publicUrl).origin,
    `http://127.0.0.1:${cfg.port}`,
    `http://localhost:${cfg.port}`,
  ]);
}

export function cookieSecure(cfg: Config): boolean {
  return cfg.publicUrl.startsWith("https://");
}
