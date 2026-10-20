"use client";

import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useShake } from "@/components/motion/useShake";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { PasswordField } from "@/components/auth/PasswordField";
import { Alert, Button, Card, Input } from "@/components/ui";
import { signUp } from "./actions";

export function RegisterForm({ googleEnabled }: { googleEnabled: boolean }) {
  const [state, formAction, pending] = useActionState(signUp, null);
  const errors = state?.fieldErrors ?? {};
  const cardRef = useShake<HTMLDivElement>(state);
  // Typing in a field clears its server error, so a fixed field stops shouting.
  const [cleared, setCleared] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (state) setCleared({});
  }, [state]);

  const errorFor = (field: "name" | "email" | "password") => (cleared[field] ? undefined : errors[field]);
  const clear = (field: string) => () => setCleared((value) => (value[field] ? value : { ...value, [field]: true }));

  return (
    <div ref={cardRef}>
    <Card shadow="lg" padding="lg" className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <span className="self-start rounded-md border-2 border-line bg-live px-2.5 py-0.5 text-xs font-bold tracking-[0.08em] text-ink uppercase">Free for students</span>
        <h1 className="m-0 font-grotesk text-4xl font-bold tracking-tight">Create your account</h1>
        <p className="m-0 text-fg-muted">It takes a minute. You&apos;ll add your courses right after.</p>
      </div>

      {googleEnabled && <GoogleButton callbackUrl="/onboarding" dividerLabel="or sign up with email" />}

      <form action={formAction} noValidate className="flex flex-col gap-5">
        <Input
          id="name"
          name="name"
          type="text"
          label="Full name"
          placeholder="Your full name"
          autoComplete="name"
          defaultValue={state?.values?.name}
          error={errorFor("name")}
          onChange={clear("name")}
          required
        />
        <Input
          id="email"
          name="email"
          type="email"
          label="University email"
          placeholder="you@university.edu"
          autoComplete="email"
          defaultValue={state?.values?.email}
          hint="Use your university email so classmates can find you."
          error={errorFor("email")}
          onChange={clear("email")}
          required
        />
        <div onChange={clear("password")}>
          <PasswordField id="password" name="password" label="Password" autoComplete="new-password" feedback="meter" error={errorFor("password")} />
          <p className="m-0 mt-1.5 text-sm text-fg-muted">At least 8 characters, with one uppercase letter and one number.</p>
        </div>
        {state?.error && <Alert tone="error">{state.error}</Alert>}
        <Button type="submit" variant="match" size="lg" fullWidth loading={pending}>
          {pending ? "Creating account" : "Create account"}
        </Button>
      </form>

      <p className="m-0 flex items-start gap-2 text-sm text-fg-muted">
        <ShieldCheck size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-fg" />
        Only students on Zenvy can message you, and you can block or report anyone.
      </p>

      <p className="m-0 text-center text-[15px] text-fg-muted">
        Already have an account?{" "}
        <Link href="/login" className="nb-focus rounded-sm font-bold text-fg underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </Card>
    </div>
  );
}
