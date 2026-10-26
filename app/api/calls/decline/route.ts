import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/request-user";
import { prisma } from "@/lib/prisma";
import { assertCanAccessCall } from "@/lib/calls";

export async function POST(req: NextRequest) {
  const currentUser = await getRequestUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { callId } = await req.json();
  if (!callId) {
    return NextResponse.json({ error: "Missing callId" }, { status: 400 });
  }

  try {
    const call = await assertCanAccessCall(currentUser.id, callId, { includeParticipants: false });
    await prisma.callParticipant.update({
      where: { callId_userId: { callId: call.id, userId: currentUser.id } },
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
