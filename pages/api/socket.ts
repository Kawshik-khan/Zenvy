import { Server as NetServer, IncomingMessage } from 'http';
import { NextApiRequest } from 'next';
import { Server as ServerIO } from 'socket.io';
import { getToken } from 'next-auth/jwt';
import { prisma } from '../../lib/prisma';

export const config = {
  api: {
    bodyParser: false,
  },
};

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
          // Attempting fallback to NextAuth v4 cookie name if previous fails
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
      console.log('Client connected:', socket.id, 'User:', socket.data.user?.email);
      
      socket.on('join_room', (roomId: string) => {
        socket.join(roomId);
        console.log(`User ${socket.data.user?.email} joined room ${roomId}`);
      });

      socket.on('send_message', async (data: { roomId: string, message: any }) => {
        // Enforce sender identity from token to prevent spoofing
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
            // Attach authoritative db id and timestamp
            data.message.id = savedMsg.id;
            data.message.timestamp = savedMsg.createdAt;
          } catch (e) {
            console.error('Failed to save message to db:', e);
          }
        }
        // Broadcast to everyone in the room except the sender
        socket.to(data.roomId).emit('receive_message', data.message);
      });

      // Channel messaging
      socket.on('join_channel_room', (channelId: string) => {
        socket.join(`channel_${channelId}`);
        console.log(`User ${socket.data.user?.email} joined channel room ${channelId}`);
      });

      socket.on('send_channel_message', async (data: { channelId: string, message: any }) => {
        if (!data.message || !socket.data.user?.sub) return;

        const userId = socket.data.user.sub;

        try {
          // Verify membership
          const membership = await prisma.channelMember.findUnique({
            where: {
              channelId_userId: { channelId: data.channelId, userId },
            },
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
        } catch (e) {
          console.error('Failed to save channel message:', e);
          return;
        }

        socket.to(`channel_${data.channelId}`).emit('receive_channel_message', data.message);
      });

      // WebRTC Signaling
      socket.on('call_user', (data: { roomId: string, signalData: any, callerName: string, callerAvatar: string, isVideo: boolean }) => {
        socket.to(data.roomId).emit('incoming_call', data);
      });

      socket.on('answer_call', (data: { roomId: string, signalData: any }) => {
        socket.to(data.roomId).emit('call_answered', data.signalData);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    res.socket.server.io = io;
  } else {
    // console.log('Socket.io server already running.');
  }
  res.end();
}
