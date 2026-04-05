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

      socket.on('leave_room', (roomId: string) => {
        socket.leave(roomId);
        console.log(`User ${socket.data.user?.email} left room ${roomId}`);
      });

      socket.on('send_message', async (data: { roomId: string, message: any }) => {
        if (data.message && socket.data.user?.sub) {
          data.message.senderId = socket.data.user.sub;

          try {
            const savedMsg = await prisma.message.create({
              data: {
                content: data.message.content || "",
                fileUrl: data.message.fileUrl || null,
                fileType: data.message.fileType || null,
                fileName: data.message.fileName || null,
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

      socket.on('delete_message', async (data: { roomId: string, messageId: string }) => {
        if (!socket.data.user?.sub) return;

        try {
          const msg = await prisma.message.findUnique({ where: { id: data.messageId } });
          if (msg && msg.senderId === socket.data.user.sub) {
            await prisma.message.delete({ where: { id: data.messageId } });
            socket.to(data.roomId).emit('message_deleted', { messageId: data.messageId });
          }
        } catch (e) {
          console.error('Failed to delete message:', e);
        }
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
              content: data.message.content || "",
              fileUrl: data.message.fileUrl || null,
              fileType: data.message.fileType || null,
              fileName: data.message.fileName || null,
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

      socket.on('delete_channel_message', async (data: { channelId: string, messageId: string }) => {
        if (!socket.data.user?.sub) return;

        try {
          const msg = await prisma.channelMessage.findUnique({ where: { id: data.messageId } });
          if (msg && msg.senderId === socket.data.user.sub) {
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

      socket.on('join_group_room', (groupId: string) => {
        socket.join(`group_${groupId}`);
      });

      socket.on('send_group_message', async (data: { groupId: string, message: any }) => {
        if (!data.message || !socket.data.user?.sub) return;

        const senderId = socket.data.user.sub;

        try {
          const membership = await prisma.groupMember.findUnique({
            where: { groupId_userId: { groupId: data.groupId, userId: senderId } },
          });

          if (!membership) {
            socket.emit('group_error', { message: 'You must be a member to send messages' });
            return;
          }

          data.message.senderId = senderId;

          const savedMsg = await prisma.groupMessage.create({
            data: {
              content: data.message.content || "",
              fileUrl: data.message.fileUrl || null,
              fileType: data.message.fileType || null,
              fileName: data.message.fileName || null,
              senderId,
              groupId: data.groupId,
            },
          });

          data.message.id = savedMsg.id;
          data.message.timestamp = savedMsg.createdAt;
        } catch (e) {
          console.error('Failed to save group message:', e);
          return;
        }

        socket.to(`group_${data.groupId}`).emit('receive_group_message', data.message);
      });

      socket.on('delete_group_message', async (data: { groupId: string, messageId: string }) => {
        if (!socket.data.user?.sub) return;

        try {
          const msg = await prisma.groupMessage.findUnique({ where: { id: data.messageId } });
          if (msg && msg.senderId === socket.data.user.sub) {
            await prisma.groupMessage.delete({ where: { id: data.messageId } });
            socket.to(`group_${data.groupId}`).emit('group_message_deleted', { messageId: data.messageId });
          }
        } catch (e) {
          console.error('Failed to delete group message:', e);
        }
      });

      // ============================================
      // TYPING INDICATORS
      // ============================================

      socket.on('typing', (data: { roomId: string, senderName: string, type: 'channel' | 'group' | 'dm' }) => {
        let targetRoom = data.roomId;
        if (data.type === 'channel') targetRoom = `channel_${data.roomId}`;
        if (data.type === 'group') targetRoom = `group_${data.roomId}`;
        
        socket.to(targetRoom).emit('user_typing', { senderName: data.senderName });
      });

      socket.on('stop_typing', (data: { roomId: string, senderName: string, type: 'channel' | 'group' | 'dm' }) => {
        let targetRoom = data.roomId;
        if (data.type === 'channel') targetRoom = `channel_${data.roomId}`;
        if (data.type === 'group') targetRoom = `group_${data.roomId}`;
        
        socket.to(targetRoom).emit('user_stopped_typing', { senderName: data.senderName });
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
      // GROUP WEBRTC (MESH) SIGNALING
      // ============================================

      socket.on('join_group_call', (roomId: string) => {
        socket.join(`call_${roomId}`);
        // Notify others in the group call that a user joined
        if (userId) {
          socket.to(`call_${roomId}`).emit('user_joined_call', { userId, socketId: socket.id });
          console.log(`User ${userId} joined group call ${roomId}`);
        }
      });

      socket.on('webrtc_offer', (data: { to: string, roomId: string, offer: any }) => {
        // Send SDP offer directly to the specific user's socket ID (data.to is socketId)
        io.to(data.to).emit('receive_webrtc_offer', {
          from: socket.id,
          userId: userId,
          offer: data.offer
        });
      });

      socket.on('webrtc_answer', (data: { to: string, roomId: string, answer: any }) => {
        // Send SDP answer directly to the peer
        io.to(data.to).emit('receive_webrtc_answer', {
          from: socket.id,
          userId: userId,
          answer: data.answer
        });
      });

      socket.on('ice_candidate', (data: { to: string, roomId: string, candidate: any }) => {
        io.to(data.to).emit('receive_ice_candidate', {
          from: socket.id,
          userId: userId,
          candidate: data.candidate
        });
      });

      socket.on('leave_group_call', (roomId: string) => {
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

    res.socket.server.io = io;
  }
  res.end();
}
