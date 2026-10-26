import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export type CredentialUser = { id: string; name: string | null; email: string | null; image: string | null };

/** Thrown for a locked account; the message is safe to show. */
export class AccountLockedError extends Error {}

/**
 * Checks an email and password, with the lockout rules: five wrong passwords lock the account
 * for 15 minutes. Returns null for an unknown email or a wrong password. Shared by the Auth.js
 * credentials provider and the mobile sign-in endpoint.
 */
export async function verifyCredentials(rawEmail: string, password: string): Promise<CredentialUser | null> {
  const email = rawEmail.trim();
  if (!email || !password) return null;

  // Exact match first (unique index), then case-insensitive for "Name@Uni.edu" style input.
  const user =
    (await prisma.user.findUnique({ where: { email } })) ??
    (await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } }));

  if (!user || !user.password) return null;

  if (user.lockedUntil && new Date() < user.lockedUntil) {
    throw new AccountLockedError("Account locked. Try again in 15 minutes.");
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);

  if (!isPasswordCorrect) {
    const newAttempts = (user.failedLoginAttempts || 0) + 1;
    const lockedUntil = newAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;

    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: newAttempts, lockedUntil },
    });

    if (lockedUntil) throw new AccountLockedError("Account locked due to too many failed attempts (15m).");
    return null;
  }

  if ((user.failedLoginAttempts || 0) > 0 || user.lockedUntil) {
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  }

  // SEC-005: email verification is enforced here once it is turned back on.

  return { id: user.id, name: user.name, email: user.email, image: user.image };
}
