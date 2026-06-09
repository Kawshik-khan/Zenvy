const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server: ServerIO } = require('socket.io');
const { PrismaClient } = require('@prisma/client');
const { getToken } = require('next-auth/jwt');
const { verifySocketToken } = require('./lib/socket-auth');
const { invalidateStudyMetrics } = require('./lib/cache-runtime');
const { canDmUsers, registerConversationHandlers } = require('./lib/conversation-socket');

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
      origin: process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  io.use(async (socket, nextMiddleware) => {
    try {
      const socketToken = verifySocketToken(socket.handshake.auth && socket.handshake.auth.token);
      if (socketToken && socketToken.sub) {
        socket.data.userId = socketToken.sub;
        socket.data.user = socketToken;
        return nextMiddleware();
      }

      const token = await getToken({
        req: socket.request,
        secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
        cookieName: process.env.NODE_ENV === 'production' ? '__Secure-authjs.session-token' : 'authjs.session-token',
      });

      const fallbackToken = token || await getToken({
        req: socket.request,
        secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
        cookieName: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      });

      if (!fallbackToken?.sub) {
        return nextMiddleware(new Error('unauthorized'));
      }

      socket.data.userId = fallbackToken.sub;
      socket.data.user = fallbackToken;
      nextMiddleware();
    } catch (error) {
      console.error('Socket authentication error:', error);
      nextMiddleware(new Error('unauthorized'));
    }
  });

  // Track users
  const userSockets = new Map();
  const socketUsers = new Map();

  function addUserSocket(userId, socketId) {
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socketId);
    socketUsers.set(socketId, userId);
  }

  function removeUserSocket(userId, socketId) {
    const sockets = userSockets.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) userSockets.delete(userId);
    }
    socketUsers.delete(socketId);
  }

  function getUserSocketIds(userId) {
    const sockets = userSockets.get(userId);
    return sockets ? Array.from(sockets) : [];
  }

  function parseDmRoomId(roomId) {
    if (!roomId || !roomId.startsWith('dm_')) return null;
    const parts = roomId.slice(3).split('_').filter(Boolean);
    if (parts.length !== 2) return null;
    return { userA: parts[0], userB: parts[1] };
  }

  async function canAccessMessageRoom(currentUserId, roomId) {
    if (roomId === 'global_lobby') return true;
    const dm = parseDmRoomId(roomId);
    if (!dm || (dm.userA !== currentUserId && dm.userB !== currentUserId)) return false;
    const otherUserId = dm.userA === currentUserId ? dm.userB : dm.userA;
    return canDmUsers(prisma, currentUserId, otherUserId);
  }

  async function canSignalUser(fromUserId, toUserId, roomId) {
    if (!fromUserId || !toUserId || fromUserId === toUserId) return false;
    if (roomId) {
      const allowed = await canAccessMessageRoom(fromUserId, roomId);
      if (!allowed) return false;
      const dm = parseDmRoomId(roomId);
      if (dm && dm.userA !== toUserId && dm.userB !== toUserId) return false;
    }
    return canDmUsers(prisma, fromUserId, toUserId);
  }

  async function canAccessGroup(currentUserId, groupId) {
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: currentUserId } },
      select: { id: true },
    });
    return Boolean(membership);
  }

  async function canAccessChannel(currentUserId, channelId) {
    const membership = await prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId: currentUserId } },
      select: { id: true },
    });
    return Boolean(membership);
  }

  async function getCallWithParticipants(callId) {
    return prisma.callSession.findUnique({
      where: { id: callId },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true, image: true } } },
        },
      },
    });
  }

  async function assertCanAccessCall(currentUserId, callId) {
    const call = await getCallWithParticipants(callId);
    if (!call) throw new Error('Call not found');
    if (call.type === 'DM' && call.conversationId) {
      const conversation = await prisma.conversation.findUnique({
        where: { id: call.conversationId },
        include: { participants: { select: { userId: true } } },
      });
      const other = conversation && conversation.participants.find((participant) => participant.userId !== currentUserId);
      if (!conversation || !conversation.participants.some((participant) => participant.userId === currentUserId) || !other || !(await canDmUsers(prisma, currentUserId, other.userId))) {
        throw new Error('Call access denied');
      }
    } else if (call.type === 'GROUP' && call.groupId) {
      if (!(await canAccessGroup(currentUserId, call.groupId))) throw new Error('Call access denied');
    } else if (call.type === 'CHANNEL' && call.channelId) {
      if (!(await canAccessChannel(currentUserId, call.channelId))) throw new Error('Call access denied');
    }
    return call;
  }

  function serializeCall(call) {
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
      participants: call.participants.map((participant) => ({
        userId: participant.userId,
        status: participant.status,
        audioEnabled: participant.audioEnabled,
        videoEnabled: participant.videoEnabled,
        screenSharing: participant.screenSharing,
        user: participant.user,
      })),
    };
  }

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    const userId = socket.data.userId;
    addUserSocket(userId, socket.id);
    socket.join(`user_${userId}`);
    registerConversationHandlers({ io, socket, prisma, userId });

    socket.on('authenticate', () => {
      socket.emit('authenticated', { userId });
    });

    // ============================================
    // CHAT ROOMS (messaging)
    // ============================================
    socket.on('join_room', async (roomId) => {
      if (!userId || !(await canAccessMessageRoom(userId, roomId))) {
        socket.emit('room_error', { message: 'You are not allowed to join this room' });
        return;
      }
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    socket.on('leave_room', (roomId) => {
      socket.leave(roomId);
    });

    socket.on('send_message', async (data) => {
      if (data.message && userId) {
        if (!(await canAccessMessageRoom(userId, data.roomId))) {
          socket.emit('room_error', { message: 'You are not allowed to send messages in this room' });
          return;
        }
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
          await invalidateStudyMetrics(userId);
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
        if (!(await canAccessMessageRoom(userId, data.roomId))) {
          socket.emit('room_error', { message: 'You are not allowed to delete messages in this room' });
          return;
        }
        const msg = await prisma.message.findUnique({ where: { id: data.messageId } });
        if (msg && msg.senderId === userId && msg.roomId === data.roomId) {
          await prisma.message.delete({ where: { id: data.messageId } });
          await invalidateStudyMetrics(userId);
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
        await invalidateStudyMetrics(userId);
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
          await invalidateStudyMetrics(userId);
          socket.to(`channel_${data.channelId}`).emit('channel_message_deleted', { messageId: data.messageId });
        }
      } catch (e) {
        console.error('Failed to delete channel message:', e);
      }
    });

    // ============================================
    // GROUP MESSAGING
    // ============================================
    socket.on('join_group_room', async (groupId) => {
      if (!userId || !(await canAccessGroup(userId, groupId))) {
        socket.emit('group_error', { message: 'You must be a member to join this group' });
        return;
      }
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
        await invalidateStudyMetrics(userId);
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
          await invalidateStudyMetrics(userId);
          socket.to(`group_${data.groupId}`).emit('group_message_deleted', { messageId: data.messageId });
        }
      } catch (e) {
        console.error('Failed to delete group message:', e);
      }
    });

    // ============================================
    // WEBRTC CALL SIGNALING (User ID targeted)
    // ============================================
    const emitCallState = async (callId) => {
      const call = await getCallWithParticipants(callId);
      if (!call) return;
      const payload = serializeCall(call);
      io.to(`call_${call.id}`).emit('call:state', payload);
      if (call.groupId) io.to(`group_${call.groupId}`).emit('call:state', payload);
      if (call.channelId) io.to(`channel_${call.channelId}`).emit('call:state', payload);
      if (call.conversationId) io.to(`conversation_${call.conversationId}`).emit('call:state', payload);
    };

    function isSocketInCallRoom(targetSocket, callId) {
      return Boolean(targetSocket && callId && targetSocket.rooms.has(`call_${callId}`));
    }

    socket.on('call:start', async (data) => {
      if (!userId) return;
      try {
        const call = await assertCanAccessCall(userId, data.callId);
        const payload = serializeCall(call);
        socket.join(`call_${call.id}`);
        if (call.type === 'DM') {
          for (const participant of call.participants.filter((entry) => entry.userId !== userId)) {
            for (const sid of getUserSocketIds(participant.userId)) {
              io.to(sid).emit('call:incoming', payload);
            }
          }
        }
        await emitCallState(call.id);
      } catch (error) {
        socket.emit('call:error', { message: error.message || 'Unable to start call' });
      }
    });

    socket.on('call:join', async (data) => {
      if (!userId) return;
      try {
        const call = await assertCanAccessCall(userId, data.callId);
        socket.join(`call_${call.id}`);
        socket.to(`call_${call.id}`).emit('call:peer-joined', { callId: call.id, userId, socketId: socket.id });
        await emitCallState(call.id);
      } catch (error) {
        socket.emit('call:error', { message: error.message || 'Unable to join call' });
      }
    });

    socket.on('call:signal', async (data) => {
      if (!userId || !data.toSocketId) return;
      try {
        const targetUserId = socketUsers.get(data.toSocketId);
        if (!targetUserId) return;
        const targetSocket = io.sockets.sockets.get(data.toSocketId);
        if (!isSocketInCallRoom(socket, data.callId) || !isSocketInCallRoom(targetSocket, data.callId)) return;
        io.to(data.toSocketId).emit('call:signal', {
          callId: data.callId,
          fromSocketId: socket.id,
          fromUserId: userId,
          signal: data.signal,
        });
      } catch (error) {
        socket.emit('call:error', { message: error.message || 'Unable to send call signal' });
      }
    });

    socket.on('call:media-state', async (data) => {
      if (!userId) return;
      try {
        if (!isSocketInCallRoom(socket, data.callId)) {
          await assertCanAccessCall(userId, data.callId);
          socket.join(`call_${data.callId}`);
        }
        await prisma.callParticipant.update({
          where: { callId_userId: { callId: data.callId, userId } },
          data: {
            ...(typeof data.audioEnabled === 'boolean' ? { audioEnabled: data.audioEnabled } : {}),
            ...(typeof data.videoEnabled === 'boolean' ? { videoEnabled: data.videoEnabled } : {}),
            ...(typeof data.screenSharing === 'boolean' ? { screenSharing: data.screenSharing } : {}),
            lastSeenAt: new Date(),
          },
        });
        await emitCallState(data.callId);
      } catch (error) {
        socket.emit('call:error', { message: error.message || 'Unable to update call state' });
      }
    });

    socket.on('call:leave', async (data) => {
      if (!userId) return;
      try {
        if (!isSocketInCallRoom(socket, data.callId)) return;
        socket.leave(`call_${data.callId}`);
        socket.to(`call_${data.callId}`).emit('call:peer-left', { callId: data.callId, userId, socketId: socket.id });
        await emitCallState(data.callId);
      } catch (error) {
        socket.emit('call:error', { message: error.message || 'Unable to leave call' });
      }
    });

    socket.on('call:decline', async (data) => {
      if (!userId) return;
      try {
        const call = await assertCanAccessCall(userId, data.callId);
        for (const participant of call.participants) {
          if (participant.userId === userId) continue;
          for (const sid of getUserSocketIds(participant.userId)) {
            io.to(sid).emit('call:declined', { callId: call.id, fromUserId: userId });
          }
        }
        await emitCallState(call.id);
      } catch (error) {
        socket.emit('call:error', { message: error.message || 'Unable to decline call' });
      }
    });

    socket.on('call_user', async (data) => {
      if (!userId) return;
      if (!(await canSignalUser(userId, data.to, data.roomId))) {
        socket.emit('call_error', { message: 'You are not allowed to call this user' });
        return;
      }
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

    socket.on('answer_call', async (data) => {
      if (!userId || !(await canSignalUser(userId, data.to, data.roomId))) return;
      const callerSocketIds = getUserSocketIds(data.to);
      for (const sid of callerSocketIds) {
        io.to(sid).emit('call_answered', data.signalData);
      }
    });

    socket.on('end_call', async (data) => {
      if (!userId) return;
      if (!(await canSignalUser(userId, data.to, data.roomId))) return;
      const targetSocketIds = getUserSocketIds(data.to);
      for (const sid of targetSocketIds) {
        io.to(sid).emit('call_ended', { from: userId });
      }
    });

    socket.on('decline_call', async (data) => {
      if (!userId) return;
      if (!(await canSignalUser(userId, data.to, data.roomId))) return;
      const targetSocketIds = getUserSocketIds(data.to);
      for (const sid of targetSocketIds) {
        io.to(sid).emit('call_declined', { from: userId });
      }
    });

    // ============================================
    // GROUP WEBRTC (MESH) SIGNALING
    // ============================================

    socket.on('join_group_call', async (roomId) => {
      if (!userId || !(await canAccessGroup(userId, roomId))) {
        socket.emit('call_error', { message: 'You must be a group member to join this call' });
        return;
      }
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
