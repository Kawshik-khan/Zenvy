"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isEnabled } from "@/lib/flags";
import { validateJobImage } from "@/lib/jobs/images";
import { createJobSchema, fieldErrors, MAX_IMAGES, REPORT_REASONS, type FieldErrors, type ReportReason } from "@/lib/jobs/schema";
import { createJob, JobError, reportJob, thumbPath, toggleSave } from "@/lib/jobs/service";
import { removeJobImages } from "@/lib/jobs/storage";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";

export type CreateJobState = { errors?: FieldErrors; message?: string; values?: Record<string, string> } | undefined;

async function requireUserId() {
  if (!isEnabled("jobs")) throw new JobError("Jobs are not available yet");
  const session = await auth();
  if (!session?.user?.id) throw new JobError("Sign in to continue");
  return session.user.id;
}

export async function createJobAction(_prev: CreateJobState, formData: FormData): Promise<CreateJobState> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch (error) {
    return { message: error instanceof Error ? error.message : "Something went wrong" };
  }

  // 5 posts per window per person. In-memory, so it resets on deploy and is per server instance.
  if (!(await rateLimit(`job_create_${userId}`, 5))) return { message: "You have posted a lot recently. Try again later." };


  // Sent back with any error: React clears an uncontrolled form after its action, so the form refills from these.
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) if (typeof value === "string") values[key] = value;

  const parsed = createJobSchema().safeParse({
    type: formData.get("type"),
    title: formData.get("title"),
    company: formData.get("company"),
    location: formData.get("location"),
    workMode: formData.get("workMode"),
    pay: formData.get("pay") ?? undefined,
    description: formData.get("description"),
    applyMethod: formData.get("applyMethod"),
    applyTarget: formData.get("applyTarget") ?? undefined,
    tags: formData.get("tags") ?? "",
    deadline: formData.get("deadline"),
    noFee: formData.get("noFee") === "on",
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const files = formData.getAll("images").filter((value): value is File => value instanceof File && value.size > 0);
  if (files.length > MAX_IMAGES) return { errors: { images: `Add at most ${MAX_IMAGES} images` }, values };
  for (const file of files) {
    const problem = validateJobImage(file);
    if (problem) return { errors: { images: `${file.name}: ${problem}` }, values };
  }

  let id: string;
  let status: string;
  try {
    const buffers = await Promise.all(files.map(async (file) => Buffer.from(await file.arrayBuffer())));
    ({ id, status } = await createJob(userId, parsed.data, buffers));
  } catch (error) {
    if (error instanceof JobError) return { message: error.message, values };
    console.error("createJob failed:", error);
    return { message: "We could not save your post. Please try again.", values };
  }

  revalidatePath("/jobs");
  redirect(`/jobs/${id}?posted=${status === "LIVE" ? "live" : "pending"}`);
}

export async function toggleSaveAction(jobId: string) {
  try {
    const userId = await requireUserId();
    if (!(await rateLimit(`job_save_${userId}`, 60))) return { error: "Too many saves, slow down" };
    const saved = await toggleSave(userId, jobId);
    revalidatePath("/jobs/saved");
    return { saved };
  } catch (error) {
    return { error: error instanceof JobError ? error.message : "Could not update your saved posts" };
  }
}

export async function reportJobAction(jobId: string, reason: string, details: string) {
  try {
    const userId = await requireUserId();
    if (!(reason in REPORT_REASONS)) return { error: "Choose a reason" };
    if (!(await rateLimit(`job_report_${userId}`, 20))) return { error: "Too many reports today" };
    const result = await reportJob({ jobId, reporterId: userId, reason: reason as ReportReason, details });
    revalidatePath(`/jobs/${jobId}`);
    return { ok: true as const, alreadyReported: result.alreadyReported };
  } catch (error) {
    return { error: error instanceof JobError ? error.message : "Could not send your report" };
  }
}

export async function deleteJobAction(jobId: string) {
  const userId = await requireUserId();
  const media = await prisma.jobMedia.findMany({ where: { jobId, job: { authorId: userId } }, select: { path: true } });
  const { count } = await prisma.jobPost.deleteMany({ where: { id: jobId, authorId: userId } });
  if (count) await removeJobImages(media.flatMap((item) => [item.path, thumbPath(item.path)]));
  revalidatePath("/jobs");
  revalidatePath("/jobs/mine");
}
