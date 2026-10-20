"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { PasswordField } from "@/components/auth/PasswordField";
import { ResetLayout } from "@/components/auth/ResetLayout";
import { useShake } from "@/components/motion/useShake";
import { Alert, Button, buttonClasses, ButtonLink } from "@/components/ui";
import { resetPassword, type ResetPasswordState } from "./actions";

export function ResetPasswordFlow({ token, email }: { token: string; email: string }) {
  const [state, formAction, pending] = useActionState<ResetPasswordState, FormData>(resetPassword, { status: "idle" });
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [visible, setVisible] = useState(false);
  const cardRef = useShake<HTMLDivElement>(state.status === "error" ? state : null);

  if (state.status === "expired") return <ResetLinkExpired />;

  if (state.status === "done") {
    return (
      <ResetLayout step={3}>
        <div className="flex animate-nb-pop-in flex-col items-start gap-4">
          <h1 className="m-0 text-3xl font-bold tracking-tight md:text-4xl">Password updated</h1>
          <p className="m-0">You can sign in with your new password now. A password manager is a good place to keep it.</p>
          <Link href="/login?message=password-reset" className={buttonClasses({ variant: "chat", size: "lg" })}>
            Sign in
            <ArrowRight size={20} aria-hidden="true" />
          </Link>
        </div>
      </ResetLayout>
    );
  }

  const errors = state.status === "error" ? state : undefined;
  const matches = confirm.length > 0 && confirm === password;

  return (
    <ResetLayout step={2}>
      <div ref={cardRef} className="flex animate-nb-pop-in flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <h1 className="m-0 text-3xl font-bold tracking-tight md:text-4xl">Set a new password</h1>
          <p className="m-0 text-fg-muted">
            For <b className="break-all text-fg">{email}</b>.
          </p>
        </div>
        <form action={formAction} noValidate className="flex flex-col gap-4">
          <input type="hidden" name="token" value={token} />
          <PasswordField
            id="password"
            name="password"
            label="New password"
            autoComplete="new-password"
            feedback="checklist"
            value={password}
            onValueChange={setPassword}
            visible={visible}
            onVisibleChange={setVisible}
            error={errors?.passwordError}
          />
          <div className="flex flex-col gap-1.5">
            <PasswordField
              id="confirm"
              name="confirm"
              label="Confirm new password"
              autoComplete="new-password"
              value={confirm}
              onValueChange={setConfirm}
              visible={visible}
              onVisibleChange={setVisible}
              error={errors?.confirmError}
            />
            {matches && !errors?.confirmError && <p className="m-0 animate-nb-rise text-sm font-bold">✓ Passwords match</p>}
          </div>
          {errors?.error && <Alert tone="error">{errors.error}</Alert>}
          <Button type="submit" variant="chat" size="lg" fullWidth loading={pending}>
            {pending ? "Saving" : "Save new password"}
          </Button>
        </form>
      </div>
    </ResetLayout>
  );
}

export function ResetLinkExpired() {
  return (
    <ResetLayout step={1}>
      <div className="flex animate-nb-pop-in flex-col items-start gap-4">
        <h1 className="m-0 text-3xl font-bold tracking-tight md:text-4xl">This link has expired</h1>
        <p className="m-0">Reset links work once and only for an hour. Ask for a new one and use the newest email.</p>
        <ButtonLink href="/forgot-password" variant="chat" size="lg">
          Send a new link
        </ButtonLink>
      </div>
    </ResetLayout>
  );
}
