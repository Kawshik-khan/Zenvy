import { palette } from "../theme/tokens";

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** 0–4. Two or more is the minimum the web app accepts (8+ characters with a number). */
export function passwordStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/\d/.test(pw) && pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 14) score++;
  const label = score <= 1 ? "Too weak" : score === 2 ? "Okay" : score === 3 ? "Strong" : "Very strong";
  const color = score <= 1 ? palette.alert : score === 2 ? palette.focus : palette.live;
  return { score, label, color };
}
