"use client";

import React, { useEffect, useState } from "react";
import { usePomodoro } from "./PomodoroProvider";
import {
  FOCUS_STATE_EVENT,
  FocusTimerState,
  emptyFocusState,
  formatFocusMinutes,
  isFocusActive,
  readFocusState,
} from "./focus-session-state";

export default function FocusHeaderIndicator() {
  const { openPomodoro } = usePomodoro();
  const [mounted, setMounted] = useState(false);
  const [focusState, setFocusState] = useState<FocusTimerState>(emptyFocusState);
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

  if (!mounted || !active) return null;

  return (
    <button
      type="button"
      onClick={openPomodoro}
      className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-tertiary/25 bg-tertiary/10 px-2.5 text-[10px] font-black uppercase tracking-widest text-tertiary transition-colors hover:bg-tertiary/15"
      title="Focus session"
      aria-label="Open focus session"
    >
      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
        timer
      </span>
      <span>{focusState.status === "PAUSED" ? "Paused" : formatFocusMinutes(focusState.remainingSeconds)}</span>
    </button>
  );
}
