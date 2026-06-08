"use client";

import React, { useEffect, useState } from "react";

type PomodoroLauncherProps = {
  variant?: "sidebar" | "bottom";
  onOpen: () => void;
};

type SavedTimerState = {
  status?: "IDLE" | "RUNNING" | "PAUSED";
  remainingSeconds?: number;
  durationSeconds?: number;
  startedAt?: number | null;
};

const STORAGE_KEY = "zenvy:pomodoro-state:v2";

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function readTimerState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") as SavedTimerState | null;
    if (!saved) return { status: "IDLE" as const, remainingSeconds: 25 * 60 };

    const durationSeconds = saved.durationSeconds || 25 * 60;
    const elapsed = saved.status === "RUNNING" && saved.startedAt ? Math.floor((Date.now() - saved.startedAt) / 1000) : 0;
    return {
      status: saved.status || "IDLE",
      remainingSeconds: Math.max(0, (saved.remainingSeconds || durationSeconds) - elapsed),
    };
  } catch {
    return { status: "IDLE" as const, remainingSeconds: 25 * 60 };
  }
}

export default function PomodoroLauncher({ variant = "sidebar", onOpen }: PomodoroLauncherProps) {
  const [timerState, setTimerState] = useState(readTimerState);
  const isBottom = variant === "bottom";
  const isRunning = timerState.status === "RUNNING";

  useEffect(() => {
    const refresh = () => setTimerState(readTimerState());

    refresh();
    const interval = window.setInterval(refresh, 1000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={onOpen}
        className={
          isBottom
            ? "relative flex min-w-[4.5rem] flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
            : "mx-3 mb-3 flex items-center gap-4 rounded-2xl px-3 py-3 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
        }
        aria-label="Open Pomodoro timer"
      >
        <span className={`material-symbols-outlined flex-shrink-0 text-[22px] ${isRunning ? "text-tertiary" : ""}`} style={{ fontVariationSettings: isRunning ? "'FILL' 1" : "'FILL' 0" }}>
          timer
        </span>
        <span className={isBottom ? "max-w-full truncate text-[10px]" : "text-sm font-medium"}>{isBottom ? "Focus" : "Focus Timer"}</span>
        {!isBottom && <span className="ml-auto font-mono text-[11px] font-bold text-on-surface-variant">{formatTime(timerState.remainingSeconds)}</span>}
        {isRunning && (
          <span className={`absolute rounded-full bg-tertiary shadow-[0_0_10px_rgba(34,211,238,0.8)] ${isBottom ? "right-4 top-2 h-2 w-2" : "right-3 top-1/2 h-2 w-2 -translate-y-1/2"}`} />
        )}
      </button>
    </>
  );
}
