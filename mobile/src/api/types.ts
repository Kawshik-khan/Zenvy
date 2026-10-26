// Response shapes of the web app's API routes the app uses.

export type MobileUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  uniqueId: string | null;
  profile: {
    major: string | null;
    college: string | null;
    semester: number | null;
    bio: string | null;
    interests: string | null;
    studyStyle: string | null;
    availability: string | null;
    matchingAvailable: boolean;
    profileImage: string | null;
  } | null;
};

export type AuthResponse = { token: string; expiresAt: string; user: MobileUser };

/** GET /api/conversations → conversations[] (lib/conversations.ts serializeConversation). */
export type ConversationSummary = {
  id: string;
  type: string;
  title: string;
  avatar: string | null;
  dmPeerId: string | null;
  lastMessageAt: string | null;
  lastMessage: { id: string; content: string; senderName: string; timestamp: string; status: string } | null;
  unreadCount: number;
  muted: boolean;
  archived: boolean;
  participants: { id: string; name: string; image: string | null }[];
};

/** lib/conversations.ts formatConversationMessage, over REST and the socket. */
export type ServerMessage = {
  id: string;
  tempId?: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderImage: string | null;
  content: string;
  fileUrl: string | null;
  fileType: string | null;
  fileName: string | null;
  status: string;
  timestamp: string;
  isSelf?: boolean;
};

export type CallParticipant = {
  id: string;
  userId: string;
  role: string;
  status: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
  user: { id: string; name: string; image: string | null } | null;
};

/** lib/calls.ts serializeCall. */
export type ServerCall = {
  id: string;
  roomId: string;
  type: "DM" | "GROUP" | "CHANNEL" | "LOBBY";
  mediaType: "AUDIO" | "VIDEO";
  status: string;
  conversationId: string | null;
  groupId: string | null;
  channelId: string | null;
  startedById: string;
  participants: CallParticipant[];
};

export type LiveKitCredentials = { token: string; serverUrl: string; roomName: string };
