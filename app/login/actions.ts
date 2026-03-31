"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { rateLimit } from "@/lib/rateLimit";
import { headers } from "next/headers";

export async function login(prevState: string | undefined, formData: FormData) {
  const ip = (await headers()).get("x-forwarded-for") || "127.0.0.1";
  const allowed = await rateLimit(`login_${ip}`, 5);
  if (!allowed) {
    return "Too many requests. Please try again in 15 minutes.";
  }

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const callbackUrl = formData.get("callbackUrl") as string | null;

  // SEC-008, SEC-015: Prevent Open Redirects
  let safeRedirect = "/dashboard";
  if (callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")) {
    safeRedirect = callbackUrl;
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: safeRedirect,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      // Check for custom error message from authorize()
      if (error.cause?.err && error.cause.err instanceof Error) {
        return error.cause.err.message;
      }
      
      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid credentials.";
        default:
          return "Something went wrong.";
      }
    }
    throw error;
  }
}
