import { prisma } from "@/lib/prisma";
import { handle, ok, requireUserId } from "@/lib/mobile/http";
import { listEvents, parseTzOffset, studyStats, unreadMessageCount } from "@/lib/mobile/activity";
import { listGroups } from "@/lib/mobile/groups";
import { listPartners } from "@/lib/mobile/people";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Everything on the Home tab in one request. Pass ?tz=<minutes> (JavaScript-style UTC offset). */
export async function GET(request: Request) {
  return handle(async () => {
    const userId = await requireUserId();
    const tz = parseTzOffset(new URL(request.url).searchParams.get("tz"));
    const [user, stats, events, partners, groups, unreadNotifications, unreadMessages] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { name: true, image: true } }),
      studyStats(userId, tz),
      listEvents(userId, { upcomingOnly: true, take: 10 }),
      listPartners(userId, "", 12),
      listGroups(userId),
      prisma.notification.count({ where: { userId, read: false } }),
      unreadMessageCount(userId),
    ]);

    return ok({
      name: user?.name ?? null,
      image: user?.image ?? null,
      focus: { todayMinutes: stats.today.focusMinutes, sessionsToday: stats.today.sessions, streakDays: stats.streakDays },
      nextEvent: events.find((event) => event.myStatus === "GOING") ?? events[0] ?? null,
      partners: partners.filter((partner) => partner.connection?.status !== "ACCEPTED").slice(0, 3),
      groups: groups.mine.slice(0, 3),
      unread: { notifications: unreadNotifications, messages: unreadMessages },
    });
  });
}
