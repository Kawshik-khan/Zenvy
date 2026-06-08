import { prisma } from "@/lib/prisma";

export type ConversationMessagePayload = {
  id: string;
  tempId?: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderImage: string | null;
  content: string;
  fileUrl: string | null;
  fileType: string | null;
  fileName: string | null;
  status: string;
  timestamp: Date;
  isSelf?: boolean;
};

export function getDmKey(userA: string, userB: string) {
  return [userA, userB].sort().join(":");
}

async function hasBlockingRelationship(userA: string, userB: string) {
  const blocked = await prisma.userBlock.findFirst({
    where: {
      OR: [
        { blockerId: userA, blockedId: userB },
        { blockerId: userB, blockedId: userA },
      ],
    },
    select: { id: true },
  });

  return Boolean(blocked);
}

export async function canDmUsers(currentUserId: string, targetUserId: string) {
  if (currentUserId === targetUserId) return false;
  if (await hasBlockingRelationship(currentUserId, targetUserId)) return false;

  const profiles = await prisma.profile.findMany({
    where: { userId: { in: [currentUserId, targetUserId] } },
    select: { id: true, userId: true },
  });
  const currentProfileId = profiles.find((profile) => profile.userId === currentUserId)?.id;
  const targetProfileId = profiles.find((profile) => profile.userId === targetUserId)?.id;
  if (!currentProfileId || !targetProfileId) return false;

  const accepted = await prisma.match.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { profileId: currentProfileId, matchedProfileId: targetProfileId },
        { profileId: targetProfileId, matchedProfileId: currentProfileId },
      ],
    },
    select: { id: true },
  });

  return Boolean(accepted);
}

export async function assertCanAccessConversation(userId: string, conversationId: string) {
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
    include: {
      conversation: {
        include: {
          participants: {
            include: {
              user: { select: { id: true, name: true, image: true, email: true } },
            },
          },
        },
      },
    },
  });

  if (!participant) throw new Error("Conversation access denied");

  if (participant.conversation.type === "DM") {
    const other = participant.conversation.participants.find((p) => p.userId !== userId);
    if (!other || !(await canDmUsers(userId, other.userId))) throw new Error("Conversation access denied");
  }

  return participant.conversation;
}

export async function resolveDmConversation(currentUserId: string, targetUserId: string) {
  if (currentUserId === targetUserId) throw new Error("Cannot create a DM with yourself");

  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, name: true, image: true, email: true },
  });
  if (!target) throw new Error("Target user not found");

  if (!(await canDmUsers(currentUserId, targetUserId))) {
    throw new Error("You can message this user after the match request is accepted");
  }

  const dmKey = getDmKey(currentUserId, targetUserId);
  const existing = await prisma.conversation.findUnique({
    where: { dmKey },
    include: {
      participants: {
        include: {
          user: { select: { id: true, name: true, image: true, email: true } },
        },
      },
    },
  });

  if (existing) return existing;

  return prisma.conversation.create({
    data: {
      type: "DM",
      dmKey,
      participants: {
        create: [
          { userId: currentUserId, role: "MEMBER" },
          { userId: targetUserId, role: "MEMBER" },
        ],
      },
    },
    include: {
      participants: {
        include: {
          user: { select: { id: true, name: true, image: true, email: true } },
        },
      },
    },
  });
}

export async function createConversationMessage(params: {
  conversationId: string;
  senderId: string;
  content: string;
  fileUrl?: string | null;
  fileType?: string | null;
  fileName?: string | null;
}) {
  await assertCanAccessConversation(params.senderId, params.conversationId);

  const message = await prisma.conversationMessage.create({
    data: {
      conversationId: params.conversationId,
      senderId: params.senderId,
      content: params.content,
      fileUrl: params.fileUrl || null,
      fileType: params.fileType || null,
      fileName: params.fileName || null,
    },
    include: {
      sender: { select: { id: true, name: true, image: true } },
    },
  });

  await prisma.conversation.update({
    where: { id: params.conversationId },
    data: {
      lastMessageId: message.id,
      lastMessageAt: message.createdAt,
    },
  });

  return formatConversationMessage(message, params.senderId);
}

export function formatConversationMessage(message: {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  fileUrl: string | null;
  fileType: string | null;
  fileName: string | null;
  status: string;
  createdAt: Date;
  sender: { name: string | null; image: string | null };
}, currentUserId?: string): ConversationMessagePayload {
  return {
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    senderName: message.sender.name || "Anonymous",
    senderImage: message.sender.image,
    content: message.content,
    fileUrl: message.fileUrl,
    fileType: message.fileType,
    fileName: message.fileName,
    status: message.status,
    timestamp: message.createdAt,
    isSelf: currentUserId ? message.senderId === currentUserId : undefined,
  };
}

export async function serializeConversation(conversation: any, currentUserId: string) {
  const participant = conversation.participants.find((p: any) => p.userId === currentUserId);
  const otherParticipants = conversation.participants.filter((p: any) => p.userId !== currentUserId);
  const dmPeer = conversation.type === "DM" ? otherParticipants[0]?.user : null;
  const lastMessage = conversation.messages?.[0] || null;
  const lastReadAt = participant?.lastReadAt || new Date(0);

  const unreadCount = await prisma.conversationMessage.count({
    where: {
      conversationId: conversation.id,
      senderId: { not: currentUserId },
      status: { not: "DELETED" },
      createdAt: { gt: lastReadAt },
    },
  });

  return {
    id: conversation.id,
    type: conversation.type,
    title: conversation.title || dmPeer?.name || "Conversation",
    avatar: conversation.avatar || dmPeer?.image || null,
    dmPeerId: dmPeer?.id || null,
    lastMessageAt: conversation.lastMessageAt,
    lastMessage: lastMessage
      ? {
          id: lastMessage.id,
          content: lastMessage.status === "DELETED" ? "Message deleted" : lastMessage.content,
          senderName: lastMessage.sender?.name || "Anonymous",
          timestamp: lastMessage.createdAt,
          status: lastMessage.status,
        }
      : null,
    unreadCount,
    muted: participant?.muted || false,
    archived: participant?.archived || false,
    participants: conversation.participants.map((p: any) => ({
      id: p.user.id,
      name: p.user.name || p.user.email || "Unknown",
      image: p.user.image,
    })),
  };
}
