import crypto from "crypto";
import { prisma } from "@/lib/prisma";

/** Reset links work for one hour and only once. */
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export function hashResetToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function isExpired(expires: Date, now = new Date()) {
  return expires.getTime() <= now.getTime();
}

/**
 * Replaces any earlier reset token for this email and returns the raw token for the link.
 * Only the hash is stored, so a database leak does not leak working links.
 */
export async function createPasswordResetToken(email: string) {
  const token = crypto.randomBytes(32).toString("base64url");
  await prisma.passwordResetToken.deleteMany({ where: { email } });
  await prisma.passwordResetToken.create({
    data: { email, tokenHash: hashResetToken(token), expires: new Date(Date.now() + RESET_TOKEN_TTL_MS) },
  });
  return token;
}

/** The token's record when it exists and has not expired, otherwise null. */
export async function findValidResetToken(token: string | null | undefined) {
  if (!token || token.length > 200) return null;
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashResetToken(token) } });
  if (!record || isExpired(record.expires)) return null;
  return record;
}
