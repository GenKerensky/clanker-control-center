import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";
import { getRequestListener } from "@hono/node-server";
import { createApp } from "./app.ts";
import { loadConfig } from "./config.ts";
import { startBootJobs } from "./jobs.ts";

let booted = false;

export function tokscaleServer(): Plugin {
  return {
    name: "tokscale-server",
    configureServer(server) {
      const cfg = loadConfig();
      if (!booted) {
        booted = true;
        startBootJobs(cfg);
      }
      const app = createApp(cfg);
      const listener = getRequestListener(app.fetch);
      server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const url = req.url || "";
        if (url.startsWith("/api") || url.startsWith("/auth")) {
          void listener(req, res);
          return;
        }
        next();
      });
    },
  };
}
