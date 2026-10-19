import { describe, expect, it } from "vitest";
import { filterPartners, formatMode, hasActiveFilters, relativeDate, unique, type Partner } from "./partners";

const partner = (overrides: Partial<Partner>): Partner => ({
  id: "p",
  name: "Nadia Rahman",
  image: null,
  major: "Computer Science",
  semester: "Semester 5",
  college: "BRAC University",
  match: 90,
  connectionStatus: null,
  skills: ["React", "Graphs"],
  schedule: "Evenings",
  reasons: ["Same major"],
  isAvailable: true,
  bio: "Loves recursion.",
  ...overrides,
});

const nadia = partner({ id: "nadia" });
const arif = partner({ id: "arif", name: "Arif Hasan", major: "Mathematics", semester: "Semester 2", skills: ["Algebra"], reasons: ["Shared interests"], match: 60, isAvailable: false, schedule: "Availability not set", bio: "" });
const all = [nadia, arif];

describe("filterPartners", () => {
  it("returns everyone when no filters are set, treating 'all' as no filter", () => {
    expect(filterPartners(all, {})).toHaveLength(2);
    expect(filterPartners(all, { major: "all", semester: "all", skill: "all", availability: "all" })).toHaveLength(2);
  });

  it("searches names, skills, bio and reasons case-insensitively", () => {
    expect(filterPartners(all, { q: "ARIF" }).map((p) => p.id)).toEqual(["arif"]);
    expect(filterPartners(all, { q: "recursion" }).map((p) => p.id)).toEqual(["nadia"]);
    expect(filterPartners(all, { q: "same major" }).map((p) => p.id)).toEqual(["nadia"]);
  });

  it("filters by major, semester and skill exactly", () => {
    expect(filterPartners(all, { major: "Mathematics" }).map((p) => p.id)).toEqual(["arif"]);
    expect(filterPartners(all, { semester: "Semester 5" }).map((p) => p.id)).toEqual(["nadia"]);
    expect(filterPartners(all, { skill: "Algebra" }).map((p) => p.id)).toEqual(["arif"]);
  });

  it("distinguishes 'available' from 'has a schedule'", () => {
    const scheduledButClosed = partner({ id: "closed", isAvailable: false, schedule: "Mornings" });
    const list = [nadia, arif, scheduledButClosed];
    expect(filterPartners(list, { availability: "available" }).map((p) => p.id)).toEqual(["nadia"]);
    expect(filterPartners(list, { availability: "with-schedule" }).map((p) => p.id)).toEqual(["nadia", "closed"]);
  });

  it("applies the minimum match score", () => {
    expect(filterPartners(all, { minMatch: 80 }).map((p) => p.id)).toEqual(["nadia"]);
    expect(filterPartners(all, { minMatch: 0 })).toHaveLength(2);
  });

  it("combines filters", () => {
    expect(filterPartners(all, { q: "a", major: "Mathematics", minMatch: 80 })).toEqual([]);
  });
});

describe("helpers", () => {
  it("unique sorts, de-duplicates and drops empty values", () => {
    expect(unique(["b", "a", "b", ""])).toEqual(["a", "b"]);
  });
  it("hasActiveFilters ignores an empty form", () => {
    expect(hasActiveFilters({})).toBe(false);
    expect(hasActiveFilters({ q: "react" })).toBe(true);
    expect(hasActiveFilters({ minMatch: 70 })).toBe(true);
  });
  it("formatMode falls back to Any mode", () => {
    expect(formatMode("IN_PERSON")).toBe("In person");
    expect(formatMode("???")).toBe("Any mode");
  });
  it("relativeDate", () => {
    const now = new Date(2026, 9, 19, 12).getTime();
    expect(relativeDate(new Date(now - 3600_000), now)).toBe("Today");
    expect(relativeDate(new Date(now - 36 * 3600_000), now)).toBe("Yesterday");
    expect(relativeDate(new Date(now - 3 * 86400_000), now)).toBe("3d ago");
    expect(relativeDate(new Date(now - 30 * 86400_000), now)).not.toMatch(/ago/);
  });
});
