import { defineConfig } from "vite-plus";
import solid from "vite-plugin-solid";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { VitePWA } from "vite-plugin-pwa";
import { tokscaleServer } from "./src/server/vite-plugin.ts";

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "solid",
      autoCodeSplitting: true,
      routesDirectory: "./src/client/routes",
      generatedRouteTree: "./src/client/routeTree.gen.ts",
    }),
    solid(),
    tailwindcss(),
    tokscaleServer(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons/*", "fonts/*"],
      manifest: false,
      workbox: {
        navigateFallback: "/index.html",
        runtimeCaching: [],
        navigateFallbackDenylist: [/^\/api\//, /^\/auth\//],
      },
    }),
  ],
  resolve: {
    alias: {
      "@client": "/src/client",
    },
  },
  server: {
    port: 5173,
    strictPort: false,
    host: "127.0.0.1",
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    target: "es2022",
  },
  test: {
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    environment: "node",
  },
  fmt: {
    ignorePatterns: [
      "www/**",
      "src/client/routeTree.gen.ts",
      "dist/**",
      "data.json",
      "usage.json",
      "sessions.json",
    ],
  },
  lint: {
    ignorePatterns: ["src/client/routeTree.gen.ts", "dist/**", "www/**"],
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
  },
  staged: {
    "*.{ts,tsx,css,json}": "vp check --fix",
  },
});
