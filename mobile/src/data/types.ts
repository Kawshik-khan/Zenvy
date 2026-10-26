// Shapes mirror the web app's Prisma models (prisma/schema.prisma) closely enough
// that the sample data can be swapped for API responses later.

export type Person = {
  id: string;
  name: string;
  initials: string;
  color: string;
  major: string;
  semester: number;
  college: string;
  bio?: string;
  interests: string[];
  availability?: string;
};

export type Partner = Person & {
  score: number;
  why: string;
  studyStyle: string;
  breakdown: { label: string; value: number; note: string }[];
  inCommon?: string;
};

export type ChatMessage = {
  id: string;
  authorId: string;
  text?: string;
  file?: { name: string; size: string; kind: "PDF" | "IMG" | "CPP" | "LINK" };
  notes?: { title: string; items: string[] };
  system?: boolean;
  time: string;
};

export type ConversationKind = "people" | "groups" | "channels";

export type Conversation = {
  id: string;
  kind: ConversationKind;
  title: string;
  initials: string;
  color: string;
  last: string;
  time: string;
  unread: number;
  /** For DMs: the other person. For groups: the group id. */
  refId: string;
};

export type Resource = { id: string; kind: "PDF" | "IMG" | "CPP" | "LINK"; title: string; meta: string; size?: string };

export type Group = {
  id: string;
  name: string;
  initials: string;
  color: string;
  course: string;
  description: string;
  memberIds: string[];
  roles: Record<string, "Owner" | "Admin">;
  resources: Resource[];
  joined: boolean;
  status?: string;
  liveCall?: { participants: string[]; startedMinutesAgo: number };
};

export type StudyEvent = {
  id: string;
  title: string;
  groupId: string;
  day: number;
  start: string;
  end: string;
  where: string;
  goingIds: string[];
};

export type Job = {
  id: string;
  title: string;
  company: string;
  initials: string;
  color: string;
  place: string;
  tags: string[];
  pay: string;
  deadline: string;
  closesSoon: boolean;
  posted: string;
  duration: string;
  about: string;
  needs: string[];
  skills: string[];
};

export type NotificationKind = "match" | "message" | "event" | "job" | "resource" | "call";

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  actor?: string;
  body: string;
  time: string;
  unread: boolean;
  /** Partner id for match requests. */
  refId?: string;
};
