import { prisma } from "@/lib/prisma";
import { assertCanAccessConversation } from "@/lib/conversations";
import { canAccessChannel, canAccessGroup } from "@/lib/room-auth";

export type CallScope =
  | { type: "DM"; conversationId: string }
  | { type: "GROUP"; groupId: string }
  | { type: "CHANNEL"; channelId: string }
  | { type: "LOBBY" };

export function getCallRoomId(scope: CallScope) {
  if (scope.type === "DM") return `dm:${scope.conversationId}`;
  if (scope.type === "GROUP") return `group:${scope.groupId}`;
  if (scope.type === "CHANNEL") return `channel:${scope.channelId}`;
  return "lobby";
}

export async function assertCanAccessCallScope(userId: string, scope: CallScope) {
  if (scope.type === "DM") {
    return assertCanAccessConversation(userId, scope.conversationId);
  }

  if (scope.type === "GROUP") {
    if (!(await canAccessGroup(userId, scope.groupId))) {
      throw new Error("Not a member of this group");
    }
    return prisma.studyGroup.findUnique({ where: { id: scope.groupId } });
  }

  if (scope.type === "CHANNEL") {
    if (!(await canAccessChannel(userId, scope.channelId))) {
      throw new Error("Not a member of this channel");
    }
    return prisma.channel.findUnique({ where: { id: scope.channelId } });
  }

  return true;
}

export async function assertCanAccessCall(
  userId: string,
  callId: string,
  options: { includeParticipants?: boolean } = {},
): Promise<any> {
  const includeParticipants = options.includeParticipants ?? true;
  const call = await prisma.callSession.findUnique({
    where: { id: callId },
    ...(includeParticipants
      ? {
          include: {
            participants: {
              include: {
                user: { select: { id: true, name: true, image: true } },
              },
            },
          },
        }
      : {}),
  });

  if (!call) throw new Error("Call not found");

  if (call.type === "DM" && call.conversationId) {
    await assertCanAccessConversation(userId, call.conversationId);
  } else if (call.type === "GROUP" && call.groupId) {
    if (!(await canAccessGroup(userId, call.groupId))) throw new Error("Call access denied");
  } else if (call.type === "CHANNEL" && call.channelId) {
    if (!(await canAccessChannel(userId, call.channelId))) throw new Error("Call access denied");
  } else if (call.type !== "LOBBY") {
    throw new Error("Call access denied");
  }

  return call;
}

export function serializeCall(call: any) {
  return {
    id: call.id,
    roomId: call.roomId,
    type: call.type,
    mediaType: call.mediaType,
    status: call.status,
    conversationId: call.conversationId,
    groupId: call.groupId,
    channelId: call.channelId,
    startedById: call.startedById,
    startedAt: call.startedAt,
    endedAt: call.endedAt,
    participants: (call.participants || []).map((participant: any) => ({
      id: participant.id,
      userId: participant.userId,
      role: participant.role,
      status: participant.status,
      audioEnabled: participant.audioEnabled,
      videoEnabled: participant.videoEnabled,
      screenSharing: participant.screenSharing,
      joinedAt: participant.joinedAt,
      leftAt: participant.leftAt,
      user: participant.user
        ? {
            id: participant.user.id,
            name: participant.user.name || "Anonymous",
            image: participant.user.image,
          }
        : null,
    })),
  };
}

export async function getCallWithParticipants(callId: string) {
  return prisma.callSession.findUnique({
    where: { id: callId },
    include: {
      participants: {
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      },
    },
  });
}
