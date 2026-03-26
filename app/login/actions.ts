"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export async function login(prevState: string | undefined, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const callbackUrl = formData.get("callbackUrl") as string | null;

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl || "/dashboard",
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
