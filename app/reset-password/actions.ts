"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { passwordSchema } from "@/lib/password";
import { findValidResetToken } from "@/lib/password-reset";
import { rateLimit } from "@/lib/rateLimit";

export type ResetPasswordState =
  | { status: "idle" }
  | { status: "done" }
  | { status: "expired" }
  | { status: "error"; passwordError?: string; confirmError?: string; error?: string };

export async function resetPassword(_prev: ResetPasswordState, formData: FormData): Promise<ResetPasswordState> {
  const ip = (await headers()).get("x-forwarded-for") || "127.0.0.1";
  if (!(await rateLimit(`reset_submit_${ip}`, 10))) {
    return { status: "error", error: "Too many attempts. Please wait 15 minutes and try again." };
  }

  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const checked = passwordSchema.safeParse(password);
  const passwordError = !password ? "Choose a new password." : checked.success ? undefined : checked.error.issues[0].message;
  const confirmError = !confirm ? "Type the new password again." : confirm !== password ? "Passwords don't match." : undefined;
  if (passwordError || confirmError) return { status: "error", passwordError, confirmError };

  const record = await findValidResetToken(token);
  if (!record) return { status: "expired" };

  const hashed = await bcrypt.hash(password, 10);
  await prisma.$transaction([
    prisma.user.update({
      where: { email: record.email },
      data: { password: hashed, failedLoginAttempts: 0, lockedUntil: null },
    }),
    // Every link for this email stops working once one is used.
    prisma.passwordResetToken.deleteMany({ where: { email: record.email } }),
  ]);

  return { status: "done" };
}
