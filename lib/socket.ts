import { io } from 'socket.io-client';

async function getSocketAuth() {
  try {
    const response = await fetch('/api/socket-token', { cache: 'no-store' });
    if (!response.ok) return {};
    const data = await response.json();
    return data?.token ? { token: data.token } : {};
  } catch {
    return {};
  }
}

// If deployed as a split architecture (Vercel + Render), NEXT_PUBLIC_SOCKET_URL points to Render.
// Otherwise, it falls back to the current domain.
export const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_SITE_URL || '', {
  path: '/api/socket',
  autoConnect: false,
  auth: async (callback) => {
    callback(await getSocketAuth());
  },
});
