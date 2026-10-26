// Group and channel messages: request parsing for POST /api/groups/messages and
// /api/channels/messages, and the browser helper that sends through them. No server-only imports.

export const MAX_MESSAGE_LENGTH = 4000;

/** fileType of a note posted from a call; it has no file. */
export const CALL_NOTE_FILE_TYPE = 'call_note';

export type RoomKind = 'group' | 'channel';

export type RoomMessageFile = { fileUrl: string | null; fileType: string | null; fileName: string | null };

export type RoomMessageInput =
  | { ok: true; roomId: string; content: string; file: RoomMessageFile | null }
  | { ok: false; error: string };

const idKeys = { group: 'groupId', channel: 'channelId' } as const;

function shortString(value: unknown, max: number): string | null {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null;
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Validates `{ groupId | channelId, content, fileUrl?, fileType?, fileName? }`. An attachment needs
 * an http(s) fileUrl; a call note is `fileType: 'call_note'` with no fileUrl.
 */
export function parseRoomMessageInput(kind: RoomKind, body: unknown): RoomMessageInput {
  const data = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const roomId = data[idKeys[kind]];
  if (typeof roomId !== 'string' || !roomId || roomId.length > 64) {
    return { ok: false, error: `Missing ${idKeys[kind]}` };
  }

  let file: RoomMessageFile | null = null;
  if (data.fileUrl != null) {
    if (typeof data.fileUrl !== 'string' || data.fileUrl.length > 2048 || !isHttpUrl(data.fileUrl)) {
      return { ok: false, error: 'Invalid attachment' };
    }
    file = { fileUrl: data.fileUrl, fileType: shortString(data.fileType, 255), fileName: shortString(data.fileName, 255) };
  } else if (data.fileType === CALL_NOTE_FILE_TYPE) {
    file = { fileUrl: null, fileType: CALL_NOTE_FILE_TYPE, fileName: null };
  }

  const content = typeof data.content === 'string' ? data.content.trim() : '';
  if (!content && !file?.fileUrl) return { ok: false, error: 'Message content is required' };
  if (content.length > MAX_MESSAGE_LENGTH) {
    return { ok: false, error: `Messages can be up to ${MAX_MESSAGE_LENGTH} characters` };
  }

  return { ok: true, roomId, content, file };
}

export type RoomMessage = {
  id: string;
  senderId: string;
  senderName: string;
  senderImage?: string | null;
  content: string;
  timestamp: Date | string;
  isSelf: boolean;
  fileUrl?: string | null;
  fileType?: string | null;
  fileName?: string | null;
};

type StoredRoomMessage = {
  id: string;
  senderId: string;
  content: string;
  fileUrl: string | null;
  fileType: string | null;
  fileName: string | null;
  createdAt: Date;
  sender: { name: string | null; image: string | null };
};

export function roomMessageJson(message: StoredRoomMessage, viewerId: string): RoomMessage {
  return {
    id: message.id,
    senderId: message.senderId,
    senderName: message.sender.name || 'Anonymous',
    senderImage: message.sender.image,
    content: message.content,
    fileUrl: message.fileUrl || null,
    fileType: message.fileType || null,
    fileName: message.fileName || null,
    timestamp: message.createdAt,
    isSelf: message.senderId === viewerId,
  };
}

/**
 * Saves a message over HTTP so it persists even when the socket server is down or asleep.
 * Throws with the server's error message on failure.
 */
export async function postRoomMessage(
  kind: RoomKind,
  roomId: string,
  message: { content: string; file?: RoomMessageFile | null },
): Promise<RoomMessage> {
  const response = await fetch(kind === 'group' ? '/api/groups/messages' : '/api/channels/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ [idKeys[kind]]: roomId, content: message.content, ...(message.file ?? {}) }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.message) {
    throw new Error(data?.error || 'Message could not be sent');
  }
  return data.message as RoomMessage;
}
