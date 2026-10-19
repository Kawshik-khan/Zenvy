"use client";

import { useMemo, useState } from "react";
import { Alert, Chip, Input, Select } from "@/components/ui";

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
    <fieldset className="m-0 flex flex-col gap-4 rounded-nb border-2 border-line bg-canvas p-4">
      <legend className="px-1 font-grotesk text-[15px] font-bold">Date and time</legend>
      <input type="hidden" name="startTime" value={toLocalDateTimeValue(date, startMinutes)} />
      <input type="hidden" name="endTime" value={toLocalDateTimeValue(endDate, endMinutes)} />
      <input type="hidden" name="timezoneOffset" value={timezoneOffset} />

      <Input id="event-date" type="date" label="Date" min={minDate} value={date} onChange={(event) => setDate(event.target.value)} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Select id="event-start" label="Start" value={startMinutes} onChange={(event) => setStartMinutes(Number(event.target.value))}>
          {timeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        <Select id="event-end" label="End" value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value))}>
          {timeOptions
            .filter((option) => option.value > startMinutes)
            .map((option) => (
              <option key={option.value} value={option.value - startMinutes}>
                {option.label}
              </option>
            ))}
          {endMinutes >= 1440 && <option value={durationMinutes}>Next day {formatTimeValue(endMinutes)}</option>}
        </Select>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Duration">
        {DURATION_OPTIONS.map((option) => (
          <Chip key={option.minutes} selected={durationMinutes === option.minutes} tone="focus" onClick={() => setDurationMinutes(option.minutes)}>
            {option.label}
          </Chip>
        ))}
      </div>

      <p className="m-0 rounded-nb border-2 border-line bg-card px-4 py-3 text-[15px] font-bold" aria-live="polite">
        {date}, {formatTimeValue(startMinutes)} to {endDate !== date ? `${endDate} ` : ""}
        {formatTimeValue(endMinutes)}
      </p>

      {invalid && <Alert tone="warning">{startsInPast ? "Start time cannot be in the past." : "End time must be after the start time."}</Alert>}
    </fieldset>
  );
}
