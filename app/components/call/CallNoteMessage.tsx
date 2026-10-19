"use client";

import { StickyNote } from "lucide-react";

type CallNoteMessageProps = {
  content: string;
};

/** A note someone saved during a call, shown inside a chat bubble. */
export default function CallNoteMessage({ content }: CallNoteMessageProps) {
  return (
    <div className="rounded-nb border-2 border-line bg-card px-3 py-2.5 text-fg">
      <p className="m-0 mb-1.5 flex items-center gap-1.5 font-grotesk text-xs font-bold tracking-wide uppercase">
        <StickyNote aria-hidden="true" size={14} />
        Call note
      </p>
      <p className="m-0 text-[15px] leading-relaxed break-words whitespace-pre-wrap">{content}</p>
    </div>
  );
}
