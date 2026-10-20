"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { emailSchema } from "@/lib/password";
import { createPasswordResetToken } from "@/lib/password-reset";
import { rateLimit } from "@/lib/rateLimit";
import { resend } from "@/lib/resend";

export type ForgotPasswordState = { status: "idle" } | { status: "sent"; email: string } | { status: "error"; emailError?: string; error?: string };

async function appOrigin() {
  const configured = process.env.AUTH_URL || process.env.NEXTAUTH_URL;
  if (configured) return configured.replace(/\/+$/, "");
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host");
  const proto = requestHeaders.get("x-forwarded-proto") || "http";
  return `${proto}://${host}`;
}

/**
 * Emails a one-hour reset link. Always answers "sent" for a well-formed email, whether or not
 * an account exists, so the form can't be used to find out who has signed up.
 */
export async function requestPasswordReset(_prev: ForgotPasswordState, formData: FormData): Promise<ForgotPasswordState> {
  const parsed = emailSchema.safeParse(formData.get("email") ?? "");
  if (!parsed.success) {
    const raw = String(formData.get("email") ?? "").trim();
    return { status: "error", emailError: raw ? parsed.error.issues[0].message : "Enter the email you signed up with." };
  }
  const email = parsed.data;

  const ip = (await headers()).get("x-forwarded-for") || "127.0.0.1";
  if (!(await rateLimit(`reset_ip_${ip}`, 5)) || !(await rateLimit(`reset_email_${email}`, 3))) {
    return { status: "error", error: "Too many requests. Please wait 15 minutes and try again." };
  }

  const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } }, select: { email: true } });
  if (user?.email) {
    const token = await createPasswordResetToken(user.email);
    const link = `${await appOrigin()}/reset-password?token=${encodeURIComponent(token)}`;
    try {
      await resend.emails.send({
        from: "Zenvy <onboarding@resend.dev>",
        to: user.email,
        subject: "Reset your Zenvy password",
        html: `<p>Someone asked to reset the password for your Zenvy account.</p>
<p><a href="${link}">Set a new password</a>. The link works once and expires in 1 hour.</p>
<p>If this wasn't you, ignore this email. Your password won't change.</p>`,
      });
    } catch (error) {
      console.error("Password reset email failed", error);
    }
    if (process.env.NODE_ENV !== "production") console.log("DEV: Password reset link:", link);
  }

  return { status: "sent", email };
}
