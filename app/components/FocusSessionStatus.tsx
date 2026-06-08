"use client";

import React, { useEffect, useState } from "react";
import { usePomodoro } from "./PomodoroProvider";

type FocusSessionStatusProps = {
  compact?: boolean;
};

type SavedTimerState = {
  status?: "IDLE" | "RUNNING" | "PAUSED";
  remainingSeconds?: number;
  durationSeconds?: number;
  startedAt?: number | null;
};

type FocusState = {
  status: "IDLE" | "RUNNING" | "PAUSED";
  remainingSeconds: number;
  durationSeconds: number;
};

const STORAGE_KEY = "zenvy:pomodoro-state:v2";

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function readFocusState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") as SavedTimerState | null;
    if (!saved) return { status: "IDLE" as const, remainingSeconds: 0, durationSeconds: 1 };

    const durationSeconds = saved.durationSeconds || 1;
    const elapsed = saved.status === "RUNNING" && saved.startedAt ? Math.floor((Date.now() - saved.startedAt) / 1000) : 0;
    const remainingSeconds = Math.max(0, (saved.remainingSeconds || durationSeconds) - elapsed);
    return {
      status: saved.status || "IDLE",
      remainingSeconds,
      durationSeconds,
    };
  } catch {
    return { status: "IDLE" as const, remainingSeconds: 0, durationSeconds: 1 };
  }
}

export default function FocusSessionStatus({ compact = false }: FocusSessionStatusProps) {
  const { openPomodoro } = usePomodoro();
  const [mounted, setMounted] = useState(false);
  const [focusState, setFocusState] = useState<FocusState>(() => ({ status: "IDLE", remainingSeconds: 0, durationSeconds: 1 }));
  const active = focusState.status === "RUNNING" || focusState.status === "PAUSED";
  const progress = active ? Math.max(0, Math.min(100, Math.round(((focusState.durationSeconds - focusState.remainingSeconds) / focusState.durationSeconds) * 100))) : 0;

  useEffect(() => {
    const refresh = () => {
      setMounted(true);
      setFocusState(readFocusState());
    };

    refresh();
    const interval = window.setInterval(refresh, 1000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
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
            <p className="mt-0.5 font-mono text-[11px] font-bold text-on-surface-variant">{formatTime(focusState.remainingSeconds)} remaining</p>
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
