import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function VerifyState({
  icon,
  title,
  message,
  href,
  action,
  tone = "primary",
}: {
  icon: string;
  title: string;
  message: string;
  href?: string;
  action?: string;
  tone?: "primary" | "error" | "success";
}) {
  const iconClass = tone === "error" ? "text-error" : tone === "success" ? "text-accent-green" : "text-primary";

  return (
    <div className="app-aurora flex min-h-screen items-center justify-center px-4 py-12">
      <div className="glass-panel w-full max-w-md rounded-[32px] p-8 text-center md:p-10">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-outline-variant/30 bg-surface/55">
          <span className={`material-symbols-outlined text-5xl ${iconClass}`}>{icon}</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-on-surface">{title}</h1>
        <p className="mt-4 text-sm leading-relaxed text-on-surface-variant">{message}</p>
        {href && action && (
          <Link href={href} className="app-primary-button mt-8 inline-flex w-full items-center justify-center rounded-full px-8 py-4 text-sm font-black">
            {action}
          </Link>
        )}
      </div>
    </div>
  );
}

export default async function VerifyPage(props: { searchParams: Promise<{ token?: string }> }) {
  const searchParams = await props.searchParams;
  const token = searchParams.token;

  if (!token) {
    return (
      <VerifyState
        icon="error"
        title="Missing Token"
        message="The verification link is invalid. Please check your email again."
        href="/login"
        action="Back to Login"
        tone="error"
      />
    );
  }

  const existingToken = await prisma.verificationToken.findUnique({ where: { token } });

  if (!existingToken || existingToken.expires < new Date()) {
    return (
      <VerifyState
        icon="hourglass_disabled"
        title="Link Expired"
        message="This verification link has expired or has already been used."
        href="/register"
        action="Try Registering Again"
        tone="error"
      />
    );
  }

  const user = await prisma.user.findUnique({ where: { email: existingToken.email } });

  if (!user) {
    return (
      <VerifyState
        icon="person_off"
        title="User Not Found"
        message="We could not find a user associated with this verification token."
        tone="error"
      />
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: new Date() },
  });

  await prisma.verificationToken.delete({
    where: { id: existingToken.id },
  });

  return (
    <VerifyState
      icon="check_circle"
      title="Account Verified"
      message="Your Zenvy account is active. You can now sign in and join your peers."
      href="/login"
      action="Sign In Now"
      tone="success"
    />
  );
}
