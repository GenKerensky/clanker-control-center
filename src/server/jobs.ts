import { appendFile, mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Account, JobName, JobSnapshot, Status } from "../shared/types.ts";
import type { Config } from "./config.ts";
import { log } from "./log.ts";
import { fetchOpencodeGo } from "./opencode-go.ts";
import { graphArgs, runTokscale, sessionsArgs, tuiArgs, usageArgs } from "./tokscale.ts";

interface JobInternal {
  running: boolean;
  error: string | null;
  startedAt: string | null;
  lastStartedAt: string | null;
  lastDurationMs: number | null;
  lastExitCode: number | null;
}

const jobs: Record<JobName, JobInternal> = {
  graph: idleJob(),
  usage: idleJob(),
  sessions: idleJob(),
  tui: idleJob(),
};

function idleJob(): JobInternal {
  return {
    running: false,
    error: null,
    startedAt: null,
    lastStartedAt: null,
    lastDurationMs: null,
    lastExitCode: null,
  };
}

export function paths(cfg: Config) {
  return {
    data: join(cfg.dataDir, "data.json"),
    usage: join(cfg.dataDir, "usage.json"),
    sessions: join(cfg.dataDir, "sessions.json"),
    graphLog: join(cfg.dataDir, "refresh.log"),
    usageLog: join(cfg.dataDir, "usage.log"),
    sessionsLog: join(cfg.dataDir, "sessions.log"),
    tuiLog: join(cfg.dataDir, "tui.log"),
    tuiCache: cfg.tuiCachePath,
  };
}

export function startJob(name: JobName, cfg: Config): boolean {
  const job = jobs[name];
  if (job.running) return false;
  job.running = true;
  job.startedAt = new Date().toISOString();
  job.lastStartedAt = job.startedAt;
  const t0 = Date.now();
  void run(name, cfg)
    .then((code) => {
      job.lastExitCode = code;
      if (code === 0) job.error = null;
    })
    .catch((err: unknown) => {
      job.error = err instanceof Error ? err.message : String(err);
      job.lastExitCode = 1;
      log("error", "job failed", { job: name, msg: job.error });
    })
    .finally(() => {
      job.lastDurationMs = Date.now() - t0;
      job.running = false;
      job.startedAt = null;
    });
  return true;
}

export function startGraphRefresh(cfg: Config): boolean {
  const started = startJob("graph", cfg);
  startJob("sessions", cfg);
  if (cfg.writeTuiCache) startJob("tui", cfg);
  return started;
}

export function startBootJobs(cfg: Config): void {
  startJob("usage", cfg);
  if (!existsSync(paths(cfg).data)) startGraphRefresh(cfg);
}

async function run(name: JobName, cfg: Config): Promise<number> {
  await mkdir(cfg.dataDir, { recursive: true });
  switch (name) {
    case "graph":
      return runGraph(cfg);
    case "usage":
      return runUsage(cfg);
    case "sessions":
      return runSessions(cfg);
    case "tui":
      return runTui(cfg);
  }
}

async function atomicWrite(finalPath: string, body: string): Promise<void> {
  const tmp = `${finalPath}.tmp`;
  try {
    await writeFile(tmp, body);
    await rename(tmp, finalPath);
  } catch (err) {
    await unlink(tmp).catch(() => undefined);
    throw err;
  }
}

export { atomicWrite };

async function runGraph(cfg: Config): Promise<number> {
  const p = paths(cfg);
  const tmp = `${p.data}.tmp`;
  const result = await runTokscale(cfg, graphArgs(tmp), { logPath: p.graphLog });
  if (result.code !== 0) {
    await unlink(tmp).catch(() => undefined);
    jobs.graph.error = `tokscale graph exited ${result.code}; see ${p.graphLog}`;
    log("error", "graph failed", { job: "graph", code: result.code });
    return result.code;
  }
  await rename(tmp, p.data);
  log("info", "graph ok", { job: "graph", code: 0 });
  return 0;
}

async function runUsage(cfg: Config): Promise<number> {
  const p = paths(cfg);
  const result = await runTokscale(cfg, usageArgs(), { logPath: p.usageLog, captureStdout: true });
  if (result.code !== 0) {
    jobs.usage.error = `tokscale usage exited ${result.code}; see ${p.usageLog}`;
    log("error", "usage failed", { job: "usage", code: result.code });
    return result.code;
  }
  let accounts: unknown;
  try {
    accounts = JSON.parse(result.stdout);
  } catch {
    jobs.usage.error = "tokscale usage --json did not return JSON";
    return 1;
  }
  if (!Array.isArray(accounts)) {
    jobs.usage.error = "tokscale usage --json did not return an array";
    return 1;
  }
  const filtered = (accounts as Account[]).filter((a) => a?.provider !== "OpenCode Go");
  try {
    filtered.push(await fetchOpencodeGo(cfg));
  } catch (goErr) {
    const msg = goErr instanceof Error ? goErr.message : String(goErr);
    await appendFile(p.usageLog, `\nOpenCode Go usage failed: ${msg}\n`);
    log("warn", "opencode go overlay failed", { job: "usage" });
  }
  const payload = { fetchedAt: new Date().toISOString(), accounts: filtered };
  await atomicWrite(p.usage, JSON.stringify(payload));
  log("info", "usage ok", { job: "usage", code: 0 });
  return 0;
}

async function runSessions(cfg: Config): Promise<number> {
  const p = paths(cfg);
  const result = await runTokscale(cfg, sessionsArgs(), {
    logPath: p.sessionsLog,
    captureStdout: true,
  });
  if (result.code !== 0) {
    jobs.sessions.error = `tokscale models --group-by session exited ${result.code}`;
    log("error", "sessions failed", { job: "sessions", code: result.code });
    return result.code;
  }
  try {
    JSON.parse(result.stdout);
  } catch {
    jobs.sessions.error = "tokscale models --json did not return JSON";
    return 1;
  }
  await atomicWrite(p.sessions, result.stdout);
  log("info", "sessions ok", { job: "sessions", code: 0 });
  return 0;
}

async function runTui(cfg: Config): Promise<number> {
  const p = paths(cfg);
  const result = await runTokscale(cfg, tuiArgs(), { logPath: p.tuiLog });
  if (result.code !== 0) {
    jobs.tui.error = `tokscale models --light --write-cache exited ${result.code}; see ${p.tuiLog}`;
    log("error", "tui failed", { job: "tui", code: result.code });
    return result.code;
  }
  log("info", "tui ok", { job: "tui", code: 0 });
  return 0;
}

export function jobError(name: JobName): string | null {
  return jobs[name].error;
}

export function jobSnapshots(): Record<JobName, JobSnapshot> {
  const out = {} as Record<JobName, JobSnapshot>;
  for (const name of Object.keys(jobs) as JobName[]) {
    const j = jobs[name];
    out[name] = {
      running: j.running,
      lastStartedAt: j.lastStartedAt,
      lastDurationMs: j.lastDurationMs,
      lastExitCode: j.lastExitCode,
    };
  }
  return out;
}

export function resetJobsForTests(): void {
  for (const name of Object.keys(jobs) as JobName[]) {
    jobs[name] = idleJob();
  }
}

async function readGeneratedAt(dataPath: string): Promise<string | null> {
  try {
    const doc = JSON.parse(await readFile(dataPath, "utf8")) as { meta?: { generatedAt?: string } };
    return doc.meta?.generatedAt ?? null;
  } catch {
    return null;
  }
}

async function readUsageFetchedAt(usagePath: string): Promise<string | null> {
  try {
    const doc = JSON.parse(await readFile(usagePath, "utf8")) as { fetchedAt?: string };
    return doc.fetchedAt ?? null;
  } catch {
    return null;
  }
}

async function readTuiTimestamp(tuiPath: string): Promise<number | null> {
  try {
    const doc = JSON.parse(await readFile(tuiPath, "utf8")) as { timestamp?: number };
    return typeof doc.timestamp === "number" ? doc.timestamp : null;
  } catch {
    return null;
  }
}

export async function buildStatus(
  cfg: Config,
  opts: { authenticated: boolean; user: { login: string; avatarUrl: string } | null },
): Promise<Status> {
  const authEnabled = cfg.auth === "github";
  if (authEnabled && !opts.authenticated) {
    return {
      refreshing: false,
      refreshingUsage: false,
      refreshingSessions: false,
      refreshingTui: false,
      hasData: false,
      hasUsage: false,
      hasTui: false,
      hasSessions: false,
      generatedAt: null,
      tuiTimestamp: null,
      usageFetchedAt: null,
      error: null,
      usageError: null,
      sessionsError: null,
      tuiError: null,
      authEnabled: true,
      authenticated: false,
      user: null,
      publicUrl: cfg.publicUrl,
    };
  }

  const p = paths(cfg);
  const hasData = existsSync(p.data) && existsSync(p.data) && (await fileNonEmpty(p.data));
  const hasUsage = existsSync(p.usage) && (await fileNonEmpty(p.usage));
  const hasSessions = existsSync(p.sessions) && (await fileNonEmpty(p.sessions));
  const hasTui = existsSync(p.tuiCache);

  return {
    refreshing: jobs.graph.running,
    refreshingUsage: jobs.usage.running,
    refreshingSessions: jobs.sessions.running,
    refreshingTui: jobs.tui.running,
    hasData,
    hasUsage,
    hasTui,
    hasSessions,
    generatedAt: hasData ? await readGeneratedAt(p.data) : null,
    tuiTimestamp: hasTui ? await readTuiTimestamp(p.tuiCache) : null,
    usageFetchedAt: hasUsage ? await readUsageFetchedAt(p.usage) : null,
    error: jobs.graph.error,
    usageError: jobs.usage.error,
    sessionsError: jobs.sessions.error,
    tuiError: jobs.tui.error,
    authEnabled,
    authenticated: opts.authenticated,
    user: opts.user,
    publicUrl: cfg.publicUrl,
    jobs: jobSnapshots(),
  };
}

async function fileNonEmpty(path: string): Promise<boolean> {
  try {
    const raw = await readFile(path);
    return raw.byteLength > 0;
  } catch {
    return false;
  }
}
