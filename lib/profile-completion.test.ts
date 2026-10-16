import { describe, expect, it } from "vitest";
import { cleanText, isProfileComplete } from "./profile-completion";

const complete = {
  college: "DU",
  major: "CS",
  semester: 5,
  interests: "graphs",
  availability: "evenings",
};

describe("isProfileComplete", () => {
  it("is true when every required field is filled", () => {
    expect(isProfileComplete(complete)).toBe(true);
  });

  it("is false for a missing profile", () => {
    expect(isProfileComplete(null)).toBe(false);
  });

  it.each(["college", "major", "semester", "interests", "availability"] as const)("is false without %s", (field) => {
    expect(isProfileComplete({ ...complete, [field]: null })).toBe(false);
  });

  it("treats an undeclared major or whitespace as incomplete", () => {
    expect(isProfileComplete({ ...complete, major: " Undeclared " })).toBe(false);
    expect(isProfileComplete({ ...complete, interests: "   " })).toBe(false);
  });
});

describe("cleanText", () => {
  it("trims strings and ignores non-strings", () => {
    expect(cleanText("  hi ")).toBe("hi");
    expect(cleanText(null)).toBe("");
  });
});
