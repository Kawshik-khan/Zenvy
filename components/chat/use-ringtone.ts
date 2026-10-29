"use client";

import { useEffect } from "react";

/** One ring: two soft rising notes, then quiet until the next ring. */
const RING_NOTES = [
  { freq: 660, at: 0, length: 0.35 },
  { freq: 880, at: 0.42, length: 0.45 },
];
const RING_EVERY_MS = 2600;
const VIBRATE_PATTERN = [700, 400, 700];

/**
 * Rings while `active` is true: a synthesized two-note ring (no audio file to license) and,
 * on phones that support it, a vibration. Browsers may stay silent until the page has had a click.
 */
export function useRingtone(active: boolean) {
  useEffect(() => {
    if (!active || typeof window === "undefined") return;
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    let context: AudioContext | null = null;
    try {
      context = AudioContextClass ? new AudioContextClass() : null;
    } catch {
      context = null;
    }

    const ring = () => {
      if (context) {
        void context.resume().catch(() => {});
        const start = context.currentTime + 0.02;
        for (const note of RING_NOTES) {
          const osc = context.createOscillator();
          const gain = context.createGain();
          osc.type = "sine";
          osc.frequency.value = note.freq;
          // Quick fade in and out so each note is a soft chime, not a click.
          gain.gain.setValueAtTime(0, start + note.at);
          gain.gain.linearRampToValueAtTime(0.18, start + note.at + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, start + note.at + note.length);
          osc.connect(gain).connect(context.destination);
          osc.start(start + note.at);
          osc.stop(start + note.at + note.length + 0.05);
        }
      }
      navigator.vibrate?.(VIBRATE_PATTERN);
    };

    ring();
    const timer = window.setInterval(ring, RING_EVERY_MS);
    return () => {
      window.clearInterval(timer);
      navigator.vibrate?.(0);
      void context?.close().catch(() => {});
    };
  }, [active]);
}
