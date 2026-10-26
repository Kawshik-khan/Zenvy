"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createStudyAdForUser } from "@/lib/study-ads";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createStudyAd(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id && !session?.user?.email) redirect("/login");

  const user = session.user.id
    ? await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true } })
    : await prisma.user.findUnique({ where: { email: session.user.email || "" }, select: { id: true } });

  if (!user) redirect("/login");

  await createStudyAdForUser(user.id, {
    title: formData.get("title"),
    subjects: formData.get("subjects"),
    availability: formData.get("availability"),
    description: formData.get("description"),
    mode: formData.get("mode"),
  });

  revalidatePath("/matching");
  redirect("/matching");
}
