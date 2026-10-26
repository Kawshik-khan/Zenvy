"use server";

import { redirect } from "next/navigation";
import { rateLimit } from "@/lib/rateLimit";
import { headers } from "next/headers";
import { createAccount, validateSignUp } from "@/lib/accounts";

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

  // Field errors come back before the rate limit, as they always have.
  const checked = validateSignUp({ name, email: rawEmail, password });
  if (Object.keys(checked.fieldErrors).length || !checked.email) return { fieldErrors: checked.fieldErrors, values };

  const ip = (await headers()).get("x-forwarded-for") || "127.0.0.1";
  const allowed = await rateLimit(`register_${ip}`, 5);
  if (!allowed) {
    return { error: "Too many sign-up attempts. Please try again later.", values };
  }

  const result = await createAccount({ name, email: rawEmail, password });
  if (!result.ok) return { fieldErrors: result.fieldErrors, error: result.error, values };

  redirect("/login?message=welcome&callbackUrl=%2Fonboarding");
}
