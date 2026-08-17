import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import type { Config } from "./config.ts";
import { apiRoutes } from "./routes/api.ts";
import { authRoutes } from "./routes/auth.ts";

export function createApp(cfg: Config): Hono {
  const app = new Hono();

  app.route("/api", apiRoutes(cfg));
  if (cfg.auth === "github") {
    app.route("/auth", authRoutes(cfg));
  }

  if (existsSync("./dist")) {
    app.use("/assets/*", serveStatic({ root: "./dist" }));
    app.use("/icons/*", serveStatic({ root: "./dist" }));
    app.use("/fonts/*", serveStatic({ root: "./dist" }));
    app.use("/icons.svg", serveStatic({ root: "./dist" }));
    app.get("/favicon.svg", serveStatic({ root: "./dist" }));
    app.get("/manifest.webmanifest", serveStatic({ root: "./dist" }));
    app.get("/sw.js", serveStatic({ root: "./dist" }));
    app.get("/workbox-*.js", serveStatic({ root: "./dist" }));
  }

  app.get("*", async (c) => {
    const path = c.req.path;
    if (path.startsWith("/api") || path.startsWith("/auth")) {
      return c.json({ error: "not found" }, 404);
    }
    const accept = c.req.header("accept") || "";
    if (!accept.includes("text/html")) {
      return c.body(null, 404);
    }
    try {
      const html = await readFile(join(process.cwd(), "dist/index.html"), "utf8");
      return c.html(html);
    } catch {
      return c.text("SPA not built — run vp build", 503);
    }
  });

  return app;
}
