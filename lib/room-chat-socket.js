const { invalidateStudyMetrics } = require("./cache-runtime");

// Group and channel chat over Socket.IO, shared by every socket server (standalone-socket.js on
// Render, server.js and pages/api/socket.ts) so they cannot drift apart again.
//
// Messages are saved over HTTP (POST /api/groups/messages, /api/channels/messages); the client then
// emits `*_message:created` with the saved id and this server broadcasts the row it reads back from
// the database. The older `send_*_message` events, which save through the socket, stay for clients
// loaded before that change.

const ROOMS = {
  group: {
    room: (id) => `group_${id}`,
    idKey: "groupId",
    member: (prisma, roomId, userId) =>
      prisma.groupMember.findUnique({ where: { groupId_userId: { groupId: roomId, userId } }, select: { id: true } }),
    messages: (prisma) => prisma.groupMessage,
    events: {
      join: "join_group_room",
      leave: "leave_group_room",
      send: "send_group_message",
      created: "group_message:created",
      del: "delete_group_message",
      receive: "receive_group_message",
      sent: "group_message_sent_success",
      deleted: "group_message_deleted",
      error: "group_error",
    },
  },
  channel: {
    room: (id) => `channel_${id}`,
    idKey: "channelId",
    member: (prisma, roomId, userId) =>
      prisma.channelMember.findUnique({ where: { channelId_userId: { channelId: roomId, userId } }, select: { id: true } }),
    messages: (prisma) => prisma.channelMessage,
    events: {
      join: "join_channel_room",
      leave: "leave_channel_room",
      send: "send_channel_message",
      created: "channel_message:created",
      del: "delete_channel_message",
      receive: "receive_channel_message",
      sent: "channel_message_sent_success",
      deleted: "channel_message_deleted",
      error: "channel_error",
    },
  },
};

const MAX_CONTENT = 4000;

function isId(value) {
  return typeof value === "string" && value.length > 0 && value.length <= 64;
}

function optionalString(value, max) {
  return typeof value === "string" && value.length > 0 ? value.slice(0, max) : null;
}

function formatRoomMessage(message) {
  return {
    id: message.id,
    senderId: message.senderId,
    senderName: (message.sender && message.sender.name) || "Anonymous",
    senderImage: (message.sender && message.sender.image) || null,
    content: message.content,
    fileUrl: message.fileUrl || null,
    fileType: message.fileType || null,
    fileName: message.fileName || null,
    timestamp: message.createdAt,
    isSelf: false,
  };
}

const senderSelect = { sender: { select: { name: true, image: true } } };

function registerRoomChatHandlers({ socket, prisma, userId }) {
  for (const kind of Object.keys(ROOMS)) {
    const spec = ROOMS[kind];
    const ev = spec.events;
    const isMember = async (roomId) => Boolean(userId && isId(roomId) && (await spec.member(prisma, roomId, userId)));

    socket.on(ev.join, async (roomId) => {
      if (!(await isMember(roomId))) {
        socket.emit(ev.error, { message: `You must be a member to join this ${kind}` });
        return;
      }
      socket.join(spec.room(roomId));
    });

    socket.on(ev.leave, (roomId) => {
      if (isId(roomId)) socket.leave(spec.room(roomId));
    });

    // A message was saved over HTTP: broadcast the stored row, never what the client sent.
    socket.on(ev.created, async (data) => {
      const roomId = data && data[spec.idKey];
      if (!isId(roomId) || !isId(data.messageId) || !(await isMember(roomId))) return;
      try {
        const message = await spec.messages(prisma).findUnique({ where: { id: data.messageId }, include: senderSelect });
        if (!message || message.senderId !== userId || message[spec.idKey] !== roomId) return;
        socket.to(spec.room(roomId)).emit(ev.receive, formatRoomMessage(message));
      } catch (error) {
        console.error(`Failed to broadcast ${kind} message:`, error);
      }
    });

    // Legacy: save and broadcast in one step.
    socket.on(ev.send, async (data) => {
      const roomId = data && data[spec.idKey];
      const input = data && data.message;
      if (!input || !isId(roomId)) return;
      if (!(await isMember(roomId))) {
        socket.emit(ev.error, { message: "You must be a member to send messages" });
        return;
      }

      const content = typeof input.content === "string" ? input.content.slice(0, MAX_CONTENT) : "";
      const fileUrl = optionalString(input.fileUrl, 2048);
      if (!content.trim() && !fileUrl) return;

      try {
        const message = await spec.messages(prisma).create({
          data: {
            content,
            fileUrl,
            fileType: fileUrl ? optionalString(input.fileType, 255) : null,
            fileName: fileUrl ? optionalString(input.fileName, 255) : null,
            senderId: userId,
            [spec.idKey]: roomId,
          },
          include: senderSelect,
        });
        await invalidateStudyMetrics(userId);
        socket.emit(ev.sent, { tempId: input.id, realId: message.id });
        socket.to(spec.room(roomId)).emit(ev.receive, formatRoomMessage(message));
      } catch (error) {
        console.error(`Failed to save ${kind} message:`, error);
        socket.emit(ev.error, { message: "Message could not be sent" });
      }
    });

    socket.on(ev.del, async (data) => {
      const roomId = data && data[spec.idKey];
      if (!userId || !isId(roomId) || !isId(data.messageId)) return;
      try {
        const message = await spec.messages(prisma).findUnique({ where: { id: data.messageId } });
        if (!message || message.senderId !== userId || message[spec.idKey] !== roomId) return;
        await spec.messages(prisma).delete({ where: { id: data.messageId } });
        await invalidateStudyMetrics(userId);
        socket.to(spec.room(roomId)).emit(ev.deleted, { messageId: data.messageId });
      } catch (error) {
        console.error(`Failed to delete ${kind} message:`, error);
      }
    });
  }

  // Typing indicators reach a group or channel only from a socket that joined it (membership was
  // checked on join). Direct messages use typing:start/typing:stop in conversation-socket.js.
  const typingRoom = (data) => {
    if (!data || !isId(data.roomId) || !ROOMS[data.type]) return null;
    const room = ROOMS[data.type].room(data.roomId);
    return socket.rooms.has(room) ? room : null;
  };
  const senderName = (data) => (typeof data.senderName === "string" ? data.senderName.slice(0, 100) : "Someone");

  socket.on("typing", (data) => {
    const room = typingRoom(data);
    if (room) socket.to(room).emit("user_typing", { senderName: senderName(data) });
  });

  socket.on("stop_typing", (data) => {
    const room = typingRoom(data);
    if (room) socket.to(room).emit("user_stopped_typing", { senderName: senderName(data) });
  });
}

module.exports = { ROOMS, formatRoomMessage, registerRoomChatHandlers };
