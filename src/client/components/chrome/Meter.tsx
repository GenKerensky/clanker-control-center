import { createEffect, createSignal, onCleanup, type JSX } from "solid-js";
import { animate } from "motion";
import { motionPresets, springOrInstant } from "@client/lib/motion.tsx";

export function Meter(props: {
  remaining: number;
  label: string;
  tone?: "ready" | "watch" | "critical";
}): JSX.Element {
  const clamped = () => Math.max(0, Math.min(100, Number(props.remaining) || 0));
  const [angle, setAngle] = createSignal(180 - (clamped() / 100) * 180);

  createEffect(() => {
    const target = 180 - (clamped() / 100) * 180;
    const from = { a: angle() };
    const controls = animate(from, { a: target }, {
      ...springOrInstant(motionPresets.needle),
      onUpdate: () => setAngle(from.a),
    } as never);
    onCleanup(() => controls.stop());
  });

  const needle = () => {
    const rad = (angle() * Math.PI) / 180;
    return { x2: 100 + 72 * Math.cos(rad), y2: 100 - 72 * Math.sin(rad) };
  };

  const stroke = () =>
    props.tone === "critical"
      ? "var(--crit)"
      : props.tone === "watch"
        ? "var(--watch)"
        : "var(--neon)";

  const tick = (pct: number) => {
    const deg = 180 - (pct / 100) * 180;
    const rad = (deg * Math.PI) / 180;
    const x1 = 100 + 68 * Math.cos(rad);
    const y1 = 100 - 68 * Math.sin(rad);
    const x2 = 100 + 80 * Math.cos(rad);
    const y2 = 100 - 80 * Math.sin(rad);
    const lx = 100 + 90 * Math.cos(rad);
    const ly = 100 - 90 * Math.sin(rad);
    return { x1, y1, x2, y2, lx, ly, pct };
  };

  return (
    <svg
      viewBox="0 0 200 120"
      class="mx-auto block w-full max-w-[240px]"
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped()}
      aria-label={`${props.label} remaining`}
    >
      <path
        d="M 20 100 A 80 80 0 0 1 180 100"
        fill="none"
        stroke="var(--metal-mid)"
        stroke-width="10"
        stroke-linecap="round"
      />
      <path
        d="M 20 100 A 80 80 0 0 1 180 100"
        fill="none"
        stroke={stroke()}
        stroke-width="4"
        stroke-linecap="round"
        opacity="0.85"
      />
      {[0, 25, 50, 75, 100].map(tick).map((t) => (
        <>
          <line x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="var(--muted)" stroke-width="1" />
          <text x={t.lx} y={t.ly} fill="var(--muted)" font-size="8" text-anchor="middle">
            {t.pct}
          </text>
        </>
      ))}
      <line
        x1="100"
        y1="100"
        x2={needle().x2}
        y2={needle().y2}
        stroke={stroke()}
        stroke-width="2"
        stroke-linecap="round"
      />
      <circle cx="100" cy="100" r="4" fill={stroke()} />
    </svg>
  );
}
