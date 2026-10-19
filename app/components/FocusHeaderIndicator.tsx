"use client";

import { Timer } from "lucide-react";
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
      className="nb-focus nb-press inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border-nb bg-focus px-3 font-grotesk text-sm font-bold text-ink shadow-nb-sm"
      title="Focus session"
      aria-label="Open focus session"
    >
      <Timer aria-hidden="true" size={16} />
      <span>{focusState.status === "PAUSED" ? "Paused" : formatFocusMinutes(focusState.remainingSeconds)}</span>
    </button>
  );
}
