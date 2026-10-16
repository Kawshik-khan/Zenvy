import { describe, expect, it } from "vitest";
import { recommendChannels, recommendGroups, recommendPeople } from "./discovery";

const currentUser = { id: "me", name: "Me", profile: { id: "p-me", major: "Physics", interests: "math" } };

describe("recommendPeople", () => {
  const candidates = [
    { id: "u1", name: "Alice", profile: { id: "p1", major: "Physics", interests: "math" } },
    { id: "u2", name: "Bob", profile: { id: "p2", major: "Biology", interests: "chemistry" } },
  ];

  it("ranks search matches first and drops non-matches", () => {
    const results = recommendPeople({ currentUser, candidates, query: "bob" });
    expect(results.map((r) => r.id)).toEqual(["u2"]);
    expect(results[0].discoveryScore).toBeGreaterThan(0);
  });

  it("returns every candidate when the query is empty or whitespace", () => {
    expect(recommendPeople({ currentUser, candidates }).map((r) => r.id)).toEqual(["u1", "u2"]);
    expect(recommendPeople({ currentUser, candidates, query: "   " })).toHaveLength(2);
  });
});

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
