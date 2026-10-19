export type PosterTrust = "STUDENT" | "ALUMNI" | "VERIFIED_EMPLOYER";
export type InitialStatus = "LIVE" | "PENDING_REVIEW";

/** Distinct reporters needed to hide a post until an admin has looked at it. */
export const REPORT_HIDE_THRESHOLD = 3;

const PATTERNS: Array<{ signal: string; test: RegExp }> = [
  { signal: "Asks for a fee or deposit", test: /\b(registration|training|processing|security|application)\s+(fee|charge|deposit)\b|\bpay\s+(a\s+)?(fee|deposit)\b|\brefundable deposit\b/i },
  { signal: "Asks for money up front", test: /\b(send|transfer|deposit)\s+(us\s+)?(money|cash|\$|usd|bdt|rs\.?)\b|\bwire\s+transfer\b|\bgift\s*cards?\b/i },
  { signal: "WhatsApp or Telegram only", test: /\b(whatsapp|telegram|signal)\s+(only|me|us)\b|\bcontact\s+(us\s+)?(on|via)\s+(whatsapp|telegram)\b/i },
  { signal: "Shortened link", test: /\b(bit\.ly|tinyurl\.com|t\.co|goo\.gl|rb\.gy|cutt\.ly|is\.gd)\//i },
  { signal: "Unrealistic pay promise", test: /\b(earn|make)\s+\$?\d{3,}\s*(\/|per)\s*(day|hour)\b|\bguaranteed\s+(income|salary)\b/i },
];

/** Names of the scam signals found in the text. Empty when nothing looks off. A hint for reviewers, not a verdict. */
export function scanForScamSignals(...parts: Array<string | null | undefined>) {
  const text = parts.filter(Boolean).join("\n");
  return PATTERNS.filter((pattern) => pattern.test.test(text)).map((pattern) => pattern.signal);
}

type InitialStatusInput = {
  posterTrust: PosterTrust;
  approvedPosts: number;
  signals: string[];
};

/** Verified employers publish straight away; trusted posters do too unless the scan flags something. */
export function initialStatusFor({ posterTrust, approvedPosts, signals }: InitialStatusInput): InitialStatus {
  if (posterTrust === "VERIFIED_EMPLOYER") return "LIVE";
  const trusted = posterTrust === "ALUMNI" || approvedPosts >= 1;
  return trusted && signals.length === 0 ? "LIVE" : "PENDING_REVIEW";
}

export function shouldAutoHide(distinctReports: number) {
  return distinctReports >= REPORT_HIDE_THRESHOLD;
}
