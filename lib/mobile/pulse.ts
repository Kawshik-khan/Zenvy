import { prisma } from "@/lib/prisma";
import { iso } from "@/lib/mobile/http";
import { listConnections } from "@/lib/mobile/people";

const DAY_MS = 24 * 60 * 60 * 1000;

/** A focus session that ended this recently still counts as "studying now". */
const RECENT_FOCUS_MS = 30 * 60 * 1000;

export type LivePerson = {
  user: { id: string; name: string; image: string | null };
  /** CALL: in a live call in one of the viewer's groups. FOCUS: finished a focus session in the last 30 minutes. */
  kind: "CALL" | "FOCUS";
  groupId: string | null;
  groupName: string | null;
  minutes: number | null;
  at: string | null;
};

/**
 * The live side of Home: who in the viewer's circle (accepted partners and groupmates) is studying
 * right now, how busy each of the viewer's groups is, and the viewer's own focus blocks today.
 * Only group calls are shown; direct calls stay private.
 */
export async function homePulse(userId: string, groupIds: string[], dayStart: Date, now = new Date()) {
  const weekAgo = new Date(now.getTime() - 7 * DAY_MS);
  const [partners, groupmates, calls, groupMessages, todayFocus] = await Promise.all([
    listConnections(userId),
    prisma.groupMember.findMany({ where: { groupId: { in: groupIds }, userId: { not: userId } }, select: { userId: true } }),
    prisma.callSession.findMany({
      where: { status: "ACTIVE", groupId: { in: groupIds } },
      select: {
        groupId: true,
        participants: {
          where: { status: "JOINED", userId: { not: userId } },
          select: { joinedAt: true, user: { select: { id: true, name: true, image: true } } },
        },
      },
    }),
    prisma.groupMessage.groupBy({ by: ["groupId"], where: { groupId: { in: groupIds }, createdAt: { gte: weekAgo } }, _count: { _all: true } }),
    prisma.pomodoroSession.findMany({
      where: { userId, mode: "FOCUS", endedAt: { gte: dayStart } },
      select: { startedAt: true, endedAt: true, completedMinutes: true },
      orderBy: { startedAt: "asc" },
    }),
  ]);

  const circle = [...new Set([...partners.map((partner) => partner.id), ...groupmates.map((member) => member.userId)])];
  const groups = await prisma.studyGroup.findMany({ where: { id: { in: groupIds } }, select: { id: true, name: true } });
  const groupName = new Map(groups.map((group) => [group.id, group.name]));

  const live = new Map<string, LivePerson>();
  for (const call of calls) {
    for (const participant of call.participants) {
      live.set(participant.user.id, {
        user: { id: participant.user.id, name: participant.user.name || "Zenvy student", image: participant.user.image },
        kind: "CALL",
        groupId: call.groupId,
        groupName: call.groupId ? groupName.get(call.groupId) ?? null : null,
        minutes: Math.max(0, Math.round((now.getTime() - participant.joinedAt.getTime()) / 60000)),
        at: iso(participant.joinedAt),
      });
    }
  }

  const recentFocus = await prisma.pomodoroSession.findMany({
    where: { userId: { in: circle }, mode: "FOCUS", endedAt: { gte: new Date(now.getTime() - RECENT_FOCUS_MS) } },
    select: { completedMinutes: true, endedAt: true, user: { select: { id: true, name: true, image: true } } },
    orderBy: { endedAt: "desc" },
  });
  for (const session of recentFocus) {
    if (live.has(session.user.id)) continue;
    live.set(session.user.id, {
      user: { id: session.user.id, name: session.user.name || "Zenvy student", image: session.user.image },
      kind: "FOCUS",
      groupId: null,
      groupName: null,
      minutes: session.completedMinutes,
      at: iso(session.endedAt),
    });
  }

  const messages = new Map(groupMessages.map((row) => [row.groupId, row._count._all]));
  const liveGroups = new Set(calls.filter((call) => call.participants.length > 0).map((call) => call.groupId));

  return {
    studyingNow: [...live.values()].slice(0, 12),
    groupActivity: groupIds.map((id) => ({ groupId: id, messagesThisWeek: messages.get(id) ?? 0, live: liveGroups.has(id) })),
    todayFocus: todayFocus.map((session) => ({ startedAt: iso(session.startedAt), endedAt: iso(session.endedAt), minutes: session.completedMinutes })),
  };
}
