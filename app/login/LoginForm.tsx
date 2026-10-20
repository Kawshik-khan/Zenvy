"use client";

import { MailCheck } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { useShake } from "@/components/motion/useShake";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { PasswordField } from "@/components/auth/PasswordField";
import { Alert, Button, Card, Input } from "@/components/ui";
import { login } from "./actions";

const oauthErrors: Record<string, string> = {
  OAuthAccountNotLinked: "This email already has a Zenvy password. Sign in with your email and password instead.",
  OAuthSignin: "We couldn't reach Google. Please try again.",
  OAuthCallback: "Google sign-in didn't finish. Please try again.",
  AccessDenied: "Google sign-in was cancelled.",
};

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const [state, formAction, pending] = useActionState(login, undefined);
  const searchParams = useSearchParams();
  const message = searchParams?.get("message");
  const error = searchParams?.get("error");
  const callbackUrl = searchParams?.get("callbackUrl") || "";
  // Shakes the card each time the server rejects the sign-in.
  const cardRef = useShake<HTMLDivElement>(state);

  return (
    <div ref={cardRef}>
    <Card shadow="lg" padding="lg" className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <span className="self-start rounded-md border-2 border-line bg-focus px-2.5 py-0.5 text-xs font-bold tracking-[0.08em] text-ink uppercase">Welcome back</span>
        <h1 className="m-0 font-grotesk text-4xl font-bold tracking-tight">Sign in to Zenvy</h1>
        <p className="m-0 text-fg-muted">Pick up where you left off with your study partners.</p>
      </div>

      {message === "check-email" && (
        <Alert tone="success" icon={<MailCheck size={18} />} title="Check your inbox">
          We sent a verification link to your email.
        </Alert>
      )}
      {message === "welcome" && (
        <Alert tone="success" title="Your account is ready">
          Sign in to set up your profile and see your first matches.
        </Alert>
      )}
      {message === "password-reset" && (
        <Alert tone="success" title="Password updated">
          Sign in with your new password.
        </Alert>
      )}
      {error === "Verification" && <Alert tone="warning">Verification failed or the link expired.</Alert>}
      {error && oauthErrors[error] && <Alert tone="error">{oauthErrors[error]}</Alert>}

      {googleEnabled && <GoogleButton callbackUrl={callbackUrl || undefined} dividerLabel="or sign in with email" />}

      <form action={formAction} className="flex flex-col gap-5">
        {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}
        <Input id="email" name="email" type="email" label="Email address" placeholder="you@university.edu" autoComplete="email" required />
        <PasswordField
          id="password"
          name="password"
          label="Password"
          autoComplete="current-password"
          labelAside={
            <Link href="/forgot-password" className="nb-focus rounded-sm text-[15px] font-bold text-fg underline underline-offset-4">
              Forgot password?
            </Link>
          }
        />
        {state && <Alert tone="error">{state}</Alert>}
        <Button type="submit" size="lg" fullWidth loading={pending}>
          {pending ? "Signing in" : "Sign in"}
        </Button>
      </form>

      <div className="flex items-center gap-3 text-sm font-medium text-fg-muted">
        <span aria-hidden="true" className="h-[3px] flex-1 rounded-full bg-line" />
        New to Zenvy?
        <span aria-hidden="true" className="h-[3px] flex-1 rounded-full bg-line" />
      </div>
      <Link href="/register" className="nb-focus nb-press inline-flex min-h-13 items-center justify-center rounded-nb border-nb bg-match px-5 py-2 text-center font-bold text-ink no-underline shadow-nb">
        Create an account and find a match
      </Link>
    </Card>
    </div>
  );
}
