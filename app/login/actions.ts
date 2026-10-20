"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { rateLimit } from "@/lib/rateLimit";
import { headers } from "next/headers";
import { safeCallbackPath } from "@/lib/routes";

export async function login(prevState: string | undefined, formData: FormData) {
  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-forwarded-for") || "127.0.0.1";
  const allowed = await rateLimit(`login_${ip}`, 5);
  if (!allowed) {
    return "Too many requests. Please try again in 15 minutes.";
  }

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const callbackUrl = formData.get("callbackUrl") as string | null;

  // SEC-008, SEC-015: Prevent Open Redirects. Middleware sends absolute same-origin URLs.
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host");
  const proto = requestHeaders.get("x-forwarded-proto") || "http";
  const origin = host ? `${proto}://${host}` : undefined;
  const safeRedirect = safeCallbackPath(callbackUrl, origin) ?? "/dashboard";

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

/** Starts the Google OAuth redirect. Only reachable when Google sign-in is configured. */
export async function signInWithGoogle(formData: FormData) {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host");
  const proto = requestHeaders.get("x-forwarded-proto") || "http";
  const origin = host ? `${proto}://${host}` : undefined;
  const callbackUrl = formData.get("callbackUrl") as string | null;
  await signIn("google", { redirectTo: safeCallbackPath(callbackUrl, origin) ?? "/dashboard" });
}
