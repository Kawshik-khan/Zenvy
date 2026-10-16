import { describe, expect, it } from "vitest";
import { isEnabled } from "./flags";

describe("isEnabled", () => {
  it("is off when the env var is missing or empty", () => {
    expect(isEnabled("jobs", {})).toBe(false);
    expect(isEnabled("jobs", { FEATURE_JOBS: "" })).toBe(false);
  });

  it.each(["1", "true", "TRUE", " on ", "yes"])("is on for %j", (value) => {
    expect(isEnabled("jobs", { FEATURE_JOBS: value })).toBe(true);
  });

  it.each(["0", "false", "off", "no", "enabled"])("is off for %j", (value) => {
    expect(isEnabled("jobs", { FEATURE_JOBS: value })).toBe(false);
  });
});
