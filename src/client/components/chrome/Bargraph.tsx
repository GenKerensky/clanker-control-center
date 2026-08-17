import { For, type JSX } from "solid-js";

export function litSegments(remaining: number): number {
  return Math.max(0, Math.min(12, Math.round((remaining / 100) * 12)));
}

export function Bargraph(props: {
  remaining: number;
  label: string;
  tone?: "ready" | "watch" | "critical";
}): JSX.Element {
  const lit = () => litSegments(props.remaining);
  const color = () =>
    props.tone === "critical"
      ? "var(--crit)"
      : props.tone === "watch"
        ? "var(--watch)"
        : "var(--neon)";
  return (
    <div
      class="flex h-4 items-end gap-0.5"
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={props.remaining}
      aria-label={`${props.label} remaining`}
    >
      <For each={Array.from({ length: 12 }, (_, i) => i)}>
        {(i) => (
          <span
            class="w-1.5 rounded-[1px]"
            style={{
              height: `${8 + i}px`,
              background: i < lit() ? color() : "var(--bg-inset)",
              "box-shadow": i < lit() ? "0 0 6px currentColor" : "none",
              color: color(),
            }}
          />
        )}
      </For>
    </div>
  );
}
