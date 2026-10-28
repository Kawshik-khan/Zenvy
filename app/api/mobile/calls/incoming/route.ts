import { prisma } from "@/lib/prisma";
import { serializeCall } from "@/lib/calls";
import { handle, ok, requireUserId } from "@/lib/mobile/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RING_SECONDS = 60;

/**
 * A direct call ringing for the viewer, if any. The app polls this while it is open; the web
 * app gets the same call through the socket's call:incoming event.
 */
export async function GET() {
  return handle(async () => {
    const userId = await requireUserId();
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
