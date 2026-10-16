import type { Tone } from "@/components/ui";

export type NavKey = "home" | "partners" | "messages" | "jobs" | "focus" | "profile";

export type NavItem = {
  key: NavKey;
  label: string;
  /** Absent for actions (Focus opens the timer instead of navigating). */
  href?: string;
  /** Path prefixes that light this item up. */
  match?: string[];
  /** Fill used when active. */
  tone: Tone;
  /** Hidden unless the server enabled this flag. */
  flag?: "jobs";
};

/** The six main destinations (Phase 2 nav model). */
export const primaryNav: NavItem[] = [
  { key: "home", label: "Home", href: "/dashboard", match: ["/dashboard"], tone: "focus" },
  { key: "partners", label: "Find partners", href: "/matching", match: ["/matching", "/users"], tone: "match" },
  { key: "messages", label: "Messages", href: "/chat", match: ["/chat", "/groups", "/channels"], tone: "chat" },
  { key: "jobs", label: "Jobs", href: "/jobs", match: ["/jobs"], tone: "career", flag: "jobs" },
  { key: "focus", label: "Focus", tone: "focus" },
  { key: "profile", label: "Profile", href: "/profile", match: ["/profile"], tone: "live" },
];

export type SecondaryLink = { label: string; href: string };

/** Screens that are still reachable but no longer top-level. */
export const secondaryNav: SecondaryLink[] = [
  { label: "Events", href: "/events" },
  { label: "Scheduling", href: "/scheduling" },
  { label: "Notifications", href: "/notifications" },
  { label: "Bookmarks", href: "/bookmarks" },
  { label: "Study stats", href: "/stats" },
];

/** Items shown in the mobile bottom bar; everything else lives in the "More" sheet. */
export const bottomBarKeys: NavKey[] = ["home", "partners", "messages", "focus"];

export function visiblePrimaryNav(flags: { jobs: boolean }) {
  return primaryNav.filter((item) => !item.flag || flags[item.flag]);
}

export function isPathActive(pathname: string | null | undefined, prefixes: string[] = []) {
  if (!pathname) return false;
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function isSecondaryActive(pathname: string | null | undefined) {
  return secondaryNav.some((link) => isPathActive(pathname, [link.href]));
}

/** Chat conversations and room screens need the full mobile height for the composer. */
export function hidesMobileBar(pathname: string | null | undefined, hasConversationParam: boolean) {
  if (!pathname) return false;
  if (pathname === "/chat" && hasConversationParam) return true;
  if (pathname === "/chat/personal") return true;
  return /^\/(groups|channels)\/[^/]+/.test(pathname);
}

export function formatBadge(count: number) {
  if (count <= 0) return null;
  return count > 9 ? "9+" : String(count);
}
