import type { JSX } from "solid-js";

export type LedTone = "idle" | "ready" | "busy" | "fault" | "info";

const glow: Record<LedTone, string> = {
  idle: "none",
  ready: "var(--glow)",
  busy: "var(--glow-amber)",
  fault: "var(--glow-red)",
  info: "var(--glow-blue)",
};

const fill: Record<LedTone, string> = {
  idle: "radial-gradient(circle at 35% 30%, #3a4338, #161816)",
  ready: "radial-gradient(circle at 35% 30%, #c8ff8a, var(--neon) 55%, #0b3d08)",
  busy: "radial-gradient(circle at 35% 30%, #ffe08a, var(--watch) 55%, #7a5200)",
  fault: "radial-gradient(circle at 35% 30%, #ff9a9a, var(--crit) 55%, #5a0808)",
  info: "radial-gradient(circle at 35% 30%, #c8fbff, var(--neon-blue) 55%, #0a6a75)",
};

export function Led(props: { tone: LedTone; label: string; class?: string }): JSX.Element {
  const pulse = () => (props.tone === "busy" ? "led-pulse" : "");
  return (
    <span class={`inline-flex items-center gap-1.5 ${props.class || ""}`}>
      <span
        class={`inline-block size-2 rounded-full ${pulse()}`}
        style={{ background: fill[props.tone], "box-shadow": glow[props.tone] }}
        title={props.label}
        aria-label={props.label}
      />
      <span class="text-[10px] tracking-[0.1em] text-[var(--muted)] uppercase">{props.label}</span>
    </span>
  );
}

export function jobTone(
  running: boolean,
  error: string | null | undefined,
  ready?: boolean,
): LedTone {
  if (error) return "fault";
  if (running) return "busy";
  if (ready) return "ready";
  return "idle";
}
