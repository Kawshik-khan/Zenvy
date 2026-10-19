"use client";

import React from "react";

type CallNoteMessageProps = {
  content: string;
  isSelf?: boolean;
};

export default function CallNoteMessage({ content, isSelf = false }: CallNoteMessageProps) {
  return (
    <div
      className={`rounded-xl border px-3 py-2.5 ${
        isSelf
          ? "border-white/20 bg-white/10"
          : "border-tertiary/20 bg-tertiary/10"
      }`}
    >
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className="material-symbols-outlined text-sm text-tertiary">sticky_note_2</span>
        <span className="text-[10px] font-black uppercase tracking-widest text-tertiary">Call note</span>
      </div>
      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{content}</p>
    </div>
  );
}
