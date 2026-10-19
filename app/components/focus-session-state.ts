"use client";

export type FocusTimerStatus = "IDLE" | "RUNNING" | "PAUSED";

export type FocusTimerState = {
  status: FocusTimerStatus;
  remainingSeconds: number;
  durationSeconds: number;
  startedAt?: number | null;
};

export const FOCUS_STORAGE_KEY = "zenvy:pomodoro-state:v2";
export const FOCUS_STATE_EVENT = "zenvy:focus-state";

export const emptyFocusState: FocusTimerState = {
  status: "IDLE",
  remainingSeconds: 0,
  durationSeconds: 1,
  startedAt: null,
};

export function formatFocusTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60).toString().padStart(2, "0");
  const seconds = Math.floor(safeSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function formatFocusMinutes(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  if (safeSeconds <= 0) return "Active";
  return `${Math.max(1, Math.ceil(safeSeconds / 60))}m`;
}

export function isFocusActive(state: FocusTimerState) {
  return state.status === "RUNNING" || state.status === "PAUSED";
}

export function readFocusState(): FocusTimerState {
  if (typeof window === "undefined") return emptyFocusState;

  try {
    const saved = JSON.parse(window.localStorage.getItem(FOCUS_STORAGE_KEY) || "null") as Partial<FocusTimerState> | null;
    if (!saved) return emptyFocusState;

    const durationSeconds = Math.max(1, Number(saved.durationSeconds || 1));
    const baseRemaining = Math.max(0, Number(saved.remainingSeconds || durationSeconds));
    const elapsed =
      saved.status === "RUNNING" && saved.startedAt
        ? Math.max(0, Math.floor((Date.now() - Number(saved.startedAt)) / 1000))
        : 0;

    return {
      status: saved.status || "IDLE",
      remainingSeconds: Math.max(0, baseRemaining - elapsed),
      durationSeconds,
      startedAt: saved.startedAt ?? null,
    };
  } catch {
    return emptyFocusState;
  }
}

export function notifyFocusStateChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(FOCUS_STATE_EVENT));
}
