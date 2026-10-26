// Where the Zenvy web app (Next.js API) and the Socket.io server live.
// Set in mobile/.env (see .env.example) or as EAS environment variables:
//   EXPO_PUBLIC_API_URL=https://zenvy.example.com
//   EXPO_PUBLIC_SOCKET_URL=https://zenvy-socket.onrender.com   (optional, defaults to the API URL)
// With no API URL the app runs in demo mode on sample data.

function clean(url: string | undefined) {
  const value = url?.trim();
  return value ? value.replace(/\/+$/, "") : null;
}

export const API_URL = clean(process.env.EXPO_PUBLIC_API_URL);
export const SOCKET_URL = clean(process.env.EXPO_PUBLIC_SOCKET_URL) ?? API_URL;

/** True when the app talks to a real backend. */
export const isLive = API_URL !== null;
