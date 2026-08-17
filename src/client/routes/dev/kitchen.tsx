import { For, Show } from "solid-js";
import { createFileRoute, Navigate } from "@tanstack/solid-router";
import { Bargraph } from "@client/components/chrome/Bargraph.tsx";
import { Bezel } from "@client/components/chrome/Bezel.tsx";
import { Led } from "@client/components/chrome/Led.tsx";
import { Meter } from "@client/components/chrome/Meter.tsx";
import { Screw } from "@client/components/chrome/Screw.tsx";
import { ChassisSwitch } from "@client/components/chrome/Switch.tsx";
import { Alert, AlertDescription } from "@client/components/ui/alert.tsx";

const SWATCHES = [
  ["neon", "var(--neon)"],
  ["blue", "var(--neon-blue)"],
  ["pink", "var(--neon-pink)"],
  ["yellow", "var(--neon-yellow)"],
  ["watch", "var(--watch)"],
  ["crit", "var(--crit)"],
];

function Kitchen() {
  return (
    <Show when={import.meta.env.DEV} fallback={<Navigate to="/" />}>
      <div class="grid gap-4">
        <Bezel title="Screws + LEDs">
          <div class="flex flex-wrap items-center gap-4">
            <Screw />
            <Led tone="idle" label="idle" />
            <Led tone="ready" label="ready" />
            <Led tone="busy" label="busy" />
            <Led tone="fault" label="fault" />
            <Led tone="info" label="info" />
          </div>
        </Bezel>
        <Bezel title="Meter 64%">
          <Meter remaining={64} label="Session" tone="ready" />
        </Bezel>
        <Bezel title="Bargraph 40%">
          <Bargraph remaining={40} label="Weekly" tone="watch" />
        </Bezel>
        <Bezel title="Switch">
          <ChassisSwitch label="Throw" onPress={() => undefined} />
        </Bezel>
        <Bezel title="Banners">
          <div class="grid gap-2">
            <Alert variant="warning">
              <AlertDescription>Refreshing quotas…</AlertDescription>
            </Alert>
            <Alert variant="destructive">
              <AlertDescription>tokscale usage exited 1; see usage.log</AlertDescription>
            </Alert>
            <Alert variant="success">
              <AlertDescription>Quotas refreshed</AlertDescription>
            </Alert>
          </div>
        </Bezel>
        <Bezel title="Swatches">
          <div class="flex flex-wrap gap-3">
            <For each={SWATCHES}>
              {([name, color]) => (
                <span class="flex items-center gap-2 text-xs">
                  <span
                    class="size-6 rounded-sm border border-[var(--bezel)]"
                    style={{ background: color }}
                  />
                  {name}
                </span>
              )}
            </For>
          </div>
        </Bezel>
      </div>
    </Show>
  );
}

export const Route = createFileRoute("/dev/kitchen")({
  component: Kitchen,
});
