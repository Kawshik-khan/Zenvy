"use client";

import React, { useEffect, useState } from "react";
import { usePomodoro } from "./PomodoroProvider";
import {
  FOCUS_STATE_EVENT,
  FocusTimerState,
  emptyFocusState,
  formatFocusTime,
  isFocusActive,
  readFocusState,
} from "./focus-session-state";

type FocusSessionStatusProps = {
  compact?: boolean;
};

export default function FocusSessionStatus({ compact = false }: FocusSessionStatusProps) {
  const { openPomodoro } = usePomodoro();
  const [mounted, setMounted] = useState(false);
  const [focusState, setFocusState] = useState<FocusTimerState>(emptyFocusState);
  const active = isFocusActive(focusState);
  const progress = active ? Math.max(0, Math.min(100, Math.round(((focusState.durationSeconds - focusState.remainingSeconds) / focusState.durationSeconds) * 100))) : 0;

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

  return (
    <button
      type="button"
      onClick={openPomodoro}
      className={`w-full rounded-2xl border border-outline-variant/30 bg-surface-container/70 text-left transition-colors hover:bg-surface-container-high ${
        compact ? "px-3 py-2" : "mt-3 px-3 py-2.5"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className={`material-symbols-outlined text-lg ${active ? "text-tertiary" : "text-on-surface-variant"}`} style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>
          timer
        </span>
        <div className="min-w-0 flex-1">
          <p className={`truncate font-black text-on-surface ${compact ? "text-[11px]" : "text-xs"}`}>
            {active ? "Focus Active" : "Start Focus Session"}
          </p>
          {active && mounted && (
            <p className="mt-0.5 font-mono text-[11px] font-bold text-on-surface-variant">{formatFocusTime(focusState.remainingSeconds)} remaining</p>
          )}
        </div>
      </div>
      {active && mounted && (
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-container-high">
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-tertiary" style={{ width: `${progress}%` }} />
        </div>
      )}
    </button>
  );
}
