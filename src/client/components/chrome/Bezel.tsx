import type { JSX } from "solid-js";
import { Screw } from "./Screw.tsx";

export function Bezel(props: {
  title?: string;
  children: JSX.Element;
  class?: string;
}): JSX.Element {
  return (
    <section
      class={`relative rounded-[var(--r-plate)] border-2 border-[var(--bezel)] bg-[var(--bg-plate)] p-4 shadow-[var(--shadow-plate)] ${props.class || ""}`}
    >
      <Screw class="absolute top-2 left-2" />
      <Screw class="absolute top-2 right-2" />
      {props.title ? (
        <h2 class="mb-3 pr-6 text-[11px] font-medium tracking-[0.12em] text-[var(--muted)] uppercase">
          {props.title}
        </h2>
      ) : null}
      <div class="rounded-[var(--r-well)] bg-[var(--bg-well)] p-3 shadow-[var(--shadow-inset)]">
        {props.children}
      </div>
    </section>
  );
}
