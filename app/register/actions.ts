"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { resend } from "@/lib/resend";
import { generateVerificationToken } from "@/lib/tokens";
import { rateLimit } from "@/lib/rateLimit";
import { headers } from "next/headers";
import { emailSchema, passwordSchema } from "@/lib/password";
import { makeUniqueId } from "@/lib/unique-id";

export type SignUpState = {
  error?: string;
  fieldErrors?: Partial<Record<"name" | "email" | "password", string>>;
  /** What the person typed, so the form keeps it after an error. */
  values?: { name: string; email: string };
} | null;

export async function signUp(_prevState: SignUpState, formData: FormData): Promise<SignUpState> {
  const name = String(formData.get("name") ?? "").trim();
  const rawEmail = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const values = { name, email: rawEmail.trim() };

  const fieldErrors: NonNullable<SignUpState>["fieldErrors"] = {};
  if (!name) fieldErrors.name = "Enter your name.";
  else if (name.length > 80) fieldErrors.name = "Use 80 characters or fewer.";
  const email = emailSchema.safeParse(rawEmail);
  if (!rawEmail.trim()) fieldErrors.email = "Enter your university email.";
  else if (!email.success) fieldErrors.email = email.error.issues[0].message;
  // SEC-006: Password Strength Validation
  const checkedPassword = passwordSchema.safeParse(password);
  if (!password) fieldErrors.password = "Choose a password.";
  else if (!checkedPassword.success) fieldErrors.password = checkedPassword.error.issues[0].message;
  if (Object.keys(fieldErrors).length || !email.success) return { fieldErrors, values };

  const ip = (await headers()).get("x-forwarded-for") || "127.0.0.1";
  const allowed = await rateLimit(`register_${ip}`, 5);
  if (!allowed) {
    return { error: "Too many sign-up attempts. Please try again later.", values };
  }

  const existing = await prisma.user.findFirst({ where: { email: { equals: email.data, mode: "insensitive" } }, select: { id: true } });
  if (existing) {
    return { fieldErrors: { email: "An account with this email already exists. Sign in instead." }, values };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await prisma.user.create({
      data: {
        name,
        uniqueId: makeUniqueId(name),
        email: email.data,
        emailVerified: new Date(), // Auto-verify (SEC-005 temporarily disabled)
        password: hashedPassword,
        profile: {
          create: {},
        },
      },
    });

    // Generate Verification Token (optional, for record keeping)
    const verificationToken = await generateVerificationToken(email.data);
    const confirmLink = `${process.env.NEXTAUTH_URL}/verify?token=${verificationToken.token}`;

    if (process.env.NODE_ENV !== "production") console.log("DEV: Validation Link:", confirmLink);

    // Send Verification Email (Silence errors so it doesn't block signup)
    try {
      await resend.emails.send({
        from: "Zenvy <onboarding@resend.dev>",
        to: email.data,
        subject: "Welcome to Zenvy!",
        html: `<p>Welcome! Your account is active. Explore Zenvy here: ${confirmLink}</p>`,
      });
    } catch {
      console.log("Signup: Email sending failed but bypassing error.");
    }
  } catch (error) {
    console.error("Signup CRITICAL error:", error);
    return { error: "We couldn't create your account. Please try again.", values };
  }

  redirect("/login?message=welcome&callbackUrl=%2Fonboarding");
}
