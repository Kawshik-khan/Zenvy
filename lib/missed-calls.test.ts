import { describe, expect, it } from "vitest";
import { missedCallText } from "./missed-calls";

describe("missed calls", () => {
  it("says what kind of call was missed", () => {
    expect(missedCallText("AUDIO")).toBe("Missed voice call");
    expect(missedCallText("VIDEO")).toBe("Missed video call");
  });
});
