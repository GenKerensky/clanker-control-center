import type { JSX, ValidComponent } from "solid-js";
import { splitProps } from "solid-js";
import type { PolymorphicProps } from "@kobalte/core";
import * as SwitchPrimitive from "@kobalte/core/switch";
import { cn } from "@client/lib/utils.ts";

const Switch = SwitchPrimitive.Root;
const SwitchDescription = SwitchPrimitive.Description;
const SwitchErrorMessage = SwitchPrimitive.ErrorMessage;

type SwitchControlProps = SwitchPrimitive.SwitchControlProps & {
  class?: string;
  children?: JSX.Element;
};

const SwitchControl = <T extends ValidComponent = "input">(
  props: PolymorphicProps<T, SwitchControlProps>,
) => {
  const [local, others] = splitProps(props as SwitchControlProps, ["class", "children"]);
  return (
    <>
      <SwitchPrimitive.Input class="[&:focus-visible+div]:ring-2 [&:focus-visible+div]:ring-ring [&:focus-visible+div]:outline-none" />
      <SwitchPrimitive.Control
        class={cn(
          "inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border border-[var(--metal-hi)] bg-[linear-gradient(180deg,#2a3028,#141814)] shadow-[var(--shadow-switch)] transition-colors data-[checked]:bg-[var(--neon-deep)] data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40",
          local.class,
        )}
        {...others}
      >
        {local.children}
      </SwitchPrimitive.Control>
    </>
  );
};

type SwitchThumbProps = SwitchPrimitive.SwitchThumbProps & { class?: string };

const SwitchThumb = <T extends ValidComponent = "div">(
  props: PolymorphicProps<T, SwitchThumbProps>,
) => {
  const [local, others] = splitProps(props as SwitchThumbProps, ["class"]);
  return (
    <SwitchPrimitive.Thumb
      class={cn(
        "pointer-events-none block size-5 translate-x-0.5 rounded-full bg-[linear-gradient(180deg,#e8f5e4,#9aa896)] shadow-md transition-transform data-[checked]:translate-x-[22px] data-[checked]:bg-[var(--neon)]",
        local.class,
      )}
      {...others}
    />
  );
};

type SwitchLabelProps = SwitchPrimitive.SwitchLabelProps & { class?: string };

const SwitchLabel = <T extends ValidComponent = "label">(
  props: PolymorphicProps<T, SwitchLabelProps>,
) => {
  const [local, others] = splitProps(props as SwitchLabelProps, ["class"]);
  return (
    <SwitchPrimitive.Label
      class={cn("text-sm font-medium leading-none data-[disabled]:opacity-70", local.class)}
      {...others}
    />
  );
};

export { Switch, SwitchControl, SwitchThumb, SwitchLabel, SwitchDescription, SwitchErrorMessage };
