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

function parseScope(body: any): CallScope | null {
  if (body?.conversationId) return { type: "DM", conversationId: String(body.conversationId) };
  if (body?.groupId) return { type: "GROUP", groupId: String(body.groupId) };
  if (body?.channelId) return { type: "CHANNEL", channelId: String(body.channelId) };
  if (body?.type === "LOBBY") return { type: "LOBBY" };
  return null;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const scope = parseScope(body);
  const mediaType = body?.mediaType === "VIDEO" ? "VIDEO" : "AUDIO";
  if (!scope) {
    return NextResponse.json({ error: "Missing call scope" }, { status: 400 });
  }

  try {
    const scopeData: any = await assertCanAccessCallScope(session.user.id, scope);
    const roomId = getCallRoomId(scope);

    const call = await prisma.callSession.upsert({
      where: { roomId },
      update: {
        type: scope.type,
        mediaType,
        status: scope.type === "DM" ? "RINGING" : "ACTIVE",
        startedById: session.user.id,
        startedAt: new Date(),
        endedAt: null,
        conversationId: scope.type === "DM" ? scope.conversationId : null,
        groupId: scope.type === "GROUP" ? scope.groupId : null,
        channelId: scope.type === "CHANNEL" ? scope.channelId : null,
      },
      create: {
        roomId,
        type: scope.type,
        mediaType,
        status: scope.type === "DM" ? "RINGING" : "ACTIVE",
        startedById: session.user.id,
        startedAt: new Date(),
        conversationId: scope.type === "DM" ? scope.conversationId : null,
        groupId: scope.type === "GROUP" ? scope.groupId : null,
        channelId: scope.type === "CHANNEL" ? scope.channelId : null,
      },
    });

    await prisma.callParticipant.upsert({
      where: { callId_userId: { callId: call.id, userId: session.user.id } },
      update: {
        role: "HOST",
        status: "JOINED",
        leftAt: null,
        joinedAt: new Date(),
        lastSeenAt: new Date(),
        audioEnabled: true,
        videoEnabled: mediaType === "VIDEO",
      },
      create: {
        callId: call.id,
        userId: session.user.id,
        role: "HOST",
        status: "JOINED",
        videoEnabled: mediaType === "VIDEO",
      },
    });

    if (scope.type === "DM" && scopeData?.participants) {
      for (const participant of scopeData.participants) {
        if (participant.userId === session.user.id) continue;
        await prisma.callParticipant.upsert({
          where: { callId_userId: { callId: call.id, userId: participant.userId } },
          update: { status: "INVITED", leftAt: null, lastSeenAt: new Date() },
          create: {
            callId: call.id,
            userId: participant.userId,
            role: "MEMBER",
            status: "INVITED",
            videoEnabled: mediaType === "VIDEO",
          },
        });
      }
    }

    const updated = await getCallWithParticipants(call.id);
    return NextResponse.json({ call: serializeCall(updated) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unable to start call" }, { status: 403 });
  }
}
