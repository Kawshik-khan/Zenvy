import { describe, expect, it } from "vitest";
import { isPublicPath, safeCallbackPath } from "@/lib/routes";
import { formatBadge, hidesMobileBar, isPathActive, isSecondaryActive, primaryNav, visiblePrimaryNav } from "./nav";

describe("primary nav", () => {
  it("has the six destinations in order", () => {
    expect(primaryNav.map((item) => item.label)).toEqual(["Home", "Find partners", "Messages", "Jobs", "Focus", "Profile"]);
  });

  it("hides Jobs until the flag is on", () => {
    expect(visiblePrimaryNav({ jobs: false }).map((item) => item.key)).not.toContain("jobs");
    expect(visiblePrimaryNav({ jobs: true }).map((item) => item.key)).toContain("jobs");
  });
});

describe("isPathActive", () => {
  const messages = primaryNav.find((item) => item.key === "messages")!;

  it.each(["/chat", "/chat/personal", "/groups", "/groups/abc", "/channels/xyz"])("Messages is active on %s", (path) => {
    expect(isPathActive(path, messages.match)).toBe(true);
  });

  it("does not match lookalike prefixes", () => {
    expect(isPathActive("/chatter", messages.match)).toBe(false);
    expect(isPathActive("/groupsies", messages.match)).toBe(false);
  });

  it("treats profile pages of other users as Find partners", () => {
    const partners = primaryNav.find((item) => item.key === "partners")!;
    expect(isPathActive("/users/123", partners.match)).toBe(true);
  });

  it("knows the secondary screens", () => {
    expect(isSecondaryActive("/events")).toBe(true);
    expect(isSecondaryActive("/dashboard")).toBe(false);
  });
});

describe("hidesMobileBar", () => {
  it.each([
    ["/chat", true, true],
    ["/chat", false, false],
    ["/chat/personal", false, true],
    ["/groups/abc", false, true],
    ["/channels/xyz", false, true],
    ["/groups", false, false],
    ["/dashboard", false, false],
  ])("%s (conversation param: %s) → %s", (path, hasParam, expected) => {
    expect(hidesMobileBar(path, hasParam)).toBe(expected);
  });
});

describe("formatBadge", () => {
  it.each([
    [0, null],
    [3, "3"],
    [12, "9+"],
  ])("%d → %s", (count, expected) => {
    expect(formatBadge(count)).toBe(expected);
  });
});

describe("isPublicPath", () => {
  it.each(["/", "/login", "/register", "/verify", "/zenvy-admin/login", "/login/", "/ui"])("%s is public", (path) => {
    expect(isPublicPath(path)).toBe(true);
  });

  it.each(["/dashboard", "/chat", "/profile", "/zenvy-admin", "/onboarding", "/call/active", "/uix", "/loginx"])("%s is protected", (path) => {
    expect(isPublicPath(path)).toBe(false);
  });
});

describe("safeCallbackPath", () => {
  it.each([
    ["/matching?tab=1", "/matching?tab=1"],
    ["//evil.com", null],
    ["/\\evil.com", null],
    ["https://evil.com", null],
    [null, null],
  ])("%j → %j", (input, expected) => {
    expect(safeCallbackPath(input)).toBe(expected);
  });

  it("accepts absolute URLs only on the app's own origin", () => {
    const origin = "https://zenvy.app";
    expect(safeCallbackPath("https://zenvy.app/matching?x=1#top", origin)).toBe("/matching?x=1#top");
    expect(safeCallbackPath("https://evil.com/matching", origin)).toBeNull();
    expect(safeCallbackPath("https://zenvy.app.evil.com/", origin)).toBeNull();
    expect(safeCallbackPath("javascript:alert(1)", origin)).toBeNull();
    expect(safeCallbackPath("not a url", origin)).toBeNull();
  });
});
