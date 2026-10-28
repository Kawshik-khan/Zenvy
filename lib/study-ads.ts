import { prisma } from "@/lib/prisma";

const MODES = new Set(["ONLINE", "IN_PERSON", "HYBRID", "ANY"]);

export type StudyAdInput = {
  title: unknown;
  subjects: unknown;
  availability: unknown;
  description: unknown;
  mode?: unknown;
};

function clean(value: unknown, maxLength: number, fallback = "") {
  return String(value ?? fallback).trim().slice(0, maxLength);
}

/** Posts a study ad for a user. Shared by the web form and the mobile app. */
export async function createStudyAdForUser(userId: string, input: StudyAdInput) {
  const title = clean(input.title, 100);
  const subjects = clean(input.subjects, 200);
  const availability = clean(input.availability, 200);
  const description = clean(input.description, 800);
  const modeInput = clean(input.mode, 20, "ANY").toUpperCase();
  const mode = MODES.has(modeInput) ? modeInput : "ANY";

  if (!title || !subjects || !availability || !description) {
    throw new Error("Please complete all required study ad fields.");
  }

  return prisma.studyAd.create({ data: { userId, title, subjects, availability, description, mode } });
}
