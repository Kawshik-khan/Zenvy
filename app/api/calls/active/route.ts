import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  assertCanAccessCallScope,
  getCallRoomId,
  getCallWithParticipants,
  serializeCall,
  type CallScope,
} from "@/lib/calls";

function parseScope(searchParams: URLSearchParams): CallScope | null {
  const conversationId = searchParams.get("conversationId");
  const groupId = searchParams.get("groupId");
  const channelId = searchParams.get("channelId");
  if (conversationId) return { type: "DM", conversationId };
  if (groupId) return { type: "GROUP", groupId };
  if (channelId) return { type: "CHANNEL", channelId };
  return null;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scope = parseScope(req.nextUrl.searchParams);
  if (!scope) {
    return NextResponse.json({ error: "Missing call scope" }, { status: 400 });
  }

  try {
    await assertCanAccessCallScope(session.user.id, scope);
    const call = await prisma.callSession.findUnique({
      where: { roomId: getCallRoomId(scope) },
      select: { id: true, status: true },
    });

    if (!call || call.status === "ENDED" || call.status === "MISSED") {
      return NextResponse.json({ call: null });
    }

    const fullCall = await getCallWithParticipants(call.id);
    return NextResponse.json({ call: serializeCall(fullCall) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Forbidden" }, { status: 403 });
  }
}
