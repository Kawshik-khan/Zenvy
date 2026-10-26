import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export type CredentialResult =
  | { ok: true; user: { id: string; name: string | null; email: string | null; image: string | null } }
  | { ok: false; reason: "invalid" }
  | { ok: false; reason: "locked"; message: string };

const LOCK_AFTER = 5;
const LOCK_MS = 15 * 60 * 1000;

/**
 * Email + password check with the 5-strike, 15-minute lockout.
 * Shared by the Auth.js credentials provider (web) and /api/mobile/auth/login (app).
 */
export async function checkCredentials(rawEmail: unknown, rawPassword: unknown): Promise<CredentialResult> {
  if (!rawEmail || !rawPassword) return { ok: false, reason: "invalid" };

  const email = String(rawEmail).trim();
  // Exact match first (unique index), then case-insensitive for "Name@Uni.edu" style input.
  const user =
    (await prisma.user.findUnique({ where: { email } })) ??
    (await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } }));

  if (!user || !user.password) return { ok: false, reason: "invalid" };

  if (user.lockedUntil && new Date() < user.lockedUntil) {
    return { ok: false, reason: "locked", message: "Account locked. Try again in 15 minutes." };
  }

  const isPasswordCorrect = await bcrypt.compare(String(rawPassword), user.password);

  if (!isPasswordCorrect) {
    const attempts = (user.failedLoginAttempts || 0) + 1;
    const lockedUntil = attempts >= LOCK_AFTER ? new Date(Date.now() + LOCK_MS) : null;
    await prisma.user.update({ where: { id: user.id }, data: { failedLoginAttempts: attempts, lockedUntil } });
    if (lockedUntil) return { ok: false, reason: "locked", message: "Account locked due to too many failed attempts (15m)." };
    return { ok: false, reason: "invalid" };
  }

  if ((user.failedLoginAttempts || 0) > 0 || user.lockedUntil) {
    await prisma.user.update({ where: { id: user.id }, data: { failedLoginAttempts: 0, lockedUntil: null } });
  }

  // SEC-005: email verification is enforced here once it is switched back on.

  return { ok: true, user: { id: user.id, name: user.name, email: user.email, image: user.image } };
}
