"use client";

import { MailCheck } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useActionState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Alert, Button, ButtonLink, Card, Input } from "@/components/ui";
import { login } from "./actions";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-canvas" />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [state, formAction, pending] = useActionState(login, undefined);
  const searchParams = useSearchParams();
  const message = searchParams?.get("message");
  const error = searchParams?.get("error");
  const callbackUrl = searchParams?.get("callbackUrl") || "";

  return (
    <AuthShell
      action={
        <ButtonLink href="/register" variant="secondary" size="sm">
          Create account
        </ButtonLink>
      }
    >
      <Card shadow="lg" padding="lg" className="flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <h1 className="m-0 font-grotesk text-4xl font-bold tracking-tight">Welcome back</h1>
          <p className="m-0 text-fg-muted">Sign in to find your study partners.</p>
        </div>

        {message === "check-email" && (
          <Alert tone="success" icon={<MailCheck size={18} />} title="Check your inbox">
            We sent a verification link to your email.
          </Alert>
        )}
        {error === "Verification" && <Alert tone="warning">Verification failed or the link expired.</Alert>}

        <form action={formAction} className="flex flex-col gap-5">
          {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}
          <Input id="email" name="email" type="email" label="Email address" placeholder="you@university.edu" autoComplete="email" required />
          <Input id="password" name="password" type="password" label="Password" autoComplete="current-password" required />
          {state && <Alert tone="error">{state}</Alert>}
          <Button type="submit" size="lg" fullWidth loading={pending}>
            {pending ? "Signing in" : "Sign in"}
          </Button>
        </form>

        <p className="m-0 text-center text-[15px] text-fg-muted">
          New to Zenvy?{" "}
          <Link href="/register" className="nb-focus rounded-sm font-bold text-fg underline underline-offset-4">
            Create an account
          </Link>
        </p>
      </Card>
    </AuthShell>
  );
}
