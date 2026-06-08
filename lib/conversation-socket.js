function getDmKey(userA, userB) {
  return [userA, userB].sort().join(":");
}

async function hasBlockingRelationship(prisma, userA, userB) {
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

async function canDmUsers(prisma, currentUserId, targetUserId) {
  if (currentUserId === targetUserId) return false;
  if (await hasBlockingRelationship(prisma, currentUserId, targetUserId)) return false;

  const profiles = await prisma.profile.findMany({
    where: { userId: { in: [currentUserId, targetUserId] } },
    select: { id: true, userId: true },
  });
  const currentProfile = profiles.find((profile) => profile.userId === currentUserId);
  const targetProfile = profiles.find((profile) => profile.userId === targetUserId);
  if (!currentProfile || !targetProfile) return false;

  const accepted = await prisma.match.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { profileId: currentProfile.id, matchedProfileId: targetProfile.id },
        { profileId: targetProfile.id, matchedProfileId: currentProfile.id },
      ],
    },
    select: { id: true },
  });

  return Boolean(accepted);
}

async function assertCanAccessConversation(prisma, userId, conversationId) {
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
    const other = participant.conversation.participants.find((entry) => entry.userId !== userId);
    if (!other || !(await canDmUsers(prisma, userId, other.userId))) throw new Error("Conversation access denied");
  }

  return participant.conversation;
}

function formatConversationMessage(message, currentUserId) {
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

async function createConversationMessage(prisma, params) {
  await assertCanAccessConversation(prisma, params.senderId, params.conversationId);

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

async function serializeConversation(prisma, conversation, currentUserId) {
  const participant = conversation.participants.find((entry) => entry.userId === currentUserId);
  const otherParticipants = conversation.participants.filter((entry) => entry.userId !== currentUserId);
  const dmPeer = conversation.type === "DM" ? otherParticipants[0] && otherParticipants[0].user : null;
  const lastMessage = conversation.messages && conversation.messages[0] ? conversation.messages[0] : null;
  const lastReadAt = (participant && participant.lastReadAt) || new Date(0);

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
    title: conversation.title || (dmPeer && dmPeer.name) || "Conversation",
    avatar: conversation.avatar || (dmPeer && dmPeer.image) || null,
    dmPeerId: dmPeer && dmPeer.id ? dmPeer.id : null,
    lastMessageAt: conversation.lastMessageAt,
    lastMessage: lastMessage
      ? {
          id: lastMessage.id,
          content: lastMessage.status === "DELETED" ? "Message deleted" : lastMessage.content,
          senderName: (lastMessage.sender && lastMessage.sender.name) || "Anonymous",
          timestamp: lastMessage.createdAt,
          status: lastMessage.status,
        }
      : null,
    unreadCount,
    muted: (participant && participant.muted) || false,
    archived: (participant && participant.archived) || false,
    participants: conversation.participants.map((entry) => ({
      id: entry.user.id,
      name: entry.user.name || entry.user.email || "Unknown",
      image: entry.user.image,
    })),
  };
}

async function emitConversationUpdated(prisma, io, conversationId) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      participants: {
        include: {
          user: { select: { id: true, name: true, image: true, email: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { sender: { select: { name: true } } },
      },
    },
  });

  if (!conversation) return;

  for (const participant of conversation.participants) {
    const payload = await serializeConversation(prisma, conversation, participant.userId);
    io.to(`user_${participant.userId}`).emit("conversation:updated", payload);
  }
}

function registerConversationHandlers({ io, socket, prisma, userId }) {
  socket.join(`user_${userId}`);

  socket.on("conversation:join", async (data) => {
    if (!userId || !data || !data.conversationId) return;
    try {
      await assertCanAccessConversation(prisma, userId, data.conversationId);
      socket.join(`conversation_${data.conversationId}`);
    } catch {
      socket.emit("conversation:error", { message: "You are not allowed to join this conversation" });
    }
  });

  socket.on("conversation:leave", (data) => {
    if (data && data.conversationId) socket.leave(`conversation_${data.conversationId}`);
  });

  socket.on("message:send", async (data) => {
    if (!userId || !data || !data.conversationId || !data.message) return;

    const content = String(data.message.content || "").trim();
    if (!content && !data.message.fileUrl) {
      socket.emit("conversation:error", { message: "Message content is required" });
      return;
    }

    try {
      const savedMessage = await createConversationMessage(prisma, {
        conversationId: data.conversationId,
        senderId: userId,
        content,
        fileUrl: data.message.fileUrl || null,
        fileType: data.message.fileType || null,
        fileName: data.message.fileName || null,
      });

      socket.emit("message:ack", { ...savedMessage, tempId: data.tempId });
      socket.to(`conversation_${data.conversationId}`).emit("message:new", savedMessage);
      await emitConversationUpdated(prisma, io, data.conversationId);
    } catch (error) {
      socket.emit("conversation:error", { message: (error && error.message) || "Unable to send message" });
    }
  });

  socket.on("message:delete", async (data) => {
    if (!userId || !data || !data.conversationId || !data.messageId) return;

    try {
      await assertCanAccessConversation(prisma, userId, data.conversationId);
      const message = await prisma.conversationMessage.findUnique({ where: { id: data.messageId } });
      if (!message || message.conversationId !== data.conversationId || message.senderId !== userId) return;

      await prisma.conversationMessage.update({
        where: { id: data.messageId },
        data: { status: "DELETED", content: "" },
      });

      io.to(`conversation_${data.conversationId}`).emit("message:deleted", { messageId: data.messageId });
      await emitConversationUpdated(prisma, io, data.conversationId);
    } catch (error) {
      socket.emit("conversation:error", { message: (error && error.message) || "Unable to delete message" });
    }
  });

  socket.on("conversation:read", async (data) => {
    if (!userId || !data || !data.conversationId) return;
    try {
      await assertCanAccessConversation(prisma, userId, data.conversationId);
      await prisma.conversationParticipant.updateMany({
        where: { conversationId: data.conversationId, userId },
        data: { lastReadAt: new Date() },
      });
      await emitConversationUpdated(prisma, io, data.conversationId);
    } catch {}
  });

  socket.on("typing:start", async (data) => {
    if (!userId || !data || !data.conversationId) return;
    try {
      await assertCanAccessConversation(prisma, userId, data.conversationId);
      socket.to(`conversation_${data.conversationId}`).emit("typing:start", {
        conversationId: data.conversationId,
        senderName: data.senderName,
      });
    } catch {}
  });

  socket.on("typing:stop", async (data) => {
    if (!userId || !data || !data.conversationId) return;
    try {
      await assertCanAccessConversation(prisma, userId, data.conversationId);
      socket.to(`conversation_${data.conversationId}`).emit("typing:stop", {
        conversationId: data.conversationId,
        senderName: data.senderName,
      });
    } catch {}
  });
}

module.exports = {
  getDmKey,
  canDmUsers,
  assertCanAccessConversation,
  createConversationMessage,
  emitConversationUpdated,
  registerConversationHandlers,
  serializeConversation,
};
