"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { resend } from "@/lib/resend";
import { generateVerificationToken } from "@/lib/tokens";
import { z } from "zod";
import { rateLimit } from "@/lib/rateLimit";
import { headers } from "next/headers";

const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export async function signUp(prevState: any, formData: FormData) {
  const ip = (await headers()).get("x-forwarded-for") || "127.0.0.1";
  const allowed = await rateLimit(`register_${ip}`, 5);
  if (!allowed) {
    return { error: "Too many sign-up attempts. Please try again later." };
  }

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const college = formData.get("college") as string;
  const major = formData.get("major") as string;
  const semester = formData.get("semester") as string;

  if (!email || !password || !name) {
    return { error: "Missing fields" };
  }

  // SEC-006: Password Strength Validation
  const passValidation = passwordSchema.safeParse(password);
  if (!passValidation.success) {
    return { error: passValidation.error.issues[0].message };
  }

  console.log("Signup: Attempting signup for:", email);
  const hashedPassword = await bcrypt.hash(password, 10);
  const baseName = name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'user';
  const uniqueId = `${baseName}_${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

  try {
    const user = await prisma.user.create({
      data: {
        name,
        uniqueId,
        email,
        emailVerified: null, // SEC-005: Enforce verification
        password: hashedPassword,
        profile: {
          create: {
            college,
            major,
            semester: parseInt(semester) || 1,
          },
        },
      },
    });

    // Generate Verification Token (optional, for record keeping)
    const verificationToken = await generateVerificationToken(email);
    const confirmLink = `${process.env.NEXTAUTH_URL}/verify?token=${verificationToken.token}`;

    console.log("----------------------------------------");
    console.log("DEV: Validation Link:", confirmLink);
    console.log("----------------------------------------");

    // Send Verification Email (Silence errors so it doesn't block signup)
    try {
      await resend.emails.send({
        from: 'Zenvy <onboarding@resend.dev>',
        to: email,
        subject: 'Welcome to Zenvy!',
        html: `<p>Welcome! Your account is active. Explore Zenvy here: ${confirmLink}</p>`
      });
    } catch (e) {
      console.log("Signup: Email sending failed but bypassing error.");
    }


    console.log("Signup: User created and email sent for:", email);
  } catch (error) {
    console.error("Signup CRITICAL error:", error);
    return { error: "User already exists or email service error" };
  }

  redirect("/login");
}
