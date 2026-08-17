import type { JSX } from "solid-js";
import { Screw } from "./Screw.tsx";

export function Chassis(props: { children: JSX.Element }): JSX.Element {
  return (
    <div class="mx-auto min-h-dvh max-w-[1280px] p-3 md:p-4">
      <div
        class="relative min-h-[calc(100dvh-1.5rem)] rounded-[18px] border border-[var(--bezel)] p-3 md:p-4"
        style={{
          background: "linear-gradient(180deg, #121512 0%, var(--bg-chassis) 40%, #090b09 100%)",
          "box-shadow": "var(--shadow-plate)",
        }}
      >
        <Screw class="absolute top-2 left-2" />
        <Screw class="absolute top-2 right-2" />
        <Screw class="absolute bottom-2 left-2" />
        <Screw class="absolute right-2 bottom-2" />
        {props.children}
      </div>
    </div>
  );
}
