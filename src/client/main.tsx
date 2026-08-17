import { render } from "solid-js/web";
import { QueryClientProvider } from "@tanstack/solid-query";
import { RouterProvider, createHashHistory, createRouter } from "@tanstack/solid-router";
import { routeTree } from "./routeTree.gen.ts";
import { createQueryClient } from "./lib/query.ts";
import "./styles/app.css";

const history =
  typeof location !== "undefined" && location.protocol === "file:"
    ? createHashHistory()
    : undefined;

const router = createRouter({
  routeTree,
  history,
});

declare module "@tanstack/solid-router" {
  interface Register {
    router: typeof router;
  }
}

const queryClient = createQueryClient();

if (typeof navigator !== "undefined" && !navigator.userAgent.includes("Electron")) {
  void import("virtual:pwa-register").then(({ registerSW }) => {
    registerSW({ immediate: true });
  });
}

const root = document.getElementById("app");
if (!root) throw new Error("#app missing");

render(
  () => (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  ),
  root,
);
