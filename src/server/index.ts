import { serve } from "@hono/node-server";
import { createApp } from "./app.ts";
import { loadConfig } from "./config.ts";
import { startBootJobs } from "./jobs.ts";
import { log } from "./log.ts";

const cfg = loadConfig();
const app = createApp(cfg);
startBootJobs(cfg);

log("info", "tokscale dashboard listening", { host: cfg.host, port: cfg.port, auth: cfg.auth });

serve({ fetch: app.fetch, hostname: cfg.host, port: cfg.port });
