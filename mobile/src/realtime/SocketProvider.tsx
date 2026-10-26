import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { io, type Socket } from "socket.io-client";
import { api } from "../api/client";
import { SOCKET_URL } from "../api/config";
import { useAuth } from "../auth/AuthProvider";

export type ConnectionState = "offline" | "connecting" | "live";

type SocketValue = { socket: Socket | null; state: ConnectionState };

const SocketContext = createContext<SocketValue>({ socket: null, state: "offline" });

/**
 * One Socket.io connection per signed-in session, to the same server the web app uses
 * (standalone-socket.js on Render). Each (re)connect fetches a fresh 5-minute socket token
 * from /api/socket-token with the app's bearer token, so the server's existing auth applies.
 */
export function SocketProvider({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();
  const [value, setValue] = useState<SocketValue>({ socket: null, state: "offline" });

  useEffect(() => {
    if (status !== "signedIn" || !SOCKET_URL) return;

    const socket = io(SOCKET_URL, {
      path: "/api/socket",
      transports: ["websocket"],
      reconnectionDelayMax: 10_000,
      auth: (cb) => {
        api<{ token: string }>("/api/socket-token")
          .then(({ token }) => cb({ token }))
          .catch(() => cb({}));
      },
    });

    const update = (state: ConnectionState) => setValue({ socket, state });
    socket.on("connect", () => update("live"));
    socket.on("disconnect", () => update("connecting"));
    socket.io.on("reconnect_attempt", () => update("connecting"));
    update("connecting");

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      setValue({ socket: null, state: "offline" });
    };
  }, [status, user?.id]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}
