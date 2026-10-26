import { palette } from "../theme/tokens";

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** Same rules the server enforces in lib/password.ts: 8+ characters, an uppercase letter and a number. */
export function passwordProblem(pw: string) {
  if (pw.length < 8) return "Use at least 8 characters.";
  if (!/[A-Z]/.test(pw)) return "Add at least one uppercase letter.";
  if (!/[0-9]/.test(pw)) return "Add at least one number.";
  return null;
}

/** 0–4, mirroring the web strength meter: length first, then uppercase, number and symbol. */
export function passwordStrength(pw: string) {
  const score = !pw ? 0 : pw.length < 8 ? 1 : Math.min(4, 1 + Number(/[A-Z]/.test(pw)) + Number(/[0-9]/.test(pw)) + Number(/[^A-Za-z0-9]/.test(pw)));
  const label = ["", "Weak", "Okay", "Good", "Strong"][score];
  const color = score <= 1 ? palette.alert : score === 2 ? palette.focus : palette.live;
  return { score, label: pw.length && pw.length < 8 ? "Too short" : label, color };
}
