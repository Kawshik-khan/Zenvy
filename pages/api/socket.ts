import { Server as NetServer } from 'http';
import { NextApiRequest } from 'next';
import { Server as ServerIO } from 'socket.io';

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
    });
    
    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
      
      socket.on('join_room', (roomId: string) => {
        socket.join(roomId);
        console.log(`User joined room ${roomId}`);
      });

      socket.on('send_message', (data: { roomId: string, message: any }) => {
        // Broadcast to everyone in the room except the sender
        socket.to(data.roomId).emit('receive_message', data.message);
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
