"use client";

import { Hash, Heart, Users } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Alert, Button, ButtonLink, Card, Input } from "@/components/ui";
import { signUp } from "./actions";

const perks = [
  { icon: <Heart size={22} />, text: "Get matched with students who share your major, courses and free time" },
  { icon: <Users size={22} />, text: "Join study groups and start calls with them" },
  { icon: <Hash size={22} />, text: "Follow channels for your courses and topics" },
];

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(signUp, null);

  return (
    <AuthShell
      width="xl"
      action={
        <ButtonLink href="/login" variant="secondary" size="sm">
          Sign in
        </ButtonLink>
      }
    >
      <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.1fr]">
        <section className="hidden flex-col gap-6 lg:flex">
          <h1 className="m-0 font-grotesk text-5xl leading-[1.05] font-bold tracking-tight">Build your study network in minutes.</h1>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {perks.map((perk) => (
              <li key={perk.text}>
                <Card tone="card" padding="sm" shadow="sm" className="flex items-center gap-3">
                  <span aria-hidden="true" className="inline-flex size-11 shrink-0 items-center justify-center rounded-nb border-nb bg-match text-ink">
                    {perk.icon}
                  </span>
                  <span className="font-medium">{perk.text}</span>
                </Card>
              </li>
            ))}
          </ul>
        </section>

        <Card shadow="lg" padding="lg" className="flex w-full max-w-2xl flex-col gap-6 justify-self-center lg:justify-self-end">
          <div className="flex flex-col gap-1.5">
            <h2 className="m-0 font-grotesk text-4xl font-bold tracking-tight lg:text-3xl">Create your account</h2>
            <p className="m-0 text-fg-muted">Start with your account. You will add your study details right after you sign in.</p>
          </div>

          <form action={formAction} className="flex flex-col gap-5">
            <Input id="name" name="name" type="text" label="Full name" placeholder="Your full name" autoComplete="name" required />
            <Input id="email" name="email" type="email" label="Email address" placeholder="you@university.edu" autoComplete="email" required />
            <Input
              id="password"
              name="password"
              type="password"
              label="Password"
              autoComplete="new-password"
              hint="At least 8 characters, with one uppercase letter and one number."
              required
            />
            {state?.error && <Alert tone="error">{state.error}</Alert>}
            <Button type="submit" variant="match" size="lg" fullWidth loading={pending}>
              {pending ? "Creating account" : "Create account"}
            </Button>
          </form>

          <p className="m-0 text-center text-[15px] text-fg-muted">
            Already have an account?{" "}
            <Link href="/login" className="nb-focus rounded-sm font-bold text-fg underline underline-offset-4">
              Sign in
            </Link>
          </p>
        </Card>
      </div>
    </AuthShell>
  );
}
