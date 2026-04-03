import { io } from 'socket.io-client';

// If deployed as a split architecture (Vercel + Railway), NEXT_PUBLIC_SOCKET_URL points to Railway
// Otherwise, it falls back to the current domain.
export const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_SITE_URL || '', {
  path: '/api/socket',
  autoConnect: false,
});
