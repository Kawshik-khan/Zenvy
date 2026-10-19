"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { reviewJob, type ReviewAction } from "@/lib/jobs/service";
import { prisma } from "@/lib/prisma";

export async function reviewJobAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const admin = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, role: true } });
  if (admin?.role !== "ADMIN") throw new Error("Forbidden");

  const jobId = String(formData.get("jobId") || "");
  const action = String(formData.get("action") || "") as ReviewAction;
  const note = String(formData.get("note") || "");
  if (!jobId || !["approve", "reject", "remove"].includes(action)) throw new Error("Invalid request");
  if (action !== "approve" && !note.trim()) throw new Error("Add a note so the poster knows what to change");

  await reviewJob(jobId, admin.id, action, note);
  revalidatePath("/zenvy-admin/jobs");
  revalidatePath("/jobs");
}
