"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Music, Pause, Play } from "lucide-react";
import { Alert, Button, Card, IconButton, Input, ProgressBar, Select, Sheet, SheetContent } from "@/components/ui";
import { focusTracks } from "@/lib/focus-audio";
import { FOCUS_STORAGE_KEY, notifyFocusStateChanged } from "./focus-session-state";

type TimerMode = "FOCUS" | "SHORT_BREAK" | "LONG_BREAK";
type TimerStatus = "IDLE" | "RUNNING" | "PAUSED";

type TimerSettings = {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  longBreakEvery: number;
};

type SavedTimerState = {
  mode: TimerMode;
  status: TimerStatus;
  remainingSeconds: number;
  durationSeconds: number;
  startedAt: number | null;
  focusSessionsCompleted: number;
  settings: TimerSettings;
  selectedTrackId: string;
  volume: number;
  muted: boolean;
  expanded: boolean;
};

type PendingSession = {
  mode: TimerMode;
  plannedMinutes: number;
  completedMinutes: number;
  startedAt: string;
  endedAt: string;
  status: "COMPLETED";
  trackId?: string;
};

type PomodoroWidgetProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showLauncher?: boolean;
};

const STORAGE_KEY = FOCUS_STORAGE_KEY;
const PENDING_KEY = "zenvy:pomodoro-pending:v1";

const defaultSettings: TimerSettings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakEvery: 4,
};

const DEFAULT_VOLUME = 0.85;

function getDurationSeconds(mode: TimerMode, settings: TimerSettings) {
  if (mode === "SHORT_BREAK") return settings.shortBreakMinutes * 60;
  if (mode === "LONG_BREAK") return settings.longBreakMinutes * 60;
  return settings.focusMinutes * 60;
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function modeLabel(mode: TimerMode) {
  if (mode === "SHORT_BREAK") return "Short break";
  if (mode === "LONG_BREAK") return "Long break";
  return "Focus";
}

function clampSetting(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

async function postPomodoroSession(session: PendingSession) {
  const response = await fetch("/api/pomodoro-sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(session),
  });

  if (!response.ok) {
    throw new Error("Failed to save Pomodoro session");
  }
}

function readPendingSessions() {
  try {
    return JSON.parse(localStorage.getItem(PENDING_KEY) || "[]") as PendingSession[];
  } catch {
    return [];
  }
}

function writePendingSessions(sessions: PendingSession[]) {
  localStorage.setItem(PENDING_KEY, JSON.stringify(sessions));
}

export default function PomodoroWidget({ open, onOpenChange, showLauncher = true }: PomodoroWidgetProps = {}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const completionLock = useRef(false);
  const startedAtRef = useRef<number | null>(null);
  const modeRef = useRef<TimerMode>("FOCUS");
  const settingsRef = useRef<TimerSettings>(defaultSettings);
  const selectedTrackIdRef = useRef(focusTracks[0]?.id || "");

  const [authorized, setAuthorized] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [settings, setSettings] = useState<TimerSettings>(defaultSettings);
  const [mode, setMode] = useState<TimerMode>("FOCUS");
  const [status, setStatus] = useState<TimerStatus>("IDLE");
  const [durationSeconds, setDurationSeconds] = useState(defaultSettings.focusMinutes * 60);
  const [remainingSeconds, setRemainingSeconds] = useState(defaultSettings.focusMinutes * 60);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [focusSessionsCompleted, setFocusSessionsCompleted] = useState(0);
  const [selectedTrackId, setSelectedTrackId] = useState(focusTracks[0]?.id || "");
  const [isMusicOn, setIsMusicOn] = useState(false);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [muted, setMuted] = useState(false);
  const [audioError, setAudioError] = useState("");
  const [saveState, setSaveState] = useState<"IDLE" | "SAVING" | "SAVED" | "PENDING">("IDLE");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const isControlled = typeof open === "boolean";
  const isExpanded = isControlled ? open : expanded;

  const selectedTrack = useMemo(
    () => focusTracks.find((track) => track.id === selectedTrackId) || focusTracks[0],
    [selectedTrackId],
  );

  const updateExpanded = useCallback((nextOpen: boolean) => {
    if (!isControlled) setExpanded(nextOpen);
    onOpenChange?.(nextOpen);
  }, [isControlled, onOpenChange]);

  useEffect(() => {
    modeRef.current = mode;
    settingsRef.current = settings;
    startedAtRef.current = startedAt;
    selectedTrackIdRef.current = selectedTrackId;
  }, [mode, settings, startedAt, selectedTrackId]);

  useEffect(() => {
    fetch("/api/study-metrics", { cache: "no-store" })
      .then((response) => {
        setAuthorized(response.ok);
      })
      .catch(() => setAuthorized(false))
      .finally(() => setIsCheckingAuth(false));
  }, []);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") as SavedTimerState | null;
      if (!saved) return;

      const savedSettings = saved.settings || defaultSettings;
      const savedMode = saved.mode || "FOCUS";
      const savedDuration = saved.durationSeconds || getDurationSeconds(savedMode, savedSettings);
      const elapsed = saved.status === "RUNNING" && saved.startedAt ? Math.floor((Date.now() - saved.startedAt) / 1000) : 0;
      const nextRemaining = Math.max(0, saved.remainingSeconds - elapsed);
      const shouldCompleteRestoredTimer = saved.status === "RUNNING" && saved.startedAt && nextRemaining <= 0;

      setSettings(savedSettings);
      setMode(savedMode);
      setDurationSeconds(savedDuration);
      setRemainingSeconds(shouldCompleteRestoredTimer ? 0 : nextRemaining || savedDuration);
      setStartedAt(saved.status === "RUNNING" ? Date.now() - (savedDuration - nextRemaining) * 1000 : null);
      setStatus(saved.status === "RUNNING" ? "RUNNING" : saved.status === "PAUSED" ? "PAUSED" : "IDLE");
      setFocusSessionsCompleted(saved.focusSessionsCompleted || 0);
      setSelectedTrackId(saved.selectedTrackId || focusTracks[0]?.id || "");
      setVolume(typeof saved.volume === "number" ? saved.volume : DEFAULT_VOLUME);
      setMuted(Boolean(saved.muted));
      if (!isControlled) setExpanded(Boolean(saved.expanded));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      notifyFocusStateChanged();
    }
  }, [isControlled]);

  useEffect(() => {
    if (!authorized) return;

    const retryPending = async () => {
      const pending = readPendingSessions();
      if (pending.length === 0) return;

      const remaining: PendingSession[] = [];
      for (const session of pending) {
        try {
          await postPomodoroSession(session);
        } catch {
          remaining.push(session);
        }
      }
      writePendingSessions(remaining);
      setSaveState(remaining.length === 0 ? "SAVED" : "PENDING");
    };

    retryPending();
  }, [authorized]);

  useEffect(() => {
    if (!authorized) return;

    const saved: SavedTimerState = {
      mode,
      status,
      remainingSeconds,
      durationSeconds,
      startedAt,
      focusSessionsCompleted,
      settings,
      selectedTrackId,
      volume,
      muted,
      expanded: isExpanded,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    notifyFocusStateChanged();
  }, [authorized, mode, status, remainingSeconds, durationSeconds, startedAt, focusSessionsCompleted, settings, selectedTrackId, volume, muted, isExpanded]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !selectedTrack) return;

    audio.volume = volume;
    audio.muted = muted;
    audio.loop = true;
  }, [selectedTrack, volume, muted]);

  const playCompletionChime = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      const context = new AudioContextClass();
      const gain = context.createGain();
      gain.gain.value = 0.08;
      gain.connect(context.destination);

      [523.25, 659.25, 783.99].forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        oscillator.connect(gain);
        const start = context.currentTime + index * 0.12;
        oscillator.start(start);
        oscillator.stop(start + 0.16);
      });
    } catch {
      // Audio notifications are optional.
    }
  }, []);

  const saveCompletedSession = useCallback(async (payload: PendingSession) => {
    setSaveState("SAVING");
    try {
      await postPomodoroSession(payload);
      setSaveState("SAVED");
    } catch {
      const pending = readPendingSessions();
      writePendingSessions([...pending, payload]);
      setSaveState("PENDING");
    }
  }, []);

  const moveToMode = useCallback((nextMode: TimerMode, nextFocusCount = focusSessionsCompleted) => {
    const nextDuration = getDurationSeconds(nextMode, settingsRef.current);
    completionLock.current = false;
    setMode(nextMode);
    setStatus("IDLE");
    setStartedAt(null);
    setDurationSeconds(nextDuration);
    setRemainingSeconds(nextDuration);
    setFocusSessionsCompleted(nextFocusCount);
  }, [focusSessionsCompleted]);

  const completeCurrentTimer = useCallback(() => {
    if (completionLock.current) return;
    completionLock.current = true;

    const currentMode = modeRef.current;
    const currentSettings = settingsRef.current;
    const completedAt = new Date();
    const currentStartedAt = startedAtRef.current ? new Date(startedAtRef.current) : new Date(completedAt.getTime() - getDurationSeconds(currentMode, currentSettings) * 1000);

    playCompletionChime();

    if (currentMode === "FOCUS") {
      const nextFocusCount = focusSessionsCompleted + 1;
      const nextMode = nextFocusCount % currentSettings.longBreakEvery === 0 ? "LONG_BREAK" : "SHORT_BREAK";
      saveCompletedSession({
        mode: "FOCUS",
        plannedMinutes: currentSettings.focusMinutes,
        completedMinutes: currentSettings.focusMinutes,
        startedAt: currentStartedAt.toISOString(),
        endedAt: completedAt.toISOString(),
        status: "COMPLETED",
        trackId: selectedTrackIdRef.current || undefined,
      });
      moveToMode(nextMode, nextFocusCount);
      return;
    }

    moveToMode("FOCUS", focusSessionsCompleted);
  }, [focusSessionsCompleted, moveToMode, playCompletionChime, saveCompletedSession]);

  useEffect(() => {
    if (status !== "RUNNING" || !startedAt) return;

    const tick = () => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const nextRemaining = Math.max(0, durationSeconds - elapsed);
      setRemainingSeconds(nextRemaining);

      if (nextRemaining <= 0) {
        completeCurrentTimer();
      }
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [completeCurrentTimer, durationSeconds, startedAt, status]);

  const playMusic = async () => {
    const audio = audioRef.current;
    if (!audio || isMusicOn) return;

    setAudioError("");
    try {
      audio.volume = volume;
      audio.muted = muted;
      await audio.play();
      setIsMusicOn(true);
    } catch {
      setAudioError("Browser blocked audio. Press the music button once.");
      setIsMusicOn(false);
    }
  };

  const pauseMusic = () => {
    audioRef.current?.pause();
    setIsMusicOn(false);
  };

  const toggleMusic = async () => {
    if (isMusicOn) {
      pauseMusic();
      return;
    }

    await playMusic();
  };

  const startTimer = () => {
    completionLock.current = false;
    const elapsedSeconds = durationSeconds - remainingSeconds;
    setStartedAt(Date.now() - elapsedSeconds * 1000);
    setStatus("RUNNING");
    playMusic();
  };

  const pauseTimer = () => {
    if (startedAt) {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      setRemainingSeconds(Math.max(0, durationSeconds - elapsed));
    }
    setStartedAt(null);
    setStatus("PAUSED");
  };

  const resetTimer = () => {
    completionLock.current = false;
    setStartedAt(null);
    setStatus("IDLE");
    setDurationSeconds(getDurationSeconds(mode, settings));
    setRemainingSeconds(getDurationSeconds(mode, settings));
  };

  const endSession = () => {
    pauseMusic();
    resetTimer();
  };

  const skipTimer = () => {
    const nextMode = mode === "FOCUS" ? "SHORT_BREAK" : "FOCUS";
    moveToMode(nextMode);
  };

  const updateSetting = (key: keyof TimerSettings, value: number) => {
    const limits: Record<keyof TimerSettings, [number, number]> = {
      focusMinutes: [1, 120],
      shortBreakMinutes: [1, 60],
      longBreakMinutes: [1, 90],
      longBreakEvery: [2, 12],
    };
    const [min, max] = limits[key];
    const nextSettings = { ...settings, [key]: clampSetting(value, min, max) };
    setSettings(nextSettings);

    if (status === "IDLE") {
      const nextDuration = getDurationSeconds(mode, nextSettings);
      setDurationSeconds(nextDuration);
      setRemainingSeconds(nextDuration);
    }
  };

  const progress = durationSeconds > 0 ? Math.round(((durationSeconds - remainingSeconds) / durationSeconds) * 100) : 0;
  const pendingCount = typeof window !== "undefined" ? readPendingSessions().length : 0;
  const todaysFocusMinutes = focusSessionsCompleted * settings.focusMinutes;

  if (isCheckingAuth || !authorized || !selectedTrack) {
    return null;
  }

  return (
    <>
      <audio
        ref={audioRef}
        src={selectedTrack.src}
        preload="metadata"
        onEnded={() => setIsMusicOn(false)}
        onError={() => {
          if (isMusicOn) setAudioError("Audio file not found in public/audio.");
          setIsMusicOn(false);
        }}
      />
      {showLauncher && !isExpanded && (
        <button type="button" onClick={() => updateExpanded(true)} className="sr-only">
          Open Focus Timer
        </button>
      )}
      <Sheet open={isExpanded} onOpenChange={updateExpanded}>
        <SheetContent
          title={modeLabel(mode)}
          description="Focus session"
          side="right"
          className="quiet"
        >
          <div className="flex flex-col gap-5">
            <Card tone="paper" shadow="none" padding="md" className="text-center">
              <p role="timer" aria-label="Time remaining" className="m-0 font-jetbrains text-6xl leading-none font-bold tracking-tight">
                {formatTime(remainingSeconds)}
              </p>
              <ProgressBar value={progress} label="Session progress" tone="focus" className="mt-5" />
              <p className="m-0 mt-3 text-[15px] font-bold" aria-live="polite">
                {status === "RUNNING" ? "In progress" : status === "PAUSED" ? "Paused" : "Ready to begin"}
              </p>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="focus"
                onClick={status === "RUNNING" ? pauseTimer : startTimer}
                icon={status === "RUNNING" ? <Pause size={18} /> : <Play size={18} />}
              >
                {status === "RUNNING" ? "Pause" : status === "PAUSED" ? "Resume" : "Start"}
              </Button>
              <Button variant="secondary" onClick={endSession}>
                End session
              </Button>
            </div>

            <dl className="m-0 grid grid-cols-2 gap-3">
              <Card tone="card" shadow="none" padding="sm">
                <dt className="text-sm font-bold text-fg-muted">Sessions done</dt>
                <dd className="m-0 font-jetbrains text-2xl font-bold">{focusSessionsCompleted}</dd>
              </Card>
              <Card tone="card" shadow="none" padding="sm">
                <dt className="text-sm font-bold text-fg-muted">Minutes focused</dt>
                <dd className="m-0 font-jetbrains text-2xl font-bold">{todaysFocusMinutes}</dd>
              </Card>
            </dl>

            <div className="flex flex-col gap-3">
              <Button
                variant="secondary"
                onClick={() => setSettingsOpen((current) => !current)}
                aria-expanded={settingsOpen}
                aria-controls="focus-settings"
                icon={settingsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                className="justify-between"
              >
                Session settings
              </Button>

              {settingsOpen && (
                <div id="focus-settings" className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ["focusMinutes", "Focus (min)"],
                      ["shortBreakMinutes", "Break (min)"],
                      ["longBreakMinutes", "Long break (min)"],
                      ["longBreakEvery", "Long break every"],
                    ].map(([key, label]) => (
                      <Input
                        key={key}
                        id={`focus-setting-${key}`}
                        type="number"
                        min="1"
                        label={label}
                        value={settings[key as keyof TimerSettings]}
                        disabled={status === "RUNNING"}
                        onChange={(event) => updateSetting(key as keyof TimerSettings, Number(event.target.value))}
                      />
                    ))}
                  </div>

                  <div className="flex flex-col gap-3 rounded-nb border-2 border-line bg-card p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="m-0 font-grotesk font-bold">Background sound</p>
                        <p className="m-0 truncate text-sm text-fg-muted">{selectedTrack.title}</p>
                      </div>
                      <IconButton
                        label={isMusicOn ? "Pause music" : "Play music"}
                        icon={isMusicOn ? <Pause size={18} /> : <Music size={18} />}
                        onClick={toggleMusic}
                      />
                    </div>
                    <Select
                      id="focus-track"
                      label="Track"
                      value={selectedTrackId}
                      onChange={(event) => {
                        setSelectedTrackId(event.target.value);
                        setAudioError("");
                        pauseMusic();
                      }}
                    >
                      {focusTracks.map((track) => (
                        <option key={track.id} value={track.id}>
                          {track.title}
                        </option>
                      ))}
                    </Select>
                    <label className="flex flex-col gap-1.5 font-grotesk text-[15px] font-bold">
                      Music volume
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={volume}
                        onChange={(event) => setVolume(Number(event.target.value))}
                        className="nb-focus h-6 w-full cursor-pointer accent-ink"
                      />
                    </label>
                    {audioError && <Alert tone="error">{audioError}</Alert>}
                  </div>
                </div>
              )}
            </div>

            <p className="m-0 flex items-center justify-between text-sm text-fg-muted" aria-live="polite">
              <span>{saveState === "SAVING" ? "Saving" : saveState === "PENDING" || pendingCount > 0 ? "Save pending, will retry" : saveState === "SAVED" ? "Saved" : "Ready"}</span>
              <span className="capitalize">{status.toLowerCase()}</span>
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
