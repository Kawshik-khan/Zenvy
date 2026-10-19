const { createServer } = require('http');
const { Server: ServerIO } = require('socket.io');
const { PrismaClient } = require('@prisma/client');
const { getToken } = require('next-auth/jwt');
const { verifySocketToken } = require('./lib/socket-auth');
const { invalidateStudyMetrics } = require('./lib/cache-runtime');
const { canDmUsers, registerConversationHandlers } = require('./lib/conversation-socket');

// Initialize Prisma
const prisma = new PrismaClient();

// Conditionally load web-push for WebRTC Push Notifications
let webpush = null;
try {
  webpush = require('web-push');
  if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      `mailto:${process.env.VAPID_EMAIL || 'admin@zenvy.app'}`,
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    console.log("Web Push Notifications enabled.");
  }
} catch (e) {
  console.warn('web-push not configured, push notifications disabled');
}

const port = process.env.PORT || 3000;

// Create raw HTTP server (NO Next.js - saves 90% of memory!)
const server = createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');
  res.writeHead(200);
  res.end('Zenvy Standalone Socket Server is Alive!');
});

const io = new ServerIO(server, {
  path: '/api/socket',
  cors: {
    origin: process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    methods: ["GET", "POST"]
  }
});

io.use(async (socket, next) => {
  try {
    const socketToken = verifySocketToken(socket.handshake.auth && socket.handshake.auth.token);
    if (socketToken && socketToken.sub) {
      socket.data.userId = socketToken.sub;
      socket.data.user = socketToken;
      return next();
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
      return next(new Error('unauthorized'));
    }

    socket.data.userId = fallbackToken.sub;
    socket.data.user = fallbackToken;
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('unauthorized'));
  }
});

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

async function sendPushNotification(targetUserId, payload) {
  if (!webpush || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return;

  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: targetUserId },
    });

    const payloadStr = JSON.stringify(payload);

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payloadStr
        );
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      }
    }
  } catch (err) {
    console.error('Failed to send push notifications:', err);
  }
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
      } catch (e) {
        console.error('Failed to save message to db:', e);
      }
    }
    socket.to(data.roomId).emit('receive_message', data.message);
  });

  socket.on('send_channel_message', async (data) => {
    if (!data.message || !userId) return;

    try {
      const membership = await prisma.channelMember.findUnique({
        where: { channelId_userId: { channelId: data.channelId, userId } },
      });

      if (!membership) {
        socket.emit('channel_error', { message: 'You must be a member' });
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
    } catch (e) {
      console.error('Failed to save channel message:', e);
      return;
    }

    socket.to(`channel_${data.channelId}`).emit('receive_channel_message', data.message);
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
          await sendPushNotification(participant.userId, {
            type: 'incoming_call',
            title: 'Incoming call',
            body: call.mediaType === 'VIDEO' ? 'Incoming video call...' : 'Incoming voice call...',
            callId: call.id,
            mediaType: call.mediaType,
          });
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
    } else if (data.signalData.type === 'offer') {
      console.log(`User ${data.to} not connected, sending push notification`);
      await sendPushNotification(data.to, {
        type: 'incoming_call',
        title: `${data.callerName} is calling`,
        body: data.isVideo ? 'Incoming video call...' : 'Incoming voice call...',
        callerName: data.callerName,
        callerAvatar: data.callerAvatar,
        callerId: userId,
        isVideo: data.isVideo,
        roomId: data.roomId,
      });
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
  console.log(`> Standalone Raw Socket Server ready on HTTP port ${port}`);
});
