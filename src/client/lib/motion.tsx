import { animate } from "motion";
import { createEffect, onCleanup, type JSX } from "solid-js";

export const motionPresets = {
  switchThrow: { type: "spring", stiffness: 520, damping: 32 },
  needle: { type: "spring", stiffness: 180, damping: 22 },
  ledBloom: { duration: 0.18, ease: "easeOut" },
  panelIn: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
  stamp: { duration: 0.12, ease: "linear" },
} as const;

function reducedMotion(): boolean {
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function springOrInstant<T extends Record<string, unknown>>(
  preset: T,
): T | { duration: number } {
  if (reducedMotion()) return { duration: 0.01 };
  return preset;
}

export function Motion(props: {
  class?: string;
  children?: JSX.Element;
  initial?: Record<string, number>;
  animate?: Record<string, number>;
  transition?: Record<string, unknown>;
}): JSX.Element {
  let ref: HTMLDivElement | undefined = undefined;
  createEffect(() => {
    const next = props.animate;
    if (!ref || !next) return;
    const controls = animate(ref, next, (props.transition || motionPresets.panelIn) as never);
    onCleanup(() => controls.stop());
  });
  return (
    <div
      ref={(el) => {
        ref = el ?? undefined;
      }}
      class={props.class}
      style={
        props.initial
          ? {
              opacity: props.initial.opacity ?? 1,
              transform: `translateY(${props.initial.y ?? 0}px)`,
            }
          : undefined
      }
    >
      {props.children}
    </div>
  );
}

export function Presence(props: { show: boolean; children: JSX.Element }): JSX.Element {
  return props.show ? <>{props.children}</> : null;
}
