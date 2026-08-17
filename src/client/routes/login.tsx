import { createEffect } from "solid-js";
import { createFileRoute, useNavigate } from "@tanstack/solid-router";
import { Bezel } from "@client/components/chrome/Bezel.tsx";
import { ChassisSwitch } from "@client/components/chrome/Switch.tsx";
import { useStatusQuery } from "@client/lib/data.ts";

function LoginPage() {
  const status = useStatusQuery();
  const navigate = useNavigate();
  createEffect(() => {
    if (status.data && !status.data.authEnabled) void navigate({ to: "/" });
    if (status.data?.authenticated) void navigate({ to: "/" });
  });
  return (
    <div class="mx-auto max-w-md pt-10">
      <Bezel title="Sign in">
        <p class="mb-4 text-sm text-[var(--muted)]">GitHub allowlist. read:user only.</p>
        <ChassisSwitch
          label="Sign in with GitHub"
          onPress={() => {
            window.location.href = "/auth/github";
          }}
        />
      </Bezel>
    </div>
  );
}

export const Route = createFileRoute("/login")({
  component: LoginPage,
});
