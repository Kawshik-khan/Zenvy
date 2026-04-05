const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server: ServerIO } = require('socket.io');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Attach Socket.io to the persistent HTTP Server!
  const io = new ServerIO(server, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Track users
  const userSockets = new Map();

  function addUserSocket(userId, socketId) {
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socketId);
  }

  function removeUserSocket(userId, socketId) {
    const sockets = userSockets.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) userSockets.delete(userId);
    }
  }

  function getUserSocketIds(userId) {
    const sockets = userSockets.get(userId);
    return sockets ? Array.from(sockets) : [];
  }

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    let userId = null;

    // A simple authentication listener since Custom Server doesn't easily natively parse NextAuth JWTs without extra libraries
    socket.on('authenticate', (data) => {
      if (data && data.userId) {
        userId = data.userId;
        addUserSocket(userId, socket.id);
        console.log(`Socket ${socket.id} authenticated as User ${userId}`);
      }
    });

    // ============================================
    // CHAT ROOMS (messaging)
    // ============================================
    socket.on('join_room', (roomId) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    socket.on('leave_room', (roomId) => {
      socket.leave(roomId);
    });

    socket.on('send_message', async (data) => {
      if (data.message && userId) {
        const tempId = data.message.id;
        data.message.senderId = userId;
        try {
          const savedMsg = await prisma.message.create({
            data: {
              content: data.message.content,
              senderId: userId,
              roomId: data.roomId,
            }
          });
          data.message.id = savedMsg.id;
          data.message.timestamp = savedMsg.createdAt;
          socket.emit('message_sent_success', { tempId, realId: savedMsg.id });
        } catch (e) {
          console.error('Failed to save message to db:', e);
        }
      }
      socket.to(data.roomId).emit('receive_message', data.message);
    });

    socket.on('delete_message', async (data) => {
      if (!userId) return;
      try {
        const msg = await prisma.message.findUnique({ where: { id: data.messageId } });
        if (msg && msg.senderId === userId) {
          await prisma.message.delete({ where: { id: data.messageId } });
          socket.to(data.roomId).emit('message_deleted', { messageId: data.messageId });
        }
      } catch (e) {
        console.error('Failed to delete message:', e);
      }
    });

    socket.on('send_channel_message', async (data) => {
      if (!data.message || !userId) return;

      const tempId = data.message.id;

      try {
        const membership = await prisma.channelMember.findUnique({
          where: { channelId_userId: { channelId: data.channelId, userId } },
        });

        if (!membership) {
          socket.emit('channel_error', { message: 'You must be a member to send messages' });
          return;
        }

        data.message.senderId = userId;

        const savedMsg = await prisma.channelMessage.create({
          data: {
            content: data.message.content,
            senderId: userId,
            channelId: data.channelId,
          },
        });

        data.message.id = savedMsg.id;
        data.message.timestamp = savedMsg.createdAt;
        socket.emit('channel_message_sent_success', { tempId, realId: savedMsg.id });
      } catch (e) {
        console.error('Failed to save channel message:', e);
        return;
      }

      socket.to(`channel_${data.channelId}`).emit('receive_channel_message', data.message);
    });

    socket.on('delete_channel_message', async (data) => {
      if (!userId) return;
      try {
        const msg = await prisma.channelMessage.findUnique({ where: { id: data.messageId } });
        if (msg && msg.senderId === userId) {
          await prisma.channelMessage.delete({ where: { id: data.messageId } });
          socket.to(`channel_${data.channelId}`).emit('channel_message_deleted', { messageId: data.messageId });
        }
      } catch (e) {
        console.error('Failed to delete channel message:', e);
      }
    });

    // ============================================
    // GROUP MESSAGING
    // ============================================
    socket.on('join_group_room', (groupId) => {
      socket.join(`group_${groupId}`);
    });

    socket.on('send_group_message', async (data) => {
      if (!data.message || !userId) return;

      const tempId = data.message.id;

      try {
        const membership = await prisma.groupMember.findUnique({
          where: { groupId_userId: { groupId: data.groupId, userId } },
        });

        if (!membership) {
          socket.emit('group_error', { message: 'You must be a member to send messages' });
          return;
        }

        data.message.senderId = userId;

        const savedMsg = await prisma.groupMessage.create({
          data: {
            content: data.message.content,
            fileUrl: data.message.fileUrl || null,
            fileType: data.message.fileType || null,
            fileName: data.message.fileName || null,
            senderId: userId,
            groupId: data.groupId,
          },
        });

        data.message.id = savedMsg.id;
        data.message.timestamp = savedMsg.createdAt;
        socket.emit('group_message_sent_success', { tempId, realId: savedMsg.id });
      } catch (e) {
        console.error('Failed to save group message:', e);
        return;
      }

      socket.to(`group_${data.groupId}`).emit('receive_group_message', data.message);
    });

    socket.on('delete_group_message', async (data) => {
      if (!userId) return;
      try {
        const msg = await prisma.groupMessage.findUnique({ where: { id: data.messageId } });
        if (msg && msg.senderId === userId) {
          await prisma.groupMessage.delete({ where: { id: data.messageId } });
          socket.to(`group_${data.groupId}`).emit('group_message_deleted', { messageId: data.messageId });
        }
      } catch (e) {
        console.error('Failed to delete group message:', e);
      }
    });

    // ============================================
    // WEBRTC CALL SIGNALING (User ID targeted)
    // ============================================
    socket.on('call_user', (data) => {
      if (!userId) return;
      const targetSocketIds = getUserSocketIds(data.to);

      const callPayload = {
        from: userId,
        signalData: data.signalData,
        callerName: data.callerName,
        callerAvatar: data.callerAvatar,
        isVideo: data.isVideo,
        roomId: data.roomId,
      };

      if (targetSocketIds.length > 0) {
        for (const sid of targetSocketIds) {
          io.to(sid).emit('incoming_call', callPayload);
        }
      }
    });

    socket.on('answer_call', (data) => {
      const callerSocketIds = getUserSocketIds(data.to);
      for (const sid of callerSocketIds) {
        io.to(sid).emit('call_answered', data.signalData);
      }
    });

    socket.on('end_call', (data) => {
      if (!userId) return;
      const targetSocketIds = getUserSocketIds(data.to);
      for (const sid of targetSocketIds) {
        io.to(sid).emit('call_ended', { from: userId });
      }
    });

    socket.on('decline_call', (data) => {
      if (!userId) return;
      const targetSocketIds = getUserSocketIds(data.to);
      for (const sid of targetSocketIds) {
        io.to(sid).emit('call_declined', { from: userId });
      }
    });

    // ============================================
    // GROUP WEBRTC (MESH) SIGNALING
    // ============================================

    socket.on('join_group_call', (roomId) => {
      socket.join(`call_${roomId}`);
      if (userId) {
        socket.to(`call_${roomId}`).emit('user_joined_call', { userId, socketId: socket.id });
        console.log(`User ${userId} joined group call ${roomId}`);
      }
    });

    socket.on('webrtc_offer', (data) => {
      io.to(data.to).emit('receive_webrtc_offer', {
        from: socket.id,
        userId: userId,
        offer: data.offer
      });
    });

    socket.on('webrtc_answer', (data) => {
      io.to(data.to).emit('receive_webrtc_answer', {
        from: socket.id,
        userId: userId,
        answer: data.answer
      });
    });

    socket.on('ice_candidate', (data) => {
      io.to(data.to).emit('receive_ice_candidate', {
        from: socket.id,
        userId: userId,
        candidate: data.candidate
      });
    });

    socket.on('leave_group_call', (roomId) => {
      socket.leave(`call_${roomId}`);
      socket.to(`call_${roomId}`).emit('user_left_call', { userId, socketId: socket.id });
      console.log(`User ${userId} left group call ${roomId}`);
    });

    // ============================================
    // DISCONNECT
    // ============================================
    socket.on('disconnect', () => {
      if (userId) {
        removeUserSocket(userId, socket.id);
      }
      console.log('Client disconnected:', socket.id);
    });
  });

  server.listen(port, () => {
    console.log(`> Custom Next.js socket server ready on http://${hostname}:${port}`);
  });
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
