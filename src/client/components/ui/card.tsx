import type { Component, ComponentProps } from "solid-js";
import { splitProps } from "solid-js";
import { cn } from "@client/lib/utils.ts";

const Card: Component<ComponentProps<"div">> = (props) => {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <div
      class={cn(
        "rounded-[var(--r-plate)] border border-[var(--bezel)] bg-[var(--bg-plate)] text-card-foreground shadow-[var(--shadow-plate)]",
        local.class,
      )}
      {...others}
    />
  );
};

const CardHeader: Component<ComponentProps<"div">> = (props) => {
  const [local, others] = splitProps(props, ["class"]);
  return <div class={cn("flex flex-col space-y-1.5 p-5", local.class)} {...others} />;
};

const CardTitle: Component<ComponentProps<"h3">> = (props) => {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <h3
      class={cn(
        "text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--muted)]",
        local.class,
      )}
      {...others}
    />
  );
};

const CardDescription: Component<ComponentProps<"p">> = (props) => {
  const [local, others] = splitProps(props, ["class"]);
  return <p class={cn("text-sm text-muted-foreground", local.class)} {...others} />;
};

const CardContent: Component<ComponentProps<"div">> = (props) => {
  const [local, others] = splitProps(props, ["class"]);
  return <div class={cn("p-5 pt-0", local.class)} {...others} />;
};

const CardFooter: Component<ComponentProps<"div">> = (props) => {
  const [local, others] = splitProps(props, ["class"]);
  return <div class={cn("flex items-center p-5 pt-0", local.class)} {...others} />;
};

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
