"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { registerUser } from "@/lib/register";

export type SignUpState = {
  error?: string;
  fieldErrors?: Partial<Record<"name" | "email" | "password", string>>;
  /** What the person typed, so the form keeps it after an error. */
  values?: { name: string; email: string };
} | null;

export async function signUp(_prevState: SignUpState, formData: FormData): Promise<SignUpState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const values = { name, email: email.trim() };

  const ip = (await headers()).get("x-forwarded-for") || "127.0.0.1";
  const result = await registerUser({ name, email, password, ip });
  if (!result.ok) return { error: result.error, fieldErrors: result.fieldErrors, values };

  redirect("/login?message=welcome&callbackUrl=%2Fonboarding");
}
