import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MAX_FOCUS_MINUTES } from "@/lib/missed-calls";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  /** When the running focus session ends, or null when the user stops focusing. */
  until: z.string().datetime().nullable(),
  /** When the session that just ended started, to report the calls held during it. */
  since: z.string().datetime().optional(),
});

/**
 * Tells the server whether the user is in a focus session, so DM calls to them are held instead
 * of ringing. Clearing it returns the calls that came in meanwhile, so the app can offer a call back.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid focus status" }, { status: 400 });
  }

  const now = Date.now();
  const until = parsed.data.until ? new Date(Math.min(new Date(parsed.data.until).getTime(), now + MAX_FOCUS_MINUTES * 60_000)) : null;
  await prisma.user.update({ where: { id: userId }, data: { focusUntil: until && until.getTime() > now ? until : null } });

  if (until || !parsed.data.since) {
    return NextResponse.json({ heldCalls: [] });
  }

  const missed = await prisma.callParticipant.findMany({
    where: {
      userId,
      status: "MISSED",
      call: { type: "DM", endedAt: { gte: new Date(parsed.data.since) } },
    },
    orderBy: { joinedAt: "desc" },
    take: 20,
    select: {
      call: {
        select: {
          id: true,
          conversationId: true,
          mediaType: true,
          endedAt: true,
          startedById: true,
          participants: { select: { userId: true, user: { select: { id: true, name: true, image: true } } } },
        },
      },
    },
  });

  // One entry per caller, newest first.
  const byCaller = new Map<string, object>();
  for (const { call } of missed) {
    const caller = call.participants.find((p) => p.userId === call.startedById)?.user;
    if (!caller || !call.conversationId || byCaller.has(caller.id)) continue;
    byCaller.set(caller.id, {
      callId: call.id,
      conversationId: call.conversationId,
      caller: { id: caller.id, name: caller.name || "Zenvy student", image: caller.image },
      video: call.mediaType === "VIDEO",
      at: call.endedAt?.toISOString() ?? null,
    });
  }

  return NextResponse.json({ heldCalls: [...byCaller.values()] });
}
