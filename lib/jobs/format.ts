const DAY_MS = 24 * 60 * 60 * 1000;

export function deadlineLabel(deadline: Date, now: Date = new Date()) {
  const ms = deadline.getTime() - now.getTime();
  if (ms <= 0) return "Closed";
  const days = Math.ceil(ms / DAY_MS);
  if (days <= 1) return "Closes today";
  if (days <= 14) return `Closes in ${days} days`;
  return `Closes ${deadline.toLocaleDateString([], { month: "short", day: "numeric" })}`;
}

export function isClosingSoon(deadline: Date, now: Date = new Date()) {
  const ms = deadline.getTime() - now.getTime();
  return ms > 0 && ms <= 3 * DAY_MS;
}

export const STATUS_LABELS = {
  PENDING_REVIEW: "Waiting for review",
  LIVE: "Live",
  REJECTED: "Needs changes",
  EXPIRED: "Expired",
  REMOVED: "Removed",
} as const;
