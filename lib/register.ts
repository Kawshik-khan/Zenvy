import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { emailSchema, passwordSchema } from "@/lib/password";
import { rateLimit } from "@/lib/rateLimit";
import { resend } from "@/lib/resend";
import { generateVerificationToken } from "@/lib/tokens";
import { makeUniqueId } from "@/lib/unique-id";

export type RegisterField = "name" | "email" | "password";

export type RegisterResult =
  | { ok: true; user: { id: string; name: string | null; email: string | null } }
  | { ok: false; error?: string; fieldErrors?: Partial<Record<RegisterField, string>> };

/**
 * Creates an email-and-password account with an empty profile. Shared by the web sign-up form
 * and the mobile app. Emails are auto-verified while SEC-005 is disabled.
 */
export async function registerUser(input: { name: string; email: string; password: string; ip: string }): Promise<RegisterResult> {
  const name = input.name.trim();
  const rawEmail = input.email;
  const password = input.password;

  const fieldErrors: Partial<Record<RegisterField, string>> = {};
  if (!name) fieldErrors.name = "Enter your name.";
  else if (name.length > 80) fieldErrors.name = "Use 80 characters or fewer.";
  const email = emailSchema.safeParse(rawEmail);
  if (!rawEmail.trim()) fieldErrors.email = "Enter your university email.";
  else if (!email.success) fieldErrors.email = email.error.issues[0].message;
  // SEC-006: Password Strength Validation
  const checkedPassword = passwordSchema.safeParse(password);
  if (!password) fieldErrors.password = "Choose a password.";
  else if (!checkedPassword.success) fieldErrors.password = checkedPassword.error.issues[0].message;
  if (Object.keys(fieldErrors).length || !email.success) return { ok: false, fieldErrors };

  if (!(await rateLimit(`register_${input.ip}`, 5))) {
    return { ok: false, error: "Too many sign-up attempts. Please try again later." };
  }

  const existing = await prisma.user.findFirst({ where: { email: { equals: email.data, mode: "insensitive" } }, select: { id: true } });
  if (existing) {
    return { ok: false, fieldErrors: { email: "An account with this email already exists. Sign in instead." } };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  let user: { id: string; name: string | null; email: string | null };
  try {
    user = await prisma.user.create({
      data: {
        name,
        uniqueId: makeUniqueId(name),
        email: email.data,
        emailVerified: new Date(), // Auto-verify (SEC-005 temporarily disabled)
        password: hashedPassword,
        profile: { create: {} },
      },
      select: { id: true, name: true, email: true },
    });
  } catch (error) {
    console.error("Signup CRITICAL error:", error);
    return { ok: false, error: "We couldn't create your account. Please try again." };
  }

  // The welcome email is best effort: a failure never blocks sign-up.
  try {
    const verificationToken = await generateVerificationToken(email.data);
    const confirmLink = `${process.env.NEXTAUTH_URL}/verify?token=${verificationToken.token}`;
    if (process.env.NODE_ENV !== "production") console.log("DEV: Validation Link:", confirmLink);
    await resend.emails.send({
      from: "Zenvy <onboarding@resend.dev>",
      to: email.data,
      subject: "Welcome to Zenvy!",
      html: `<p>Welcome! Your account is active. Explore Zenvy here: ${confirmLink}</p>`,
    });
  } catch {
    console.log("Signup: Email sending failed but bypassing error.");
  }

  return { ok: true, user };
}
