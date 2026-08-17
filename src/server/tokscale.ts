import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { join } from "node:path";
import type { Config } from "./config.ts";

export function tokscaleEnv(cfg: Config): NodeJS.ProcessEnv {
  const bunBin = join(cfg.home, ".bun/bin");
  return {
    ...process.env,
    PATH: `${bunBin}${process.env.PATH ? `:${process.env.PATH}` : ""}`,
  };
}

export function graphArgs(outputPath: string): string[] {
  return ["graph", "--output", outputPath, "--no-spinner"];
}

export function usageArgs(): string[] {
  return ["usage", "--json"];
}

export function sessionsArgs(): string[] {
  return ["models", "--json", "--group-by", "client,session,model", "--no-spinner"];
}

export function tuiArgs(): string[] {
  return ["models", "--light", "--write-cache", "--no-spinner", "--group-by", "model"];
}

export interface RunResult {
  code: number;
  stdout: string;
}

export function runTokscale(
  cfg: Config,
  args: string[],
  opts: { logPath: string; captureStdout?: boolean },
): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const log = createWriteStream(opts.logPath);
    const child = spawn(cfg.bin, args, {
      env: tokscaleEnv(cfg),
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let settled = false;

    const finish = (result: RunResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      log.end();
      resolve(result);
    };

    child.stdout?.on("data", (buf: Buffer) => {
      if (opts.captureStdout) stdout += buf.toString("utf8");
      else log.write(buf);
    });
    child.stderr?.on("data", (buf: Buffer) => {
      log.write(buf);
    });

    const timer = setTimeout(() => {
      child.kill("SIGKILL");
    }, cfg.jobTimeoutMs);

    child.on("error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      log.end();
      reject(err);
    });

    child.on("close", (code) => {
      finish({ code: code ?? 1, stdout });
    });
  });
}
