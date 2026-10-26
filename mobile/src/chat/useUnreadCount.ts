import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthProvider";
import { useSocket } from "../realtime/SocketProvider";

/** Unread direct messages for the tab badge (/api/conversations/unread), refreshed on socket updates. */
export function useUnreadCount() {
  const { status } = useAuth();
  const { socket } = useSocket();
  const [count, setCount] = useState(0);
  const live = status === "signedIn";

  const load = useCallback(() => {
    if (!live) return;
    api<{ unreadCount: number }>("/api/conversations/unread")
      .then((d) => setCount(Number(d.unreadCount) || 0))
      .catch(() => {});
  }, [live]);

  useEffect(load, [load]);

  useEffect(() => {
    if (!socket) return;
    socket.on("conversation:updated", load);
    return () => {
      socket.off("conversation:updated", load);
    };
  }, [socket, load]);

  return live ? count : null;
}
