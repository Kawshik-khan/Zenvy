"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { usePomodoro } from "./PomodoroProvider";
import {
  FOCUS_STATE_EVENT,
  FocusTimerState,
  emptyFocusState,
  formatFocusTime,
  isFocusActive,
  readFocusState,
} from "./focus-session-state";

export default function FocusFloatingIndicator() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { openPomodoro } = usePomodoro();
  const [mounted, setMounted] = useState(false);
  const [focusState, setFocusState] = useState<FocusTimerState>(emptyFocusState);
  const [showTime, setShowTime] = useState(false);
  const previousActiveRef = useRef(false);
  const collapseTimerRef = useRef<number | null>(null);

  const isChatConversation = pathname === "/chat" && Boolean(searchParams?.get("conversation"));
  const isImmersive =
    isChatConversation ||
    pathname === "/chat/personal" ||
    pathname === "/call/active" ||
    Boolean(pathname?.startsWith("/groups/")) ||
    Boolean(pathname?.startsWith("/channels/"));
  const active = isFocusActive(focusState);

  useEffect(() => {
    const refresh = () => {
      setMounted(true);
      setFocusState(readFocusState());
    };

    refresh();
    const interval = window.setInterval(refresh, 1000);
    window.addEventListener("focus", refresh);
    window.addEventListener(FOCUS_STATE_EVENT, refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      window.removeEventListener(FOCUS_STATE_EVENT, refresh);
    };
  }, []);

  useEffect(() => {
    if (!active) {
      previousActiveRef.current = false;
      setShowTime(false);
      return;
    }

    if (!previousActiveRef.current) {
      setShowTime(true);
    }
    previousActiveRef.current = true;
  }, [active, focusState.status]);

  useEffect(() => {
    if (!showTime) return undefined;
    if (collapseTimerRef.current) window.clearTimeout(collapseTimerRef.current);
    collapseTimerRef.current = window.setTimeout(() => setShowTime(false), 4000);

    return () => {
      if (collapseTimerRef.current) window.clearTimeout(collapseTimerRef.current);
    };
  }, [showTime]);

  if (!mounted || !active || isImmersive) return null;

  return (
    <button
      type="button"
      onClick={openPomodoro}
      className={`fixed bottom-[calc(9.75rem+env(safe-area-inset-bottom))] right-4 z-[120] inline-flex h-14 items-center justify-center rounded-full border border-tertiary/30 bg-surface-container-low/95 text-tertiary shadow-2xl shadow-black/30 backdrop-blur-2xl transition-all hover:bg-surface-container md:hidden ${
        showTime ? "w-[7.25rem] gap-2 px-4" : "w-14"
      }`}
      title="Focus session"
      aria-label="Open focus session"
    >
      <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
        timer
      </span>
      {showTime && <span className="font-mono text-sm font-black text-on-surface">{formatFocusTime(focusState.remainingSeconds)}</span>}
    </button>
  );
}
