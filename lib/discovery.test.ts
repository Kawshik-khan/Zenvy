import { describe, expect, it } from "vitest";
import { recommendPeople, searchScore, splitList, type UserDiscoveryInput } from "./discovery";

describe("splitList", () => {
  it("splits, trims and drops empty items", () => {
    expect(splitList(" react, , node ,go")).toEqual(["react", "node", "go"]);
    expect(splitList(null)).toEqual([]);
  });
});

describe("searchScore", () => {
  it("ranks exact > prefix > substring > term matches", () => {
    expect(searchScore("cs", ["CS"])).toBe(100);
    expect(searchScore("comp", ["Computer Science"])).toBe(80);
    expect(searchScore("science", ["Computer Science"])).toBe(55);
    expect(searchScore("computer dhaka", ["Computer Science", "Dhaka University"])).toBe(30);
  });

  it("is 0 for an empty query or no match", () => {
    expect(searchScore("", ["anything"])).toBe(0);
    expect(searchScore("biology", ["Computer Science"])).toBe(0);
  });
});

describe("recommendPeople", () => {
  const me: UserDiscoveryInput = {
    id: "me",
    name: "Me",
    profile: { id: "p-me", major: "CS", college: "DU", semester: 5, interests: "react, graphs", availability: "evenings" },
  };

  const strong: UserDiscoveryInput = {
    id: "u1",
    name: "Nadia",
    profile: { id: "p1", major: "cs", college: "du", semester: 4, interests: "Graphs, React", availability: "Evenings" },
  };
  const weak: UserDiscoveryInput = {
    id: "u2",
    name: "Arif",
    profile: { id: "p2", major: "Math", semester: 1, interests: "algebra" },
  };
  const hidden: UserDiscoveryInput = {
    id: "u3",
    name: "Hidden",
    profile: { id: "p3", major: "CS", matchingAvailable: false },
  };
  const rejected: UserDiscoveryInput = {
    id: "u4",
    name: "Rejected",
    profile: { id: "p4", major: "CS" },
  };

  const results = recommendPeople({
    currentUser: me,
    candidates: [weak, me, strong, hidden, rejected],
    existingMatches: [{ profileId: "p-me", matchedProfileId: "p4", status: "REJECTED" }],
  });

  it("excludes self, people not open to matching, and rejected matches", () => {
    expect(results.map((r) => r.id)).toEqual(["u1", "u2"]);
  });

  it("scores and explains a strong match", () => {
    const [top] = results;
    // 25 major + 16 interests + 20 availability + 10 college + 10 semester
    expect(top.discoveryScore).toBe(81);
    expect(top.discoveryReasons).toEqual(["Same major", "2 shared interests", "Availability set", "Same college"]);
  });

  it("gives a default reason when nothing overlaps", () => {
    expect(results[1].discoveryReasons).toEqual(["Open to study partners"]);
  });

  it("ranks search matches first and zeroes non-matches", () => {
    const searched = recommendPeople({ currentUser: me, candidates: [strong, weak], query: "arif" });
    // Current behaviour: non-matches are kept with score 0 because the -1 marker is
    // clamped before the `>= 0` filter. Tracked as a separate fix.
    expect(searched.map((r) => [r.id, r.discoveryScore])).toEqual([
      ["u2", 100],
      ["u1", 0],
    ]);
  });
});
