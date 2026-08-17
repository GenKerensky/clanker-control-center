import type { JSX } from "solid-js";

export function Screw(props: { class?: string }): JSX.Element {
  return (
    <span
      class={`inline-block size-2 rounded-full ${props.class || ""}`}
      style={{
        background: "radial-gradient(circle at 35% 30%, var(--screw), #2a2e28 70%)",
        "box-shadow": "inset 0 1px 0 rgba(255,255,255,0.25), 0 1px 1px #000",
      }}
      aria-hidden="true"
    >
      <span
        class="block h-full w-full"
        style={{
          background:
            "linear-gradient(115deg, transparent 44%, var(--screw-slot) 44% 56%, transparent 56%)",
        }}
      />
    </span>
  );
}
