import { connection } from "next/server";
import { Suspense } from "react";
import { AuthSplit } from "@/components/auth/AuthSplit";
import { ButtonLink } from "@/components/ui";
import { isGoogleEnabled } from "@/lib/auth-providers";
import { isEnabled } from "@/lib/flags";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  // Feature switches come from env vars at request time, so they can change without a rebuild.
  await connection();
  return (
    <AuthSplit
      jobsEnabled={isEnabled("jobs")}
      action={
        <ButtonLink href="/register" variant="secondary" size="sm">
          Create account
        </ButtonLink>
      }
    >
      <Suspense fallback={null}>
        <LoginForm googleEnabled={isGoogleEnabled()} />
      </Suspense>
    </AuthSplit>
  );
}
