"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { resend } from "@/lib/resend";
import { generateVerificationToken } from "@/lib/tokens";

export async function signUp(prevState: any, formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const college = formData.get("college") as string;
  const major = formData.get("major") as string;
  const semester = formData.get("semester") as string;

  if (!email || !password || !name) {
    return { error: "Missing fields" };
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

    // Generate Verification Token
    const verificationToken = await generateVerificationToken(email);

    // Send Verification Email
    const confirmLink = `${process.env.NEXTAUTH_URL}/verify?token=${verificationToken.token}`;

    await resend.emails.send({
      from: 'Zenvy <onboarding@resend.dev>', // You should update this with your domain once verified on Resend
      to: email,
      subject: 'Verify your Zenvy account',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 8px;">
          <h2 style="color: #4f46e5; font-weight: 800; font-size: 24px;">Welcome to Zenvy!</h2>
          <p style="color: #475569; font-size: 16px; line-height: 24px;">Click the button below to verify your email address and activate your account.</p>
          <a href="${confirmLink}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 9999px; font-weight: bold; margin-top: 20px;">Verify Email</a>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 40px;">If you didn't create an account, you can safely ignore this email.</p>
        </div>
      `
    });

    console.log("Signup: User created and email sent for:", email);
  } catch (error) {
    console.error("Signup CRITICAL error:", error);
    return { error: "User already exists or email service error" };
  }

  redirect("/login?message=check-email");
}
