import { describe, expect, it } from "vitest";
import { formatEventDay, formatHours, formatTimeAgo } from "./format";

describe("formatHours", () => {
  it.each([
    [0, "0h"],
    [3, "3h"],
    [2.5, "2.5h"],
    [2.04, "2.0h"],
  ])("%d → %s", (hours, label) => expect(formatHours(hours)).toBe(label));
});

describe("formatEventDay", () => {
  const now = new Date(2026, 9, 19, 15, 30);
  it("says Today and Tomorrow by calendar day, not by 24-hour distance", () => {
    expect(formatEventDay(new Date(2026, 9, 19, 23, 59), now)).toBe("Today");
    expect(formatEventDay(new Date(2026, 9, 20, 0, 5), now)).toBe("Tomorrow");
  });
  it("falls back to a short date", () => {
    expect(formatEventDay(new Date(2026, 9, 25, 9, 0), now)).toMatch(/25/);
  });
});

describe("formatTimeAgo", () => {
  const now = new Date(2026, 9, 19, 12, 0).getTime();
  const ago = (minutes: number) => new Date(now - minutes * 60_000);
  it.each([
    [0, "0m ago"],
    [59, "59m ago"],
    [60, "1h ago"],
    [23 * 60 + 59, "23h ago"],
  ])("%d minutes → %s", (minutes, label) => expect(formatTimeAgo(ago(minutes), now)).toBe(label));
  it("never goes negative for timestamps slightly in the future", () => {
    expect(formatTimeAgo(new Date(now + 5_000), now)).toBe("0m ago");
  });
  it("switches to a date after a day", () => {
    expect(formatTimeAgo(ago(48 * 60), now)).not.toMatch(/ago/);
  });
});
