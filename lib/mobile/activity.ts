import { prisma } from "@/lib/prisma";
import { getCachedStudyMetrics } from "@/lib/study-metrics-cache";
import { iso } from "@/lib/mobile/http";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Start of the viewer's local day. The app sends its UTC offset in minutes (as JavaScript's
 * getTimezoneOffset does, so UTC+6 is -360); without it the day is the UTC day.
 */
export function startOfLocalDay(now: Date, tzOffsetMinutes = 0) {
  const local = new Date(now.getTime() - tzOffsetMinutes * 60000);
  const midnightLocalAsUtc = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
  return new Date(midnightLocalAsUtc + tzOffsetMinutes * 60000);
}

export function parseTzOffset(value: string | null) {
  const n = Number(value);
  return Number.isFinite(n) && Math.abs(n) <= 14 * 60 ? n : 0;
}

/** Focus minutes and sessions per local day for the last [days] days, oldest first. */
export async function focusByDay(userId: string, days: number, tzOffsetMinutes: number, now = new Date()) {
  const today = startOfLocalDay(now, tzOffsetMinutes);
  const from = new Date(today.getTime() - (days - 1) * DAY_MS);
  const sessions = await prisma.pomodoroSession.findMany({
    where: { userId, mode: "FOCUS", endedAt: { gte: from } },
    select: { completedMinutes: true, endedAt: true },
  });
  const buckets = Array.from({ length: days }, (_, index) => ({
    date: new Date(from.getTime() + index * DAY_MS).toISOString(),
    minutes: 0,
    sessions: 0,
  }));
  for (const session of sessions) {
    const index = Math.floor((session.endedAt.getTime() - from.getTime()) / DAY_MS);
    if (index >= 0 && index < days) {
      buckets[index].minutes += session.completedMinutes;
      buckets[index].sessions += 1;
    }
  }
  return buckets;
}

/** Everything the Stats screen and the Home focus card need. */
export async function studyStats(userId: string, tzOffsetMinutes: number) {
  const now = new Date();
  const [metrics, days, allTime] = await Promise.all([
    getCachedStudyMetrics(userId, now),
    focusByDay(userId, 28, tzOffsetMinutes, now),
    prisma.pomodoroSession.aggregate({
      where: { userId, mode: "FOCUS" },
      _sum: { completedMinutes: true },
      _count: true,
    }),
  ]);

  const sum = (list: typeof days) => list.reduce((acc, day) => ({ minutes: acc.minutes + day.minutes, sessions: acc.sessions + day.sessions }), { minutes: 0, sessions: 0 });
  const week = sum(days.slice(-7));
  const month = sum(days);
  const today = days[days.length - 1];
  const heatLevel = (minutes: number) => (minutes <= 0 ? 0 : minutes < 30 ? 1 : minutes < 60 ? 2 : minutes < 120 ? 3 : 4);

  return {
    today: { focusMinutes: today.minutes, sessions: today.sessions },
    level: metrics.level,
    levelTitle: metrics.levelTitle,
    levelProgress: metrics.levelProgressPercent / 100,
    xpToNextLevel: Math.max(0, metrics.xpForNextLevel - metrics.xpForCurrentLevel),
    totalXp: metrics.totalXp,
    streakDays: metrics.currentStreakDays,
    activeDaysLast28: metrics.activeDaysLast28,
    attendanceRate: metrics.attendanceRate,
    studyHours: metrics.studyHours,
    periods: {
      week: { focusMinutes: week.minutes, sessions: week.sessions },
      month: { focusMinutes: month.minutes, sessions: month.sessions },
      all: { focusMinutes: allTime._sum.completedMinutes ?? 0, sessions: allTime._count },
    },
    lastSevenDays: days.slice(-7).map((day) => ({ date: day.date, minutes: day.minutes })),
    heatmap: days.map((day) => ({ date: day.date, minutes: day.minutes, level: heatLevel(day.minutes) })),
    groupsJoined: metrics.groupsJoined,
  };
}

/** Unread direct messages across the viewer's conversations (same rule as /api/conversations/unread). */
export async function unreadMessageCount(userId: string) {
  const [row] = await prisma.$queryRaw<Array<{ unreadCount: bigint | number }>>`
    SELECT COUNT(*) AS "unreadCount"
    FROM "ConversationMessage" message
    INNER JOIN "ConversationParticipant" participant
      ON participant."conversationId" = message."conversationId"
     AND participant."userId" = ${userId}
    WHERE participant."archived" = false
      AND message."senderId" <> ${userId}
      AND message."status" <> 'DELETED'
      AND message."createdAt" > COALESCE(participant."lastReadAt", to_timestamp(0))
  `;
  return Number(row?.unreadCount || 0);
}

export type EventSummary = Awaited<ReturnType<typeof listEvents>>[number];

/** Events the viewer created, RSVP'd to, or that belong to their groups. */
export async function listEvents(userId: string, options: { upcomingOnly?: boolean; take?: number; groupId?: string } = {}) {
  const memberships = await prisma.groupMember.findMany({ where: { userId }, select: { groupId: true } });
  const groupIds = memberships.map((membership) => membership.groupId);
  const now = new Date();
  const events = await prisma.event.findMany({
    where: {
      ...(options.upcomingOnly ? { endTime: { gte: now } } : {}),
      ...(options.groupId
        ? { groupId: options.groupId }
        : { OR: [{ creatorId: userId }, { groupId: { in: groupIds } }, { attendees: { some: { userId } } }] }),
    },
    include: {
      group: { select: { id: true, name: true } },
      creator: { select: { id: true, name: true } },
      attendees: {
        where: { status: "GOING" },
        select: { userId: true, user: { select: { id: true, name: true, image: true } } },
      },
    },
    orderBy: { startTime: "asc" },
    take: options.take ?? 100,
  });
  const mine = await prisma.eventAttendee.findMany({
    where: { userId, eventId: { in: events.map((event) => event.id) } },
    select: { eventId: true, status: true },
  });
  const myStatus = new Map(mine.map((row) => [row.eventId, row.status]));
  const adminGroups = new Set(
    (await prisma.groupMember.findMany({ where: { userId, role: { in: ["ADMIN", "CREATOR"] } }, select: { groupId: true } })).map((row) => row.groupId),
  );

  return events.map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    startTime: iso(event.startTime)!,
    endTime: iso(event.endTime)!,
    location: event.location,
    type: event.type,
    group: event.group,
    creator: event.creator,
    goingCount: event.attendees.length,
    going: event.attendees.slice(0, 4).map((attendee) => attendee.user),
    myStatus: myStatus.get(event.id) ?? null,
    canCancel: event.creatorId === userId || (event.groupId ? adminGroups.has(event.groupId) : false),
  }));
}
