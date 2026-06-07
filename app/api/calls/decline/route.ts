import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { assertCanAccessCall } from "@/lib/calls";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { callId } = await req.json();
  if (!callId) {
    return NextResponse.json({ error: "Missing callId" }, { status: 400 });
  }

  try {
    const call = await assertCanAccessCall(session.user.id, callId);
    await prisma.callParticipant.update({
      where: { callId_userId: { callId: call.id, userId: session.user.id } },
      data: {
        status: "DECLINED",
        leftAt: new Date(),
        lastSeenAt: new Date(),
        audioEnabled: false,
        videoEnabled: false,
      },
    });

    if (call.type === "DM") {
      await prisma.callSession.update({
        where: { id: call.id },
        data: { status: "ENDED", endedAt: new Date() },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unable to decline call" }, { status: 403 });
  }
}
