"use client";

import { Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, cx } from "@/components/ui";

const MODES = [
  { id: "focus", label: "Focus 25", minutes: 25 },
  { id: "short", label: "Break 5", minutes: 5 },
  { id: "long", label: "Long break 15", minutes: 15 },
] as const;

const RADIUS = 96;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** A working Pomodoro timer on the landing page, so visitors can try focus mode. */
export function FocusTimerDemo() {
  const [modeId, setModeId] = useState<(typeof MODES)[number]["id"]>("focus");
  const mode = MODES.find((item) => item.id === modeId)!;
  const total = mode.minutes * 60;
  const [left, setLeft] = useState(total);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(0);

  useEffect(() => {
    if (!running) return;
    const endsAt = Date.now() + left * 1000;
    const timer = window.setInterval(() => {
      const next = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
      setLeft(next);
      if (next === 0) {
        setRunning(false);
        setFinished((value) => value + 1);
      }
    }, 250);
    return () => window.clearInterval(timer);
    // Restart the interval only when the timer starts or stops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const choose = (id: (typeof MODES)[number]["id"]) => {
    setModeId(id);
    setRunning(false);
    setLeft(MODES.find((item) => item.id === id)!.minutes * 60);
  };

  const label = running ? (mode.id === "focus" ? "Focusing" : "On a break") : left < total ? "Paused" : finished ? "Nice work. Go again?" : "Ready when you are";
  const time = `${String(Math.floor(left / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`;

  return (
    <div className="flex flex-col items-center gap-5 rounded-nb-lg border-nb bg-card p-6 shadow-nb-md md:p-8">
      <div role="group" aria-label="Timer length" className="flex flex-wrap justify-center gap-1.5 rounded-full border-nb bg-canvas p-1">
        {MODES.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={item.id === modeId}
            onClick={() => choose(item.id)}
            className={cx(
              "nb-focus min-h-11 cursor-pointer rounded-full border-2 px-4 font-grotesk text-[15px] font-bold text-fg",
              item.id === modeId ? "animate-nb-stamp border-line bg-focus text-ink" : "border-transparent bg-transparent",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="relative aspect-square w-full max-w-[16rem]">
        <svg viewBox="0 0 220 220" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle cx="110" cy="110" r={RADIUS} fill="none" className="stroke-quiet-shade" strokeWidth={16} />
          <circle
            cx="110"
            cy="110"
            r={RADIUS}
            fill="none"
            className="stroke-focus transition-[stroke-dashoffset] duration-1000 ease-linear"
            strokeWidth={16}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - left / total)}
          />
          <circle cx="110" cy="110" r={RADIUS + 9} fill="none" className="stroke-line" strokeWidth={2} />
          <circle cx="110" cy="110" r={RADIUS - 9} fill="none" className="stroke-line" strokeWidth={2} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-center">
          <span role="timer" aria-live="off" className={cx("font-jetbrains text-5xl font-bold tabular-nums", running && "animate-nb-float")}>
            {time}
          </span>
          <span className="text-sm font-bold" aria-live="polite">
            {label}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Button variant="focus" onClick={() => setRunning((value) => !value)} icon={running ? <Pause size={18} /> : <Play size={18} />}>
          {running ? "Pause" : left < total ? "Resume" : "Start"}
        </Button>
        <Button
          variant="secondary"
          icon={<RotateCcw size={18} />}
          onClick={() => {
            setRunning(false);
            setLeft(total);
          }}
        >
          Reset
        </Button>
      </div>
    </div>
  );
}
