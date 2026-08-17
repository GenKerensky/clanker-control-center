import type { JSX } from "solid-js";
import { Button } from "@client/components/ui/button.tsx";

export function ChassisSwitch(props: {
  label: string;
  disabled?: boolean;
  onPress: () => void;
}): JSX.Element {
  return (
    <Button
      variant="chassis"
      size="sm"
      class="min-h-11 px-4"
      disabled={props.disabled}
      onClick={props.onPress}
    >
      {props.label}
    </Button>
  );
}
