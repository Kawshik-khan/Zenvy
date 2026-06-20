import { socket } from "@/lib/socket";

export const CALL_NOTE_MAX_LENGTH = 1000;
export const CALL_NOTE_FILE_TYPE = "call_note";

export type CallNoteTarget =
  | { type: "dm"; conversationId: string }
  | { type: "group"; groupId: string }
  | { type: "channel"; channelId: string }
  | { type: "legacy_room"; roomId: string };

type CallNoteSender = {
  id: string;
  name: string;
  image?: string | null;
};

function ensureSocketConnected(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (socket.connected) {
      resolve();
      return;
    }

    socket.connect();

    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("Chat connection timed out"));
    }, 10000);

    const onConnect = () => {
      cleanup();
      resolve();
    };

    const onError = () => {
      cleanup();
      reject(new Error("Unable to connect to chat"));
    };

    const cleanup = () => {
      window.clearTimeout(timeout);
      socket.off("connect", onConnect);
      socket.off("connect_error", onError);
    };

    socket.on("connect", onConnect);
    socket.on("connect_error", onError);
  });
}

export function resolveCallNoteTarget(params: {
  conversationId?: string | null;
  groupId?: string | null;
  channelId?: string | null;
  scope?: { type: "dm" | "group" | "channel"; id: string };
  legacyRoomId?: string;
}): CallNoteTarget | null {
  if (params.conversationId) return { type: "dm", conversationId: params.conversationId };
  if (params.groupId) return { type: "group", groupId: params.groupId };
  if (params.channelId) return { type: "channel", channelId: params.channelId };
  if (params.scope?.type === "dm") return { type: "dm", conversationId: params.scope.id };
  if (params.scope?.type === "group") return { type: "group", groupId: params.scope.id };
  if (params.scope?.type === "channel") return { type: "channel", channelId: params.scope.id };
  if (params.legacyRoomId) return { type: "legacy_room", roomId: params.legacyRoomId };
  return null;
}

export async function resolveLegacyDmNoteTarget(targetUserId: string): Promise<CallNoteTarget | null> {
  const res = await fetch("/api/conversations/dm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetUserId }),
  });
  const data = await res.json();
  if (!res.ok || !data.conversation?.id) return null;
  return { type: "dm", conversationId: data.conversation.id };
}

export async function postCallNote(params: {
  target: CallNoteTarget;
  sender: CallNoteSender;
  content: string;
}): Promise<void> {
  const trimmed = params.content.trim();
  if (!trimmed) throw new Error("Note cannot be empty");
  if (trimmed.length > CALL_NOTE_MAX_LENGTH) {
    throw new Error(`Note must be ${CALL_NOTE_MAX_LENGTH} characters or fewer`);
  }

  await ensureSocketConnected();

  const tempId = `call_note_${Date.now()}`;
  const message = {
    id: tempId,
    senderId: params.sender.id,
    senderName: params.sender.name || "Scholar",
    senderImage: params.sender.image || null,
    content: trimmed,
    fileUrl: null,
    fileType: CALL_NOTE_FILE_TYPE,
    fileName: null,
    timestamp: new Date(),
    isSelf: true,
    status: "SENT",
  };

  if (params.target.type === "dm") {
    const { conversationId } = params.target;
    await new Promise<void>((resolve, reject) => {
      const onAck = (payload: { tempId?: string }) => {
        if (payload.tempId !== tempId) return;
        cleanup();
        resolve();
      };
      const onError = (payload: { message?: string }) => {
        cleanup();
        reject(new Error(payload.message || "Unable to send note"));
      };
      const cleanup = () => {
        socket.off("message:ack", onAck);
        socket.off("conversation:error", onError);
      };

      socket.on("message:ack", onAck);
      socket.on("conversation:error", onError);
      socket.emit("message:send", {
        conversationId,
        tempId,
        message,
      });

      window.setTimeout(() => {
        cleanup();
        reject(new Error("Sending note timed out"));
      }, 10000);
    });
    return;
  }

  if (params.target.type === "group") {
    const { groupId } = params.target;
    await new Promise<void>((resolve, reject) => {
      const onSuccess = (payload: { tempId: string }) => {
        if (payload.tempId !== tempId) return;
        cleanup();
        resolve();
      };
      const onError = (payload: { message?: string }) => {
        cleanup();
        reject(new Error(payload.message || "Unable to send note"));
      };
      const cleanup = () => {
        socket.off("group_message_sent_success", onSuccess);
        socket.off("group_error", onError);
      };

      socket.on("group_message_sent_success", onSuccess);
      socket.on("group_error", onError);
      socket.emit("send_group_message", { groupId, message });

      window.setTimeout(() => {
        cleanup();
        reject(new Error("Sending note timed out"));
      }, 10000);
    });
    return;
  }

  if (params.target.type === "channel") {
    const { channelId } = params.target;
    await new Promise<void>((resolve, reject) => {
      const onSuccess = (payload: { tempId: string }) => {
        if (payload.tempId !== tempId) return;
        cleanup();
        resolve();
      };
      const onError = (payload: { message?: string }) => {
        cleanup();
        reject(new Error(payload.message || "Unable to send note"));
      };
      const cleanup = () => {
        socket.off("channel_message_sent_success", onSuccess);
        socket.off("channel_error", onError);
      };

      socket.on("channel_message_sent_success", onSuccess);
      socket.on("channel_error", onError);
      socket.emit("send_channel_message", { channelId, message });

      window.setTimeout(() => {
        cleanup();
        reject(new Error("Sending note timed out"));
      }, 10000);
    });
    return;
  }

  if (params.target.type === "legacy_room") {
    const { roomId } = params.target;
    await new Promise<void>((resolve, reject) => {
      const onSuccess = (payload: { tempId: string }) => {
        if (payload.tempId !== tempId) return;
        cleanup();
        resolve();
      };
      const onError = (payload: { message?: string }) => {
        cleanup();
        reject(new Error(payload.message || "Unable to send note"));
      };
      const cleanup = () => {
        socket.off("message_sent_success", onSuccess);
        socket.off("room_error", onError);
      };

      socket.on("message_sent_success", onSuccess);
      socket.on("room_error", onError);
      socket.emit("send_message", { roomId, message });

      window.setTimeout(() => {
        cleanup();
        reject(new Error("Sending note timed out"));
      }, 10000);
    });
  }
}
