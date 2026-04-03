const { createServer } = require('http');
const { Server: ServerIO } = require('socket.io');
const { PrismaClient } = require('@prisma/client');

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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.writeHead(200);
  res.end('Zenvy Standalone Socket Server is Alive!');
});

const io = new ServerIO(server, {
  path: '/api/socket',
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

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
  let userId = null;

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
    } catch (e) {
      console.error('Failed to save channel message:', e);
      return;
    }

    socket.to(`channel_${data.channelId}`).emit('receive_channel_message', data.message);
  });

  // ============================================
  // WEBRTC CALL SIGNALING (User ID targeted)
  // ============================================
  socket.on('call_user', async (data) => {
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
