import { connection } from "next/server";
import { AuthSplit } from "@/components/auth/AuthSplit";
import { ButtonLink } from "@/components/ui";
import { isGoogleEnabled } from "@/lib/auth-providers";
import { isEnabled } from "@/lib/flags";
import { RegisterForm } from "./RegisterForm";

export default async function RegisterPage() {
  // Feature switches come from env vars at request time, so they can change without a rebuild.
  await connection();
  return (
    <AuthSplit
      jobsEnabled={isEnabled("jobs")}
      action={
        <ButtonLink href="/login" variant="secondary" size="sm">
          Sign in
        </ButtonLink>
      }
    >
      <RegisterForm googleEnabled={isGoogleEnabled()} />
    </AuthSplit>
  );
}
