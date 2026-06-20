"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

type CallToolsMenuProps = {
  compact?: boolean;
  onOpenPomodoro: () => void;
  onOpenNote: () => void;
};

export default function CallToolsMenu({ compact = false, onOpenPomodoro, onOpenNote }: CallToolsMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [close, open]);

  const sizeClass = compact ? "h-10 w-10" : "h-14 w-14";
  const controlClass = `flex ${sizeClass} items-center justify-center rounded-full bg-surface-container text-on-surface transition-colors hover:bg-surface-container-high`;

  const handlePomodoro = () => {
    close();
    onOpenPomodoro();
  };

  const handleNote = () => {
    close();
    onOpenNote();
  };

  return (
    <div ref={rootRef} className="relative">
      {open && (
        <div
          className={`absolute bottom-full z-50 mb-3 overflow-hidden rounded-2xl border border-white/10 bg-surface-container-low/95 shadow-2xl backdrop-blur-xl ${
            compact ? "right-0 w-44" : "left-1/2 w-52 -translate-x-1/2"
          }`}
        >
          <div className="border-b border-white/5 px-3 py-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Call tools</p>
          </div>
          <button
            type="button"
            onClick={handlePomodoro}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold text-on-surface transition-colors hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-xl text-tertiary">timer</span>
            Pomodoro
          </button>
          <button
            type="button"
            onClick={handleNote}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold text-on-surface transition-colors hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-xl text-tertiary">sticky_note_2</span>
            Make note
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={controlClass}
        title="Call tools"
        aria-label="Call tools"
        aria-expanded={open}
      >
        <span className="material-symbols-outlined">more_horiz</span>
      </button>
    </div>
  );
}
