"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

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

  const hashedPassword = await bcrypt.hash(password, 10);
  const baseName = name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'user';
  const uniqueId = `${baseName}_${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

  try {
    await prisma.user.create({
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
  } catch (error) {
    console.error("Signup error:", error);
    return { error: "User already exists or database error" };
  }

  redirect("/login");
}
