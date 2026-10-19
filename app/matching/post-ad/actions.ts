"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const MODES = new Set(["ONLINE", "IN_PERSON", "HYBRID", "ANY"]);

function cleanText(value: FormDataEntryValue | null, fallback = "") {
  return String(value || fallback).trim();
}

function limit(value: string, maxLength: number) {
  return value.slice(0, maxLength);
}

export async function createStudyAd(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id && !session?.user?.email) redirect("/login");

  const user = session.user.id
    ? await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true } })
    : await prisma.user.findUnique({ where: { email: session.user.email || "" }, select: { id: true } });

  if (!user) redirect("/login");

  const title = limit(cleanText(formData.get("title")), 100);
  const subjects = limit(cleanText(formData.get("subjects")), 200);
  const availability = limit(cleanText(formData.get("availability")), 200);
  const description = limit(cleanText(formData.get("description")), 800);
  const modeInput = cleanText(formData.get("mode"), "ANY").toUpperCase();
  const mode = MODES.has(modeInput) ? modeInput : "ANY";

  if (!title || !subjects || !availability || !description) {
    throw new Error("Please complete all required study ad fields.");
  }

  await prisma.studyAd.create({
    data: {
      userId: user.id,
      title,
      subjects,
      availability,
      description,
      mode,
    },
  });

  revalidatePath("/matching");
  redirect("/matching");
}
