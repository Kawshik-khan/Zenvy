"use client";

import { ShieldCheck, Timer } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { ResetLayout } from "@/components/auth/ResetLayout";
import { useShake } from "@/components/motion/useShake";
import { Alert, Button, Input } from "@/components/ui";
import { requestPasswordReset, type ForgotPasswordState } from "./actions";

const RESEND_COOLDOWN_S = 30;
const LINK_LIFETIME_S = 60 * 60;

function useCountdown(from: number, key: unknown) {
  const [left, setLeft] = useState(from);
  useEffect(() => {
    setLeft(from);
    const started = Date.now();
    const timer = window.setInterval(() => setLeft(Math.max(0, from - Math.floor((Date.now() - started) / 1000))), 1000);
    return () => window.clearInterval(timer);
  }, [from, key]);
  return left;
}

const mmss = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

export function ForgotPasswordFlow() {
  const [state, formAction, pending] = useActionState<ForgotPasswordState, FormData>(requestPasswordReset, { status: "idle" });
  // "Use a different email" goes back to the form without a server round trip.
  const [editing, setEditing] = useState(false);
  const [sends, setSends] = useState(0);
  const cardRef = useShake<HTMLDivElement>(state.status === "error" ? state : null);

  useEffect(() => {
    if (state.status === "sent") {
      setEditing(false);
      setSends((value) => value + 1);
    }
  }, [state]);

  const sent = state.status === "sent" && !editing;
  const cooldown = useCountdown(RESEND_COOLDOWN_S, sends);
  const expiry = useCountdown(LINK_LIFETIME_S, sends);

  return (
    <ResetLayout step={sent ? 1 : 0}>
      <div ref={cardRef} className="flex flex-col gap-5">
        {sent && state.status === "sent" ? (
          <div key="sent" className="flex animate-nb-pop-in flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <h1 className="m-0 text-3xl font-bold tracking-tight md:text-4xl">Check your email</h1>
              <p className="m-0">
                If an account exists for <b className="break-all">{state.email}</b>, a reset link is on its way.
              </p>
            </div>
            <div role="timer" aria-live="off" className="flex items-center gap-3 rounded-nb border-nb bg-canvas px-4 py-3">
              <Timer size={20} aria-hidden="true" />
              <span className="flex-1">Link expires in</span>
              <b className="font-jetbrains text-xl tabular-nums">{mmss(expiry)}</b>
            </div>
            {sends > 1 && (
              <Alert tone="success" title="Sent again">
                Use the newest email. Older links no longer work.
              </Alert>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <form action={formAction}>
                <input type="hidden" name="email" value={state.email} />
                <Button type="submit" variant="secondary" disabled={cooldown > 0 || pending} loading={pending}>
                  {cooldown > 0 ? `Resend in ${mmss(cooldown)}` : "Resend link"}
                </Button>
              </form>
              <button type="button" onClick={() => setEditing(true)} className="nb-focus min-h-11 cursor-pointer rounded-nb px-2 font-bold text-fg underline underline-offset-4">
                Use a different email
              </button>
            </div>
            <p className="m-0 flex gap-2.5 rounded-nb bg-quiet-shade px-4 py-3 text-[15px]">
              <ShieldCheck size={20} aria-hidden="true" className="mt-0.5 shrink-0" />
              <span>
                <b>Didn&apos;t ask for this?</b> Ignore the email. Your password won&apos;t change unless someone opens the link.
              </span>
            </p>
          </div>
        ) : (
          <div key="request" className="flex animate-nb-pop-in flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <h1 className="m-0 text-3xl font-bold tracking-tight md:text-4xl">Forgot your password?</h1>
              <p className="m-0 text-fg-muted">Enter the email you signed up with and we&apos;ll send you a reset link.</p>
            </div>
            <form action={formAction} noValidate className="flex flex-col gap-4">
              <Input
                id="email"
                name="email"
                type="email"
                label="Email address"
                placeholder="you@university.edu"
                autoComplete="email"
                defaultValue={state.status === "sent" ? state.email : undefined}
                error={state.status === "error" ? state.emailError : undefined}
                required
              />
              {state.status === "error" && state.error && <Alert tone="error">{state.error}</Alert>}
              <Button type="submit" variant="chat" size="lg" fullWidth loading={pending}>
                {pending ? "Sending link" : "Send reset link"}
              </Button>
            </form>
            <p className="m-0 text-[15px]">
              Remembered it?{" "}
              <Link href="/login" className="nb-focus rounded-sm font-bold text-fg underline underline-offset-4">
                Sign in
              </Link>
            </p>
          </div>
        )}
      </div>
    </ResetLayout>
  );
}
