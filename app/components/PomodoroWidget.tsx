"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
      {isExpanded && (
        <div className="fixed inset-0 z-[130]">
          <button
            type="button"
            aria-label="Close Focus Timer"
            onClick={() => updateExpanded(false)}
            className="absolute inset-0 hidden bg-black/45 backdrop-blur-sm md:block"
          />
          <section className="absolute inset-x-0 bottom-0 max-h-[calc(100dvh-1rem)] rounded-t-[28px] border border-white/10 bg-[#0E1525]/98 p-4 pb-[max(env(safe-area-inset-bottom),1rem)] text-[#F8FAFC] shadow-[0_-24px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl md:inset-y-0 md:left-auto md:right-0 md:h-full md:w-[350px] md:max-h-none md:rounded-none md:border-y-0 md:border-r-0 md:p-5">
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-white/20 md:hidden" />
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#22D3EE]">Focus Session</p>
                <h2 className="mt-1 text-xl font-black">{modeLabel(mode)}</h2>
              </div>
              <button
                type="button"
                onClick={() => updateExpanded(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#141C30] text-[#94A3B8] transition-colors hover:text-white"
                aria-label="Close Focus Timer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="rounded-3xl border border-white/5 bg-[#070B14]/70 p-5 text-center">
              <p className="font-mono text-5xl font-black tracking-tight">{formatTime(remainingSeconds)}</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#141C30]">
                <div className="h-full rounded-full bg-gradient-to-r from-[#7C83FF] to-[#22D3EE]" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-3 text-xs font-bold text-[#94A3B8]">{status === "RUNNING" ? "Focus in progress" : status === "PAUSED" ? "Paused" : "Ready to begin"}</p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={status === "RUNNING" ? pauseTimer : startTimer}
                className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#7C83FF] to-[#A855F7] px-4 py-3 text-sm font-black text-white transition-transform active:scale-95"
              >
                <span className="material-symbols-outlined text-lg">{status === "RUNNING" ? "pause" : "play_arrow"}</span>
                {status === "RUNNING" ? "Pause" : status === "PAUSED" ? "Resume" : "Start"}
              </button>
              <button type="button" onClick={endSession} className="rounded-2xl bg-[#141C30] px-3 py-3 text-sm font-black text-[#CBD5E1] transition-colors hover:text-white">
                End Session
              </button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-[#141C30]/70 p-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-[#94A3B8]">Today</p>
                <p className="mt-1 text-sm font-black">{todaysFocusMinutes}m</p>
              </div>
              <div className="rounded-2xl bg-[#141C30]/70 p-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-[#94A3B8]">Sessions</p>
                <p className="mt-1 text-sm font-black">{focusSessionsCompleted}</p>
              </div>
              <div className="rounded-2xl bg-[#141C30]/70 p-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-[#94A3B8]">Streak</p>
                <p className="mt-1 text-sm font-black">{focusSessionsCompleted > 0 ? 1 : 0}d</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSettingsOpen((current) => !current)}
              className="mt-4 flex w-full items-center justify-between rounded-2xl border border-white/5 bg-[#141C30]/70 px-4 py-3 text-left text-sm font-black text-[#F8FAFC]"
            >
              <span>Session Settings</span>
              <span className="material-symbols-outlined text-lg text-[#94A3B8]">{settingsOpen ? "expand_less" : "expand_more"}</span>
            </button>

            {settingsOpen && (
              <div className="mt-3 space-y-3 rounded-2xl border border-white/5 bg-[#070B14]/60 p-3">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ["focusMinutes", "Timer Length"],
                    ["shortBreakMinutes", "Break Length"],
                    ["longBreakMinutes", "Long Break"],
                    ["longBreakEvery", "Cycle"],
                  ].map(([key, label]) => (
                    <label key={key} className="block rounded-2xl bg-[#141C30]/70 p-2">
                      <span className="block text-[9px] font-black uppercase tracking-widest text-[#94A3B8]">{label}</span>
                      <input
                        type="number"
                        min="1"
                        value={settings[key as keyof TimerSettings]}
                        disabled={status === "RUNNING"}
                        onChange={(event) => updateSetting(key as keyof TimerSettings, Number(event.target.value))}
                        className="mt-1 w-full bg-transparent text-sm font-black text-[#F8FAFC] outline-none disabled:opacity-50"
                      />
                    </label>
                  ))}
                </div>

                <div className="rounded-2xl bg-[#141C30]/70 p-3">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black">Sound Settings</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">{selectedTrack.title}</p>
                    </div>
                    <button
                      type="button"
                      onClick={toggleMusic}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0E1525] text-[#22D3EE] transition-colors hover:text-white"
                      aria-label={isMusicOn ? "Pause music" : "Play music"}
                    >
                      <span className="material-symbols-outlined text-lg">{isMusicOn ? "pause" : "music_note"}</span>
                    </button>
                  </div>
                  <select
                    value={selectedTrackId}
                    onChange={(event) => {
                      setSelectedTrackId(event.target.value);
                      setAudioError("");
                      pauseMusic();
                    }}
                    className="w-full rounded-xl border border-white/10 bg-[#0E1525] px-3 py-2 text-xs font-bold text-[#F8FAFC] outline-none"
                  >
                    {focusTracks.map((track) => (
                      <option key={track.id} value={track.id}>
                        {track.title}
                      </option>
                    ))}
                  </select>
                  <input
                    aria-label="Music volume"
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(event) => setVolume(Number(event.target.value))}
                    className="mt-3 w-full accent-[#22D3EE]"
                  />
                  {audioError && <p className="mt-2 text-xs font-bold text-[#FB7185]">{audioError}</p>}
                </div>
              </div>
            )}

            <div className="mt-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">
              <span>{saveState === "SAVING" ? "Saving" : saveState === "PENDING" || pendingCount > 0 ? "Save pending" : saveState === "SAVED" ? "Saved" : "Ready"}</span>
              <span>{status.toLowerCase()}</span>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
