"use client";

import { useMemo, useState } from "react";

const STEP_MINUTES = 15;
const DURATION_OPTIONS = [
  { label: "30m", minutes: 30 },
  { label: "1h", minutes: 60 },
  { label: "2h", minutes: 120 },
];

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function roundUpToStep(date: Date) {
  const rounded = new Date(date);
  rounded.setSeconds(0, 0);
  const minutes = rounded.getMinutes();
  const extra = (STEP_MINUTES - (minutes % STEP_MINUTES)) % STEP_MINUTES;
  rounded.setMinutes(minutes + extra);
  return rounded;
}

function toDateInputValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toMinutes(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

function formatTimeValue(minutes: number) {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  return `${pad(Math.floor(normalized / 60))}:${pad(normalized % 60)}`;
}

function toLocalDateTimeValue(date: string, minutes: number) {
  return `${date}T${formatTimeValue(minutes)}`;
}

function buildTimeOptions() {
  const options: Array<{ value: number; label: string }> = [];
  for (let minutes = 0; minutes < 24 * 60; minutes += STEP_MINUTES) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    const labelDate = new Date(2000, 0, 1, hour, minute);
    options.push({
      value: minutes,
      label: labelDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    });
  }
  return options;
}

export default function EventDateTimePicker() {
  const initialStart = useMemo(() => {
    const next = roundUpToStep(new Date());
    next.setHours(next.getHours() + 1);
    return next;
  }, []);
  const timeOptions = useMemo(() => buildTimeOptions(), []);
  const [date, setDate] = useState(toDateInputValue(initialStart));
  const [startMinutes, setStartMinutes] = useState(toMinutes(initialStart));
  const [durationMinutes, setDurationMinutes] = useState(60);
  const endMinutes = startMinutes + durationMinutes;
  const endDate = useMemo(() => {
    const value = new Date(`${date}T00:00`);
    if (endMinutes >= 1440) value.setDate(value.getDate() + Math.floor(endMinutes / 1440));
    return toDateInputValue(value);
  }, [date, endMinutes]);
  const timezoneOffset = new Date().getTimezoneOffset();
  const minDate = toDateInputValue(new Date());
  const selectedStart = new Date(`${date}T${formatTimeValue(startMinutes)}`);
  const startsInPast = selectedStart.getTime() < Date.now() - 60000;
  const invalid = durationMinutes <= 0 || startsInPast;

  return (
    <div className="rounded-[24px] border border-outline-variant/30 bg-surface-container-low/50 p-4">
      <input type="hidden" name="startTime" value={toLocalDateTimeValue(date, startMinutes)} />
      <input type="hidden" name="endTime" value={toLocalDateTimeValue(endDate, endMinutes)} />
      <input type="hidden" name="timezoneOffset" value={timezoneOffset} />

      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant">Date and Time</p>
          <p className="mt-1 text-sm text-on-surface-variant">Choose a study date, start time, and duration.</p>
        </div>
        <span className="material-symbols-outlined text-primary">calendar_clock</span>
      </div>

      <div className="grid gap-3">
        <label className="space-y-2">
          <span className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Date</span>
          <input
            type="date"
            min={minDate}
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="app-input px-4 py-3"
          />
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Start</span>
            <select
              value={startMinutes}
              onChange={(event) => setStartMinutes(Number(event.target.value))}
              className="app-input px-4 py-3"
            >
              {timeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant">End</span>
            <select
              value={durationMinutes}
              onChange={(event) => setDurationMinutes(Number(event.target.value))}
              className="app-input px-4 py-3"
            >
              {timeOptions
                .filter((option) => option.value > startMinutes)
                .map((option) => (
                  <option key={option.value} value={option.value - startMinutes}>
                    {option.label}
                  </option>
                ))}
              {endMinutes >= 1440 && <option value={durationMinutes}>Next day {formatTimeValue(endMinutes)}</option>}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {DURATION_OPTIONS.map((option) => (
            <button
              key={option.minutes}
              type="button"
              onClick={() => setDurationMinutes(option.minutes)}
              className={`rounded-2xl px-3 py-2 text-xs font-black transition-colors ${
                durationMinutes === option.minutes
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="rounded-2xl bg-surface-container/70 px-4 py-3 text-sm font-bold text-on-surface">
          {date} - {formatTimeValue(startMinutes)} to {endDate !== date ? `${endDate} ` : ""}{formatTimeValue(endMinutes)}
        </div>

        {invalid && (
          <p className="text-xs font-bold text-error">
            {startsInPast ? "Start time cannot be in the past." : "End time must be after the start time."}
          </p>
        )}
      </div>
    </div>
  );
}
