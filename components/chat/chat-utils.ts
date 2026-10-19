export type AttachmentKind = "image" | "video" | "note" | "file";

/** Clock time for a message, e.g. "09:41". */
export function formatClock(value: string | Date) {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** Inbox timestamp: the time for today, otherwise a short date. */
export function formatListTime(value: string | Date | null | undefined, now: Date = new Date()) {
  if (!value) return "";
  const date = new Date(value);
  if (date.toDateString() === now.toDateString()) return formatClock(date);
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

/** The server stores "Attached: file.pdf" when a file is sent without text; the file card already says that. */
export function isAttachmentPlaceholder(content: string, fileName?: string | null) {
  return Boolean(fileName) && content === `Attached: ${fileName}`;
}

export function typingLabel(names: string[]) {
  if (names.length === 0) return "";
  return `${names.join(", ")} ${names.length === 1 ? "is" : "are"} typing`;
}

export function attachmentKind(fileType: string | null | undefined, noteType: string): AttachmentKind {
  if (fileType === noteType) return "note";
  if (fileType === "image") return "image";
  if (fileType === "video") return "video";
  return "file";
}

/** Copy of a typing set without one name (React state must not be mutated). */
export function stopTypingNames(current: Set<string>, name: string) {
  const next = new Set(current);
  next.delete(name);
  return next;
}

export function conversationTypeLabel(type: string) {
  if (type === "DM") return "Direct message";
  if (type === "GROUP") return "Study group";
  if (type === "CHANNEL") return "Channel";
  return type.charAt(0) + type.slice(1).toLowerCase();
}
