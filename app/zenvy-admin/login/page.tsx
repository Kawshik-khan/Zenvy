"use client";

import React, { useActionState } from "react";
import { ShieldCheck } from "lucide-react";
import { login } from "@/app/login/actions";
import { AuthShell } from "@/components/auth/AuthShell";
import { Alert, Button, ButtonLink, Card, Input } from "@/components/ui";

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <AuthShell
      action={
        <ButtonLink href="/" variant="secondary" size="sm">
          Back to main site
        </ButtonLink>
      }
    >
      <Card shadow="lg" padding="lg" className="flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <p className="m-0 flex items-center gap-2 font-grotesk text-sm font-bold tracking-wide uppercase">
            <ShieldCheck aria-hidden="true" size={18} />
            Admin portal
          </p>
          <h1 className="m-0 font-grotesk text-4xl font-bold tracking-tight">System access</h1>
          <p className="m-0 text-fg-muted">Authorized personnel only.</p>
        </div>

        <form action={formAction} className="flex flex-col gap-5">
          <Input id="email" name="email" type="email" label="Admin email" placeholder="admin@zenvy.edu" autoComplete="email" required />
          <Input id="password" name="password" type="password" label="Password" autoComplete="current-password" required />
          <input type="hidden" name="callbackUrl" value="/zenvy-admin" />
          {state && <Alert tone="error">{state}</Alert>}
          <Button type="submit" size="lg" fullWidth loading={pending}>
            {pending ? "Verifying" : "Sign in"}
          </Button>
        </form>
      </Card>
    </AuthShell>
  );
}
