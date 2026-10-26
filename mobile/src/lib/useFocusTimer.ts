import { useCallback, useEffect, useRef, useState } from "react";

export type FocusMode = "focus" | "short" | "long";

export const MODE_SECONDS: Record<FocusMode, number> = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };

export function formatClock(seconds: number) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * Pomodoro timer. Counts against a wall-clock end time so it stays accurate when the
 * JS thread is throttled (backgrounded tab, low-power mode).
 */
export function useFocusTimer(onComplete: (mode: FocusMode) => void) {
  const [mode, setModeState] = useState<FocusMode>("focus");
  const [remaining, setRemaining] = useState(MODE_SECONDS.focus);
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const completeRef = useRef(onComplete);
  useEffect(() => {
    completeRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (endsAt === null) return;
    const tick = () => {
      const left = (endsAt - Date.now()) / 1000;
      if (left <= 0) {
        setEndsAt(null);
        setRemaining(MODE_SECONDS[mode]);
        completeRef.current(mode);
      } else {
        setRemaining(left);
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [endsAt, mode]);

  const start = useCallback(() => {
    const left = remaining <= 0 ? MODE_SECONDS[mode] : remaining;
    setRemaining(left);
    setEndsAt(Date.now() + left * 1000);
  }, [mode, remaining]);

  const pause = useCallback(() => setEndsAt(null), []);

  const reset = useCallback(() => {
    setEndsAt(null);
    setRemaining(MODE_SECONDS[mode]);
  }, [mode]);

  const setMode = useCallback((next: FocusMode) => {
    setEndsAt(null);
    setModeState(next);
    setRemaining(MODE_SECONDS[next]);
  }, []);

  return {
    mode,
    setMode,
    remaining,
    total: MODE_SECONDS[mode],
    running: endsAt !== null,
    start,
    pause,
    reset,
    /** Ends the current round now, counting the elapsed minutes. */
    finish: () => {
      const elapsed = MODE_SECONDS[mode] - remaining;
      setEndsAt(null);
      setRemaining(MODE_SECONDS[mode]);
      return Math.max(1, Math.round(elapsed / 60));
    },
  };
}
