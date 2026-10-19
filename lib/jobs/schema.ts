import { z } from "zod";

export const JOB_TYPES = ["JOB", "INTERNSHIP", "PART_TIME", "REFERRAL"] as const;
export const WORK_MODES = ["REMOTE", "ONSITE", "HYBRID"] as const;
export const APPLY_METHODS = ["LINK", "EMAIL", "MESSAGE"] as const;

export const JOB_TYPE_LABELS: Record<(typeof JOB_TYPES)[number], string> = {
  JOB: "Job",
  INTERNSHIP: "Internship",
  PART_TIME: "Part-time",
  REFERRAL: "Referral",
};
export const WORK_MODE_LABELS: Record<(typeof WORK_MODES)[number], string> = {
  REMOTE: "Remote",
  ONSITE: "On site",
  HYBRID: "Hybrid",
};

export const MAX_TAGS = 8;
export const MAX_IMAGES = 4;
const DAY_MS = 24 * 60 * 60 * 1000;

/** "React, Data  science,,react" -> ["react", "data science"]. Lowercase, trimmed, de-duplicated. */
export function parseTags(raw: string) {
  const seen = new Set<string>();
  for (const part of raw.split(",")) {
    const tag = part.trim().replace(/\s+/g, " ").toLowerCase();
    if (tag) seen.add(tag);
  }
  return [...seen];
}

const text = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be ${max} characters or fewer`);

export function createJobSchema(now: Date = new Date()) {
  return z
    .object({
      type: z.enum(JOB_TYPES),
      title: text("Title", 120),
      company: text("Company", 120),
      location: text("Location", 120),
      workMode: z.enum(WORK_MODES),
      pay: z
        .string()
        .trim()
        .max(80, "Pay must be 80 characters or fewer")
        .optional()
        .transform((value) => value || null),
      description: text("Description", 5000).refine((value) => value.length >= 30, "Describe the role in at least 30 characters"),
      applyMethod: z.enum(APPLY_METHODS),
      applyTarget: z
        .string()
        .trim()
        .optional()
        .transform((value) => value || null),
      tags: z
        .string()
        .default("")
        .transform(parseTags)
        .refine((tags) => tags.length <= MAX_TAGS, `Use at most ${MAX_TAGS} tags`)
        .refine((tags) => tags.every((tag) => tag.length <= 24), "Each tag must be 24 characters or fewer"),
      deadline: z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Choose a deadline"),
      noFee: z.literal(true, { error: "Confirm that applicants are never asked to pay" }),
    })
    .superRefine((value, ctx) => {
      const deadline = new Date(value.deadline).getTime();
      if (deadline < now.getTime() + DAY_MS * 0.5) {
        ctx.addIssue({ code: "custom", path: ["deadline"], message: "Deadline must be at least a day away" });
      } else if (deadline > now.getTime() + DAY_MS * 90) {
        ctx.addIssue({ code: "custom", path: ["deadline"], message: "Deadline can be at most 90 days away" });
      }

      if (value.applyMethod === "LINK") {
        try {
          if (new URL(value.applyTarget ?? "").protocol !== "https:") throw new Error("not https");
        } catch {
          ctx.addIssue({ code: "custom", path: ["applyTarget"], message: "Use a full https:// link" });
        }
      } else if (value.applyMethod === "EMAIL") {
        if (!z.email().safeParse(value.applyTarget ?? "").success) {
          ctx.addIssue({ code: "custom", path: ["applyTarget"], message: "Enter a valid email address" });
        }
      }
    })
    .transform((value) => ({
      ...value,
      applyTarget: value.applyMethod === "MESSAGE" ? null : value.applyTarget,
      deadline: new Date(value.deadline),
    }));
}

export type JobInput = z.output<ReturnType<typeof createJobSchema>>;

export type FieldErrors = Partial<Record<string, string>>;

/** First message per field, for showing next to inputs. */
export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export const REPORT_REASONS = {
  SCAM_FEE: "Asks for money or a fee",
  FAKE_COMPANY: "Company looks fake",
  SPAM: "Spam or duplicate",
  OFFENSIVE: "Offensive content",
  OTHER: "Something else",
} as const;
export type ReportReason = keyof typeof REPORT_REASONS;
