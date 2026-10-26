import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";
import { api } from "../api/client";
import type { ConversationSummary } from "../api/types";
import { useSocket } from "../realtime/SocketProvider";

/** The signed-in user's conversations (/api/conversations), refreshed on focus and on socket updates. */
export function useConversations(enabled: boolean) {
  const { socket } = useSocket();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) return;
    try {
      const data = await api<{ conversations: ConversationSummary[] }>("/api/conversations");
      setConversations(data.conversations);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load messages.");
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useEffect(() => {
    if (!socket || !enabled) return;
    // Sent to `user_<id>` whenever one of this person's conversations changes.
    const refresh = () => void load();
    socket.on("conversation:updated", refresh);
    socket.on("message:new", refresh);
    return () => {
      socket.off("conversation:updated", refresh);
      socket.off("message:new", refresh);
    };
  }, [socket, enabled, load]);

  return { conversations, loading, error, reload: load };
}
