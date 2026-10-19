"use client";

import { FileText, Trash2 } from "lucide-react";
import CallNoteMessage from "@/app/components/call/CallNoteMessage";
import { Avatar, cx, IconButton } from "@/components/ui";
import { CALL_NOTE_FILE_TYPE } from "@/lib/call-notes";
import { attachmentKind, formatClock, isAttachmentPlaceholder } from "./chat-utils";

export type BubbleMessage = {
  id: string;
  senderName: string;
  senderImage?: string | null;
  content: string;
  timestamp: string | Date;
  fileUrl?: string | null;
  fileType?: string | null;
  fileName?: string | null;
};

type MessageBubbleProps = {
  message: BubbleMessage;
  isSelf: boolean;
  /** Group and channel rooms show who wrote each message; a DM does not need to. */
  showSender?: boolean;
  deleted?: boolean;
  pending?: boolean;
  onDelete?: (messageId: string) => void;
};

function Attachment({ message }: { message: BubbleMessage }) {
  if (!message.fileUrl) return null;
  const kind = attachmentKind(message.fileType, CALL_NOTE_FILE_TYPE);
  if (kind === "image") {
    return <img src={message.fileUrl} alt={message.fileName || "Image attachment"} className="max-h-64 max-w-full rounded-nb border-2 border-line object-contain" />;
  }
  if (kind === "video") {
    return <video src={message.fileUrl} controls className="max-h-64 max-w-full rounded-nb border-2 border-line" />;
  }
  return (
    <a
      href={message.fileUrl}
      target="_blank"
      rel="noreferrer"
      className="nb-focus flex min-h-11 w-fit max-w-full items-center gap-2 rounded-nb border-2 border-line bg-card px-3 py-2 font-grotesk text-sm font-bold text-fg no-underline"
    >
      <FileText aria-hidden="true" size={18} className="shrink-0" />
      <span className="truncate">{message.fileName || "Download file"}</span>
    </a>
  );
}

/** One chat message. Mine sit on the right in blue, everyone else's on the left on white. */
export function MessageBubble({ message, isSelf, showSender = true, deleted = false, pending = false, onDelete }: MessageBubbleProps) {
  const isNote = message.fileType === CALL_NOTE_FILE_TYPE;
  const showText = !isAttachmentPlaceholder(message.content, message.fileName) && message.content !== "";
  const canDelete = isSelf && !pending && !deleted && onDelete;

  return (
    <li className={cx("flex items-end gap-2", isSelf && "flex-row-reverse")}>
      {!isSelf && <Avatar name={message.senderName} src={message.senderImage} size="sm" className="mb-1" />}
      <div className={cx("flex min-w-0 max-w-[calc(100%-3rem)] flex-col gap-1 sm:max-w-[76%] xl:max-w-[62%]", isSelf && "items-end")}>
        <p className={cx("m-0 flex items-baseline gap-2 px-1 text-xs text-fg-muted", isSelf && "flex-row-reverse")}>
          {!isSelf && showSender && <span className="font-bold text-fg">{message.senderName}</span>}
          <time dateTime={new Date(message.timestamp).toISOString()}>{formatClock(message.timestamp)}</time>
          {pending && <span>Sending</span>}
        </p>
        <div className={cx("flex items-center gap-1", isSelf && "flex-row-reverse")}>
          <div
            className={cx(
              "flex min-w-0 flex-col gap-2 rounded-nb-lg border-2 border-line px-3.5 py-2.5 text-[15px] leading-relaxed",
              deleted ? "border-dashed bg-canvas text-fg-muted italic" : isSelf ? "bg-chat text-ink" : "bg-card text-fg",
            )}
          >
            {deleted ? (
              <p className="m-0">This message was deleted.</p>
            ) : (
              <>
                {isNote ? <CallNoteMessage content={message.content} /> : <Attachment message={message} />}
                {!isNote && showText && <p className="m-0 break-words whitespace-pre-wrap">{message.content}</p>}
              </>
            )}
          </div>
          {canDelete && (
            <IconButton variant="ghost" size="sm" label="Delete message" icon={<Trash2 size={16} />} onClick={() => onDelete(message.id)} />
          )}
        </div>
      </div>
    </li>
  );
}
