import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import type { ServerMessage } from "../api/types";
import { useSocket } from "../realtime/SocketProvider";

export type ChatItem = ServerMessage & { pending?: boolean; failed?: boolean };

/**
 * One conversation: history over REST, live updates over the socket.
 * Sends go through the socket (`message:send` → `message:ack`) so the other side gets `message:new`;
 * when the socket is down they fall back to POST /api/conversations/:id/messages.
 */
export function useConversation(conversationId: string, me: { id: string; name: string | null } | null) {
  const { socket, state } = useSocket();
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typing, setTyping] = useState<string | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSent = useRef(0);

  const markRead = useCallback(() => {
    if (socket?.connected) socket.emit("conversation:read", { conversationId });
    else void api(`/api/conversations/${conversationId}/read`, { method: "PATCH" }).catch(() => {});
  }, [socket, conversationId]);

  const load = useCallback(async () => {
    try {
      const data = await api<{ messages: ServerMessage[] }>(`/api/conversations/${conversationId}/messages?limit=50`);
      setMessages((current) => [...data.messages, ...current.filter((m) => m.pending || m.failed)]);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load this conversation.");
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!socket || state !== "live") return;
    socket.emit("conversation:join", { conversationId });
    markRead();
    // Catch up on anything sent while we were reconnecting.
    void load();

    const onNew = (message: ServerMessage) => {
      if (message.conversationId !== conversationId) return;
      setMessages((current) => (current.some((m) => m.id === message.id) ? current : [...current, message]));
      setTyping(null);
      markRead();
    };
    const onAck = (message: ServerMessage) => {
      if (message.conversationId !== conversationId) return;
      setMessages((current) => current.map((m) => (m.id === message.tempId ? { ...message, pending: false } : m)));
    };
    const onError = (payload: { message?: string }) => {
      setMessages((current) => current.map((m) => (m.pending ? { ...m, pending: false, failed: true } : m)));
      setError(payload?.message ?? "Message not sent.");
    };
    const onDeleted = ({ messageId }: { messageId: string }) => setMessages((current) => current.map((m) => (m.id === messageId ? { ...m, status: "DELETED", content: "" } : m)));
    const onTyping = (payload: { conversationId: string; senderName?: string }) => {
      if (payload.conversationId !== conversationId) return;
      setTyping(payload.senderName || "Someone");
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTyping(null), 4000);
    };
    const onTypingStop = (payload: { conversationId: string }) => payload.conversationId === conversationId && setTyping(null);

    socket.on("message:new", onNew);
    socket.on("message:ack", onAck);
    socket.on("conversation:error", onError);
    socket.on("message:deleted", onDeleted);
    socket.on("typing:start", onTyping);
    socket.on("typing:stop", onTypingStop);
    return () => {
      socket.emit("conversation:leave", { conversationId });
      socket.off("message:new", onNew);
      socket.off("message:ack", onAck);
      socket.off("conversation:error", onError);
      socket.off("message:deleted", onDeleted);
      socket.off("typing:start", onTyping);
      socket.off("typing:stop", onTypingStop);
      if (typingTimer.current) clearTimeout(typingTimer.current);
    };
  }, [socket, state, conversationId, load, markRead]);

  const send = useCallback(
    async (content: string) => {
      if (!me) return;
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const optimistic: ChatItem = {
        id: tempId,
        conversationId,
        senderId: me.id,
        senderName: me.name ?? "You",
        senderImage: null,
        content,
        fileUrl: null,
        fileType: null,
        fileName: null,
        status: "SENT",
        timestamp: new Date().toISOString(),
        isSelf: true,
        pending: true,
      };
      setMessages((current) => [...current, optimistic]);
      socket?.emit("typing:stop", { conversationId, senderName: me.name });

      if (socket?.connected) {
        socket.emit("message:send", { conversationId, tempId, message: { content } });
        // No ack (connection dropped mid-send): let the person retry instead of waiting forever.
        setTimeout(() => {
          setMessages((current) => current.map((m) => (m.id === tempId && m.pending ? { ...m, pending: false, failed: true } : m)));
        }, 10_000);
        return;
      }
      try {
        const { message } = await api<{ message: ServerMessage }>(`/api/conversations/${conversationId}/messages`, { method: "POST", body: { content } });
        setMessages((current) => current.map((m) => (m.id === tempId ? message : m)));
      } catch (e) {
        setMessages((current) => current.map((m) => (m.id === tempId ? { ...m, pending: false, failed: true } : m)));
        setError(e instanceof Error ? e.message : "Message not sent.");
      }
    },
    [socket, conversationId, me],
  );

  /** Call on each keystroke; sends at most one typing:start every 2 seconds. */
  const notifyTyping = useCallback(() => {
    if (!socket?.connected || !me) return;
    const now = Date.now();
    if (now - lastTypingSent.current < 2000) return;
    lastTypingSent.current = now;
    socket.emit("typing:start", { conversationId, senderName: me.name });
  }, [socket, conversationId, me]);

  const retry = useCallback(
    (tempId: string) => {
      const failed = messages.find((m) => m.id === tempId);
      if (!failed) return;
      setMessages((current) => current.filter((m) => m.id !== tempId));
      void send(failed.content);
    },
    [messages, send],
  );

  return { messages, loading, error, typing, send, notifyTyping, retry, connection: state };
}
