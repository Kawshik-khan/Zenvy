import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import { generateVerificationToken } from "@/lib/tokens";
import { emailSchema, passwordSchema } from "@/lib/password";
import { makeUniqueId } from "@/lib/unique-id";

export type AccountField = "name" | "email" | "password";

export type CreateAccountResult =
  | { ok: true; userId: string }
  | { ok: false; fieldErrors?: Partial<Record<AccountField, string>>; error?: string };

/** Field checks for sign-up, without touching the database. */
export function validateSignUp(input: { name: string; email: string; password: string }) {
  const fieldErrors: Partial<Record<AccountField, string>> = {};
  const name = input.name.trim();
  if (!name) fieldErrors.name = "Enter your name.";
  else if (name.length > 80) fieldErrors.name = "Use 80 characters or fewer.";
  const email = emailSchema.safeParse(input.email);
  if (!input.email.trim()) fieldErrors.email = "Enter your university email.";
  else if (!email.success) fieldErrors.email = email.error.issues[0].message;
  // SEC-006: Password Strength Validation
  const password = passwordSchema.safeParse(input.password);
  if (!input.password) fieldErrors.password = "Choose a password.";
  else if (!password.success) fieldErrors.password = password.error.issues[0].message;
  return { fieldErrors, name, email: email.success ? email.data : null };
}

/**
 * Creates a user with a password and an empty profile, then sends the welcome email.
 * Shared by the web sign-up form and /api/mobile/auth/register. Rate limiting is the caller's job.
 */
export async function createAccount(input: { name: string; email: string; password: string }): Promise<CreateAccountResult> {
  const { fieldErrors, name, email } = validateSignUp(input);
  if (Object.keys(fieldErrors).length || !email) return { ok: false, fieldErrors };

  const existing = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } }, select: { id: true } });
  if (existing) {
    return { ok: false, fieldErrors: { email: "An account with this email already exists. Sign in instead." } };
  }

  const hashedPassword = await bcrypt.hash(input.password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        name,
        uniqueId: makeUniqueId(name),
        email,
        emailVerified: new Date(), // Auto-verify (SEC-005 temporarily disabled)
        password: hashedPassword,
        profile: {
          create: {},
        },
      },
      select: { id: true },
    });

    // Generate Verification Token (optional, for record keeping)
    const verificationToken = await generateVerificationToken(email);
    const confirmLink = `${process.env.NEXTAUTH_URL}/verify?token=${verificationToken.token}`;

    if (process.env.NODE_ENV !== "production") console.log("DEV: Validation Link:", confirmLink);

    // Send Verification Email (Silence errors so it doesn't block signup)
    try {
      await resend.emails.send({
        from: "Zenvy <onboarding@resend.dev>",
        to: email,
        subject: "Welcome to Zenvy!",
        html: `<p>Welcome! Your account is active. Explore Zenvy here: ${confirmLink}</p>`,
      });
    } catch {
      console.log("Signup: Email sending failed but bypassing error.");
    }

    return { ok: true, userId: user.id };
  } catch (error) {
    console.error("Signup CRITICAL error:", error);
    return { ok: false, error: "We couldn't create your account. Please try again." };
  }
}
