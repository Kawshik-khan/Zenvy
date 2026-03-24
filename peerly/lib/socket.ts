import { io } from 'socket.io-client';

export const socket = io(process.env.NEXT_PUBLIC_SITE_URL || '', {
  path: '/api/socket',
  autoConnect: false,
});
