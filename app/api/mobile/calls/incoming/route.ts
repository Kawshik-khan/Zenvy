import { prisma } from "@/lib/prisma";
import { serializeCall } from "@/lib/calls";
import { expireRingingDmCalls, RING_SECONDS } from "@/lib/missed-calls";
import { handle, ok, requireUserId } from "@/lib/mobile/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * A direct call ringing for the viewer, if any. The app polls this while it is open; the web
 * app gets the same call through the socket's call:incoming event.
 */
export async function GET() {
  return handle(async () => {
    const userId = await requireUserId();
    // Every signed-in app polls this, so it doubles as the sweep that turns rung-out calls into missed ones.
    await expireRingingDmCalls();
    const call = await prisma.callSession.findFirst({
      where: {
        type: "DM",
        status: "RINGING",
        startedAt: { gte: new Date(Date.now() - RING_SECONDS * 1000) },
        participants: { some: { userId, status: "INVITED" } },
      },
      include: { participants: { include: { user: { select: { id: true, name: true, image: true } } } } },
      orderBy: { startedAt: "desc" },
    });
    return ok({ call: call ? serializeCall(call) : null });
  });
}
