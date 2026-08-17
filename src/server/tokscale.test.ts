import { describe, expect, it } from "vite-plus/test";
import { graphArgs, sessionsArgs, tuiArgs, usageArgs } from "./tokscale.ts";

describe("tokscale argv", () => {
  it("graph writes to the tmp path", () => {
    expect(graphArgs("/tmp/data.json.tmp")).toEqual([
      "graph",
      "--output",
      "/tmp/data.json.tmp",
      "--no-spinner",
    ]);
  });

  it("tui write includes --light --write-cache --group-by model", () => {
    expect(tuiArgs()).toEqual([
      "models",
      "--light",
      "--write-cache",
      "--no-spinner",
      "--group-by",
      "model",
    ]);
  });

  it("sessions groups by client,session,model", () => {
    expect(sessionsArgs()).toEqual([
      "models",
      "--json",
      "--group-by",
      "client,session,model",
      "--no-spinner",
    ]);
  });

  it("usage is --json", () => {
    expect(usageArgs()).toEqual(["usage", "--json"]);
  });
});
