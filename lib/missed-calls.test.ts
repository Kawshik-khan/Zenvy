import { describe, expect, it } from "vitest";
import { focusMinutesLeft, missedCallText } from "./missed-calls";

describe("missed calls", () => {
  it("says what kind of call was missed and why", () => {
    expect(missedCallText("AUDIO", "NO_ANSWER")).toBe("Missed voice call");
    expect(missedCallText("VIDEO", "NO_ANSWER")).toBe("Missed video call");
    expect(missedCallText("VIDEO", "FOCUS")).toBe("Called (video) while you were focusing");
  });

  it("counts focus minutes left, rounding up, and treats a past end as free", () => {
    const now = new Date("2026-10-29T10:00:00Z");
    expect(focusMinutesLeft(null, now)).toBeNull();
    expect(focusMinutesLeft(new Date("2026-10-29T09:59:00Z"), now)).toBeNull();
    expect(focusMinutesLeft(new Date("2026-10-29T10:00:20Z"), now)).toBe(1);
    expect(focusMinutesLeft(new Date("2026-10-29T10:17:30Z"), now)).toBe(18);
  });
});
