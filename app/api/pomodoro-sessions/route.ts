import { auth } from "@/auth";
import { invalidateStudyMetrics } from "@/lib/cache";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const sessionSchema = z.object({
  mode: z.enum(["FOCUS", "SHORT_BREAK", "LONG_BREAK"]).default("FOCUS"),
  plannedMinutes: z.number().int().min(1).max(240),
  completedMinutes: z.number().int().min(1).max(240),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime(),
  status: z.enum(["COMPLETED", "SKIPPED", "CANCELED"]).default("COMPLETED"),
  trackId: z.string().trim().max(80).optional().nullable(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  const parsed = sessionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid session payload" }, { status: 400 });
  }

  const startedAt = new Date(parsed.data.startedAt);
  const endedAt = new Date(parsed.data.endedAt);
  if (endedAt <= startedAt) {
    return Response.json({ error: "Session end must be after start" }, { status: 400 });
  }

  if (parsed.data.mode !== "FOCUS") {
    return Response.json({ error: "Only focus sessions are persisted" }, { status: 400 });
  }

  const sessionRecord = await prisma.pomodoroSession.create({
    data: {
      userId: user.id,
      mode: parsed.data.mode,
      plannedMinutes: parsed.data.plannedMinutes,
      completedMinutes: Math.min(parsed.data.completedMinutes, parsed.data.plannedMinutes),
      startedAt,
      endedAt,
      status: parsed.data.status,
      trackId: parsed.data.trackId || null,
    },
    select: {
      id: true,
      completedMinutes: true,
      endedAt: true,
    },
  });

  await invalidateStudyMetrics(user.id);

  return Response.json({ session: sessionRecord });
}
