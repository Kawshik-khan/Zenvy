import { Server as NetServer } from 'http';
import { NextApiRequest } from 'next';
import { Server as ServerIO } from 'socket.io';
import { getToken } from 'next-auth/jwt';
import { prisma } from '../../lib/prisma';

// Conditionally import web-push (server-side only)
let webpush: any = null;
try {
  webpush = require('web-push');
  if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      `mailto:${process.env.VAPID_EMAIL || 'admin@zenvy.app'}`,
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  }
} catch (e) {
  console.warn('web-push not configured, push notifications disabled');
}

export const config = {
  api: {
    bodyParser: false,
  },
};

// Map of userId -> Set of socket IDs (a user can have multiple tabs)
const userSockets = new Map<string, Set<string>>();

function addUserSocket(userId: string, socketId: string) {
  if (!userSockets.has(userId)) {
    userSockets.set(userId, new Set());
  }
  userSockets.get(userId)!.add(socketId);
}

function removeUserSocket(userId: string,socketId: string) {
  const sockets = userSockets.get(userId);
  if (sockets) {
    sockets.delete(socketId);
    if (sockets.size === 0) userSockets.delete(userId);
  }
}

function getUserSocketIds(userId: string): string[] {
  const sockets = userSockets.get(userId);
  return sockets ? Array.from(sockets) : [];
}

async function sendPushNotification(targetUserId: string, payload: object) {
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
      } catch (err: any) {
        // Remove expired/invalid subscriptions
        if (err.statusCode === 410 || err.statusCode === 404) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
        console.error('Push notification error:', err.statusCode || err.message);
      }
    }
  } catch (err) {
    console.error('Failed to send push notifications:', err);
  }
}

export default function SocketHandler(req: NextApiRequest, res: any) {
  if (!res.socket.server.io) {
    console.log('Initializing Socket.io server...');
    const httpServer: NetServer = res.socket.server as any;
    const io = new ServerIO(httpServer, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        methods: ["GET", "POST"]
      }
    });

    // Authentication Middleware
    io.use(async (socket, next) => {
      try {
        const token = await getToken({
          req: socket.request as any,
          secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
          cookieName: process.env.NODE_ENV === 'production' ? '__Secure-authjs.session-token' : 'authjs.session-token'
        });

        if (!token || !token.sub) {
          const fallbackToken = await getToken({
              req: socket.request as any,
              secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
              cookieName: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token'
          });

          if (!fallbackToken || !fallbackToken.sub) {
             console.log('Socket connection rejected: No valid session token');
             return next(new Error('unauthorized'));
          } else {
             socket.data.user = fallbackToken;
             return next();
          }
        }

        socket.data.user = token;
        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('unauthorized'));
      }
    });

    io.on('connection', (socket) => {
      const userId = socket.data.user?.sub;
      console.log('Client connected:', socket.id, 'User:', socket.data.user?.email);

      // Register user for targeted signaling
      if (userId) {
        addUserSocket(userId, socket.id);
      }

      // ============================================
      // CHAT ROOMS (messaging)
      // ============================================

      socket.on('join_room', (roomId: string) => {
        socket.join(roomId);
        console.log(`User ${socket.data.user?.email} joined room ${roomId}`);
      });

      socket.on('send_message', async (data: { roomId: string, message: any }) => {
        if (data.message && socket.data.user?.sub) {
          data.message.senderId = socket.data.user.sub;

          try {
            const savedMsg = await prisma.message.create({
              data: {
                content: data.message.content,
                senderId: socket.data.user.sub,
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

      // ============================================
      // CHANNEL MESSAGING
      // ============================================

      socket.on('join_channel_room', (channelId: string) => {
        socket.join(`channel_${channelId}`);
      });

      socket.on('send_channel_message', async (data: { channelId: string, message: any }) => {
        if (!data.message || !socket.data.user?.sub) return;

        const senderId = socket.data.user.sub;

        try {
          const membership = await prisma.channelMember.findUnique({
            where: { channelId_userId: { channelId: data.channelId, userId: senderId } },
          });

          if (!membership) {
            socket.emit('channel_error', { message: 'You must be a member to send messages' });
            return;
          }

          data.message.senderId = senderId;

          const savedMsg = await prisma.channelMessage.create({
            data: {
              content: data.message.content,
              senderId,
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
      // WEBRTC CALL SIGNALING (User ID based, not room based)
      // ============================================

      socket.on('call_user', async (data: {
        to: string,
        signalData: any,
        callerName: string,
        callerAvatar: string,
        isVideo: boolean,
        roomId: string
      }) => {
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
          // Target is online — send directly to their sockets
          for (const sid of targetSocketIds) {
            io.to(sid).emit('incoming_call', callPayload);
          }
          console.log(`Call signal sent from ${userId} to ${data.to} (${targetSocketIds.length} sockets)`);
        } else if (data.signalData.type === 'offer') {
          // Target is offline or backgrounded — send push notification
          // We ONLY send this on the initial 'offer', avoiding spam for every trickle ICE candidate
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

      socket.on('answer_call', (data: { to: string, signalData: any }) => {
        // Send answer signal directly to the caller
        const callerSocketIds = getUserSocketIds(data.to);
        for (const sid of callerSocketIds) {
          io.to(sid).emit('call_answered', data.signalData);
        }
        console.log(`Call answered, signal sent to ${data.to}`);
      });

      socket.on('end_call', (data: { to: string, roomId: string }) => {
        const targetSocketIds = getUserSocketIds(data.to);
        for (const sid of targetSocketIds) {
          io.to(sid).emit('call_ended', { from: userId });
        }
      });

      socket.on('decline_call', (data: { to: string }) => {
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

    res.socket.server.io = io;
  }
  res.end();
}
