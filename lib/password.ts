import { z } from "zod";

// Shared by sign-up, password reset and the strength meter, so the rules shown in the
// browser are the same ones the server enforces.

export const PASSWORD_RULES = [
  { id: "length", label: "8 or more characters", test: (value: string) => value.length >= 8 },
  { id: "upper", label: "An uppercase letter", test: (value: string) => /[A-Z]/.test(value) },
  { id: "number", label: "A number", test: (value: string) => /[0-9]/.test(value) },
  { id: "symbol", label: "A symbol (optional)", test: (value: string) => /[^A-Za-z0-9]/.test(value) },
] as const;

export type PasswordRuleId = (typeof PASSWORD_RULES)[number]["id"];

export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .regex(/[A-Z]/, "Add at least one uppercase letter.")
  .regex(/[0-9]/, "Add at least one number.")
  .max(200, "Use 200 characters or fewer.");

export type PasswordStrength = {
  /** 0 when empty, otherwise 1 (weak) to 4 (strong). */
  score: 0 | 1 | 2 | 3 | 4;
  label: "" | "Too short" | "Weak" | "Okay" | "Good" | "Strong";
  passed: Record<PasswordRuleId, boolean>;
  /** True when the server will accept it. */
  acceptable: boolean;
};

export function passwordStrength(value: string): PasswordStrength {
  const passed = Object.fromEntries(PASSWORD_RULES.map((rule) => [rule.id, rule.test(value)])) as Record<PasswordRuleId, boolean>;
  const acceptable = passwordSchema.safeParse(value).success;
  if (!value) return { score: 0, label: "", passed, acceptable };
  if (!passed.length) return { score: 1, label: "Too short", passed, acceptable };
  const extras = Number(passed.upper) + Number(passed.number) + Number(passed.symbol);
  const score = Math.min(4, 1 + extras) as PasswordStrength["score"];
  const label = (["", "Weak", "Okay", "Good", "Strong"] as const)[score];
  return { score, label, passed, acceptable };
}

export const emailSchema = z.string().trim().toLowerCase().email("That email doesn't look right. Check for typos.").max(254);
