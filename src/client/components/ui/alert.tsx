import type { Component, ComponentProps, ValidComponent } from "solid-js";
import { splitProps } from "solid-js";
import * as AlertPrimitive from "@kobalte/core/alert";
import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { cn } from "@client/lib/utils.ts";

const alertVariants = cva("relative w-full rounded-[var(--r-well)] border px-3 py-2 text-sm", {
  variants: {
    variant: {
      default:
        "border-[var(--neon-blue-dim)] bg-[#071416] text-[var(--neon-blue)] shadow-[var(--glow-blue)]",
      warning:
        "border-[var(--watch-dim)] bg-[#1a1204] text-[var(--watch)] shadow-[var(--glow-amber)]",
      destructive: "border-[var(--crit-dim)] bg-[#160606] text-[#ffb4b4] shadow-[var(--glow-red)]",
      success: "border-[var(--neon-dim)] bg-[#071407] text-[var(--neon)] shadow-[var(--glow)]",
    },
  },
  defaultVariants: { variant: "default" },
});

type AlertRootProps<T extends ValidComponent = "div"> = AlertPrimitive.AlertRootProps<T> &
  VariantProps<typeof alertVariants> & { class?: string };

const Alert = <T extends ValidComponent = "div">(props: PolymorphicProps<T, AlertRootProps<T>>) => {
  const [local, others] = splitProps(props as AlertRootProps, ["class", "variant"]);
  return (
    <AlertPrimitive.Root
      class={cn(alertVariants({ variant: local.variant }), local.class)}
      {...others}
    />
  );
};

const AlertTitle: Component<ComponentProps<"h5">> = (props) => {
  const [local, others] = splitProps(props, ["class"]);
  return <h5 class={cn("mb-1 font-medium leading-none tracking-tight", local.class)} {...others} />;
};

const AlertDescription: Component<ComponentProps<"div">> = (props) => {
  const [local, others] = splitProps(props, ["class"]);
  return <div class={cn("text-sm [&_p]:leading-relaxed", local.class)} {...others} />;
};

export { Alert, AlertTitle, AlertDescription };
