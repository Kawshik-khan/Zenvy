"use client";

import { Timer } from "lucide-react";
import { useEffect, useState } from "react";
import { usePomodoro } from "@/app/components/PomodoroProvider";
import {
  emptyFocusState,
  FOCUS_STATE_EVENT,
  formatFocusTime,
  isFocusActive,
  readFocusState,
  type FocusTimerState,
} from "@/app/components/focus-session-state";
import { cx, ProgressBar } from "@/components/ui";

/** Sidebar focus widget: starts a session, or shows the running one. */
export function FocusStatus() {
  const { openPomodoro } = usePomodoro();
  const [state, setState] = useState<FocusTimerState>(emptyFocusState);
  const active = isFocusActive(state);

  useEffect(() => {
    const refresh = () => setState(readFocusState());
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

  const elapsed = state.durationSeconds - state.remainingSeconds;

  return (
    <button
      type="button"
      onClick={openPomodoro}
      className={cx(
        "nb-focus nb-press flex w-full cursor-pointer flex-col gap-2 rounded-nb border-nb px-3 py-2.5 text-left shadow-nb-sm",
        active ? "bg-focus text-ink" : "bg-card text-fg",
      )}
    >
      <span className="flex items-center gap-2 font-bold">
        <Timer aria-hidden="true" size={18} />
        {active ? "Focus active" : "Start focus session"}
      </span>
      {active && (
        <>
          <span className="font-jetbrains text-2xl leading-none font-bold">{formatFocusTime(state.remainingSeconds)}</span>
          <ProgressBar label="Focus session progress" value={elapsed} max={state.durationSeconds} tone="ink" />
        </>
      )}
    </button>
  );
}
