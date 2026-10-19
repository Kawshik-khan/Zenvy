import { describe, expect, it } from "vitest";
import { recommendChannels, recommendGroups, recommendPeople, searchScore, splitList, type UserDiscoveryInput } from "./discovery";

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

  it("returns only the people that match a search", () => {
    const searched = recommendPeople({ currentUser: me, candidates: [strong, weak], query: "arif" });
    expect(searched.map((r) => [r.id, r.discoveryScore])).toEqual([["u2", 100]]);
  });

  it("treats an empty or whitespace query as no search", () => {
    expect(recommendPeople({ currentUser: me, candidates: [strong, weak], query: "   " }).map((r) => r.id)).toEqual(["u1", "u2"]);
  });
});

const currentUser = { id: "me", name: "Me", profile: { id: "p-me", major: "Physics", interests: "math" } };

describe("recommendGroups", () => {
  const groups = [
    { id: "g1", name: "Quantum Club", subject: "Physics", members: [] },
    { id: "g2", name: "Cell Lab", subject: "Biology", members: [] },
  ];

  it("drops groups that do not match the query", () => {
    expect(recommendGroups({ currentUser, groups, query: "cell" }).map((g) => g.id)).toEqual(["g2"]);
  });

  it("returns every group when the query is empty", () => {
    expect(recommendGroups({ currentUser, groups })).toHaveLength(2);
  });
});

describe("recommendChannels", () => {
  const channels = [
    { id: "c1", name: "Math Talk", tag: "math", members: [] },
    { id: "c2", name: "Bio Corner", tag: "bio", members: [] },
  ];

  it("drops channels that do not match the query", () => {
    expect(recommendChannels({ currentUser, channels, query: "bio" }).map((c) => c.id)).toEqual(["c2"]);
  });

  it("returns every channel when the query is empty", () => {
    expect(recommendChannels({ currentUser, channels })).toHaveLength(2);
  });
});
