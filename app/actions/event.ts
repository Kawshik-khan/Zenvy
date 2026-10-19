"use server";

import { auth } from "@/auth";
import { invalidateStudyMetrics } from "@/lib/cache";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const eventSchema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  description: z.string().max(500).optional().nullable(),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  timezoneOffset: z.preprocess((value) => (value === null || value === "" ? undefined : value), z.coerce.number().optional()),
  groupId: z.string().optional().nullable(),
  location: z.string().max(160).optional().nullable(),
  type: z.string().max(40).default("VIRTUAL"),
});

function parseLocalDateTime(value: string, timezoneOffset?: number) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;

  const [, year, month, day, hour, minute] = match;
  const parts = [year, month, day, hour, minute].map(Number);
  if (parts.some((part) => Number.isNaN(part))) return null;

  const [yyyy, mm, dd, hh, min] = parts;
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31 || hh < 0 || hh > 23 || min < 0 || min > 59) return null;

  if (typeof timezoneOffset === "number" && Number.isFinite(timezoneOffset)) {
    return new Date(Date.UTC(yyyy, mm - 1, dd, hh, min) + timezoneOffset * 60000);
  }

  return new Date(yyyy, mm - 1, dd, hh, min);
}

async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) throw new Error("User not found");

  return user;
}

export async function createEvent(formData: FormData) {
  const user = await getCurrentUser();

  const validation = eventSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || null,
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    timezoneOffset: formData.get("timezoneOffset"),
    groupId: formData.get("groupId") || null,
    location: formData.get("location") || null,
    type: formData.get("type") || "VIRTUAL",
  });

  if (!validation.success) {
    throw new Error(`Invalid event: ${validation.error.message}`);
  }

  const { title, description, groupId, location, type } = validation.data;
  const startTime = parseLocalDateTime(validation.data.startTime, validation.data.timezoneOffset);
  const endTime = parseLocalDateTime(validation.data.endTime, validation.data.timezoneOffset);

  if (!startTime || !endTime || Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
    throw new Error("Invalid event date or time");
  }

  if (startTime < new Date(Date.now() - 60000)) {
    throw new Error("Event start time cannot be in the past");
  }

  if (endTime <= startTime) {
    throw new Error("Event end time must be after start time");
  }

  if (groupId) {
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: user.id } },
    });
    if (!membership) throw new Error("You must be a group member to schedule for this group");
  }

  await prisma.event.create({
    data: {
      title,
      description,
      startTime,
      endTime,
      location,
      type,
      groupId,
      creatorId: user.id,
      attendees: {
        create: {
          userId: user.id,
          status: "GOING",
        },
      },
    },
  });

  await invalidateStudyMetrics(user.id);

  revalidatePath("/events");
  revalidatePath("/scheduling");
  revalidatePath("/dashboard");
}

export async function rsvpEvent(eventId: string, status: "GOING" | "MAYBE" | "DECLINED") {
  const user = await getCurrentUser();

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, groupId: true },
  });
  if (!event) throw new Error("Event not found");

  if (event.groupId) {
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: event.groupId, userId: user.id } },
    });
    if (!membership) throw new Error("You must be a group member to RSVP");
  }

  await prisma.eventAttendee.upsert({
    where: { eventId_userId: { eventId, userId: user.id } },
    update: { status },
    create: { eventId, userId: user.id, status },
  });

  await invalidateStudyMetrics(user.id);

  revalidatePath("/events");
  revalidatePath("/scheduling");
  revalidatePath("/dashboard");
}

export async function cancelEvent(eventId: string) {
  const user = await getCurrentUser();

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { group: true, attendees: { select: { userId: true } } },
  });
  if (!event) throw new Error("Event not found");

  const isGroupAdmin = event.groupId
    ? await prisma.groupMember.findFirst({
        where: { groupId: event.groupId, userId: user.id, role: { in: ["ADMIN", "CREATOR"] } },
      })
    : null;

  if (event.creatorId !== user.id && !isGroupAdmin) {
    throw new Error("Only the event creator or group admin can cancel this event");
  }

  await prisma.event.delete({ where: { id: eventId } });

  await invalidateStudyMetrics(event.creatorId, ...event.attendees.map((attendee) => attendee.userId));

  revalidatePath("/events");
  revalidatePath("/scheduling");
  revalidatePath("/dashboard");
}
