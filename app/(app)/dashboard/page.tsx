import { BadgeCheck, CalendarDays, Clock, Flame, GraduationCap, Plus, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import ErrorView from "@/app/components/ErrorView";
import { AppHeader } from "@/components/shell/AppHeader";
import { Avatar, ButtonLink, Card, CardHeader, EmptyState, ProgressBar, StatTile } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { getCachedStudyMetrics } from "@/lib/study-metrics-cache";
import { formatEventDay, formatHours, formatTimeAgo } from "./format";
import { Heatmap, StreakBars } from "./Heatmap";
import QuickJoinButton from "./QuickJoinButton";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ActivityItem = {
  id: string;
  type: "MESSAGE" | "MEMBER";
  title: string;
  description: string;
  time: Date;
};

export default async function DashboardPage() {
  let session;
  try {
    session = await auth();
  } catch (error) {
    console.error("AUTH INITIALIZATION ERROR:", error);
    return (
      <ErrorView
        error={error}
        title="Authentication Failure"
        message="The authentication system failed to initialize. Please ensure you have added the AUTH_SECRET environment variable to your Vercel project settings."
      />
    );
  }

  if (!session?.user?.email) {
    redirect("/login");
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        groupMemberships: {
          include: { group: true },
        },
        eventRSVPs: true,
      },
    });

    if (!user) {
      console.error("Dashboard: User session exists but DB user not found:", session.user.email);
      redirect("/login");
    }

    const now = new Date();
    const groupIds = user.groupMemberships.map((membership) => membership.groupId);
    const [metrics, upcomingEvents, recentMessages, newMembers, popularGroups] = await Promise.all([
      getCachedStudyMetrics(user.id, now),
      prisma.event.findMany({
        where: {
          startTime: { gte: now },
          OR: [{ creatorId: user.id }, { groupId: { in: groupIds } }, { attendees: { some: { userId: user.id } } }],
        },
        include: {
          group: true,
          _count: { select: { attendees: true } },
        },
        orderBy: { startTime: "asc" },
        take: 3,
      }),
      prisma.groupMessage.findMany({
        where: { groupId: { in: groupIds }, NOT: { senderId: user.id } },
        take: 3,
        orderBy: { createdAt: "desc" },
        include: { sender: true, group: true },
      }),
      prisma.groupMember.findMany({
        where: { groupId: { in: groupIds }, NOT: { userId: user.id } },
        take: 2,
        orderBy: { joinedAt: "desc" },
        include: { user: true, group: true },
      }),
      prisma.studyGroup.findMany({
        where: {
          members: {
            none: { userId: user.id },
          },
        },
        take: 4,
        orderBy: { members: { _count: "desc" } },
      }),
    ]);

    const activities: ActivityItem[] = [
      ...recentMessages.map((message) => ({
        id: message.id,
        type: "MESSAGE" as const,
        title: "New message",
        description: `${message.sender.name || "Someone"} in ${message.group.name}`,
        time: message.createdAt,
      })),
      ...newMembers.map((membership) => ({
        id: membership.id,
        type: "MEMBER" as const,
        title: "New study partner",
        description: `${membership.user.name || "Someone"} joined ${membership.group.name}`,
        time: membership.joinedAt,
      })),
    ].sort((a, b) => b.time.getTime() - a.time.getTime());

    const userName = user.name || "Scholar";
    const firstName = userName.split(" ")[0] || "Scholar";
    const studyHourGoal = Math.max(50, Math.ceil(metrics.studyHours / 10) * 10 || 50);
    const studyHourProgress = Math.min(100, Math.round((metrics.studyHours / studyHourGoal) * 100));
    const activeDayGoal = 20;
    const activeDayProgress = Math.min(100, Math.round((metrics.activeDaysLast28 / activeDayGoal) * 100));
    const attendanceDisplay = metrics.attendanceRate > 0 ? metrics.attendanceRate : 100;

    const progressCards = [
      {
        label: "Level progress",
        value: `${metrics.levelProgressPercent}%`,
        detail: `${metrics.xpForCurrentLevel.toLocaleString()} / ${metrics.xpForNextLevel.toLocaleString()} XP`,
        progress: metrics.levelProgressPercent,
      },
      {
        label: "Study hours",
        value: `${formatHours(metrics.studyHours)} / ${studyHourGoal}h`,
        detail: "Goal progress",
        progress: studyHourProgress,
      },
      {
        label: "Active days",
        value: `${metrics.activeDaysLast28} / ${activeDayGoal}`,
        detail: "Last 28 days",
        progress: activeDayProgress,
      },
    ];

    const today = now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

    return (
      <div className="min-h-dvh bg-canvas font-grotesk text-fg">
        <AppHeader
          actions={
            <div className="hidden md:block">
              <ButtonLink href="/events" variant="secondary" icon={<Plus size={18} />}>
                Create
              </ButtonLink>
            </div>
          }
        />

        <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-6 pb-28 md:px-8 md:pb-10">
          <section aria-labelledby="dash-hero" className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="flex flex-col gap-2">
              <p className="m-0 text-[15px] font-medium text-fg-muted">{today}</p>
              <h1 id="dash-hero" className="m-0 text-4xl leading-[1.05] font-bold tracking-tight md:text-5xl">
                Hey {firstName}, ready to study?
              </h1>
            </div>
            <dl className="m-0 grid grid-cols-3 gap-3">
              <Card padding="sm" shadow="sm">
                <dt className="text-xs font-bold tracking-[0.08em] uppercase text-fg-muted">Level</dt>
                <dd className="m-0 mt-1 font-jetbrains text-2xl font-bold">{metrics.level}</dd>
              </Card>
              <Card padding="sm" shadow="sm">
                <dt className="text-xs font-bold tracking-[0.08em] uppercase text-fg-muted">XP</dt>
                <dd className="m-0 mt-1 font-jetbrains text-2xl font-bold">{metrics.totalXp.toLocaleString()}</dd>
              </Card>
              <Card padding="sm" shadow="sm" tone="focus">
                <dt className="text-xs font-bold tracking-[0.08em] uppercase">Next up</dt>
                <dd className="m-0 mt-1 truncate text-base font-bold">{upcomingEvents[0]?.title || "Open slot"}</dd>
              </Card>
            </dl>
          </section>

          <section aria-label="Study summary" className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile label="Study hours" value={formatHours(metrics.studyHours)} detail="Completed time" tone="focus" icon={<Clock size={20} />} />
            <StatTile label="Sessions" value={metrics.completedSessions.toLocaleString()} detail="Finished" icon={<GraduationCap size={20} />} />
            <StatTile label="Groups" value={groupIds.length.toLocaleString()} detail="Active memberships" tone="chat" icon={<Users size={20} />} />
            <StatTile label="Attendance" value={`${attendanceDisplay}%`} detail="RSVP follow-through" tone="live" icon={<BadgeCheck size={20} />} />
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <Card padding="none" className="lg:col-span-5">
              <CardHeader
                title="Study progress"
                tone="focus"
                action={
                  <ButtonLink href="/stats" variant="secondary" size="sm">
                    View stats
                  </ButtonLink>
                }
              />
              <ul className="m-0 flex list-none flex-col gap-5 p-5">
                {progressCards.map((progress) => (
                  <li key={progress.label} className="flex flex-col gap-2">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-bold">{progress.label}</span>
                      <span className="font-jetbrains font-bold">{progress.value}</span>
                    </div>
                    <ProgressBar label={progress.label} value={progress.progress} />
                    <span className="text-sm text-fg-muted">{progress.detail}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card tone="focus" className="flex flex-col gap-4 lg:col-span-3">
              <h2 className="m-0 text-sm font-bold tracking-[0.08em] uppercase">Streak</h2>
              <div className="flex items-end gap-3">
                <Flame aria-hidden="true" size={40} />
                <div>
                  <p className="m-0 font-jetbrains text-6xl leading-none font-bold">{metrics.currentStreakDays}</p>
                  <p className="m-0 font-bold">day streak</p>
                </div>
              </div>
              <StreakBars days={metrics.heatmapDays.slice(-14)} />
              <p className="m-0 text-sm">{metrics.activeDaysLast28} active days in the last 28 days.</p>
            </Card>

            <Card className="flex flex-col gap-4 lg:col-span-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="m-0 text-xl font-bold">28-day activity</h2>
                <span className="rounded-full border-2 border-line px-3 py-0.5 text-xs font-bold whitespace-nowrap">Last 4 weeks</span>
              </div>
              <Heatmap days={metrics.heatmapDays} summary={`Study activity for the last 28 days: ${metrics.activeDaysLast28} active days.`} />
            </Card>
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card padding="none">
              <CardHeader
                title="Upcoming sessions"
                tone="chat"
                action={
                  <ButtonLink href="/events" variant="secondary" size="sm">
                    View all
                  </ButtonLink>
                }
              />
              {upcomingEvents.length === 0 ? (
                <div className="p-4">
                  <EmptyState title="Nothing scheduled" description="Sessions you create or RSVP to will show up here." className="py-6" />
                </div>
              ) : (
                <ul className="m-0 flex list-none flex-col p-0">
                  {upcomingEvents.map((event) => (
                    <li key={event.id} className="flex items-center gap-3 border-b-2 border-line px-5 py-4 last:border-b-0">
                      <span aria-hidden="true" className="inline-flex size-10 shrink-0 items-center justify-center rounded-nb border-nb bg-focus text-ink">
                        <CalendarDays size={18} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="m-0 truncate text-base font-bold">{event.title}</h3>
                        <p className="m-0 truncate text-sm text-fg-muted">
                          {event.group?.name || "Personal"} · {event._count.attendees} attending
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="m-0 text-sm font-bold">{formatEventDay(event.startTime, now)}</p>
                        <p className="m-0 font-jetbrains text-xs text-fg-muted">
                          {event.startTime.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card padding="none">
              <CardHeader
                title="Joined groups"
                tone="live"
                action={
                  <ButtonLink href="/groups" variant="secondary" size="sm">
                    View all
                  </ButtonLink>
                }
              />
              {user.groupMemberships.length === 0 ? (
                <div className="p-4">
                  <EmptyState title="No groups yet" description="Join a group from Popular groups below." className="py-6" />
                </div>
              ) : (
                <ul className="m-0 flex list-none flex-col p-0">
                  {user.groupMemberships.slice(0, 4).map((membership) => (
                    <li key={membership.id} className="border-b-2 border-line last:border-b-0">
                      <Link href={`/groups/${membership.groupId}`} className="nb-focus flex items-center gap-3 px-5 py-4 text-fg no-underline hover:bg-canvas">
                        <Avatar name={membership.group.name} shape="square" size="md" />
                        <div className="min-w-0 flex-1">
                          <h3 className="m-0 truncate text-base font-bold">{membership.group.name}</h3>
                          <p className="m-0 truncate text-sm text-fg-muted">{membership.group.subject || "Study group"}</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card padding="none">
              <CardHeader title="Recent activity" />
              {activities.length === 0 ? (
                <div className="p-4">
                  <EmptyState title="Quiet for now" description="Messages and new members in your groups will appear here." className="py-6" />
                </div>
              ) : (
                <ul className="m-0 flex list-none flex-col p-0">
                  {activities.slice(0, 5).map((activity) => (
                    <li key={activity.id} className="flex items-start gap-3 border-b-2 border-line px-5 py-3.5 last:border-b-0">
                      <div className="min-w-0 flex-1">
                        <p className="m-0 font-bold">{activity.title}</p>
                        <p className="m-0 truncate text-sm text-fg-muted">{activity.description}</p>
                      </div>
                      <span className="shrink-0 font-jetbrains text-xs text-fg-muted">{formatTimeAgo(activity.time)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </section>

          <section aria-labelledby="popular-groups" className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <h2 id="popular-groups" className="m-0 text-2xl font-bold">
                Popular groups
              </h2>
              <ButtonLink href="/groups" variant="secondary" size="sm">
                View all
              </ButtonLink>
            </div>

            {popularGroups.length === 0 ? (
              <EmptyState title="No groups to suggest" description="You have joined every group, or none exist yet." />
            ) : (
              <ul className="m-0 grid list-none grid-cols-1 gap-5 p-0 md:grid-cols-2 lg:grid-cols-4">
                {popularGroups.map((group) => (
                  <li key={group.id}>
                    <Card padding="sm" className="flex h-full flex-col gap-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={group.name} shape="square" size="lg" />
                        <div className="min-w-0">
                          <h3 className="m-0 truncate text-base font-bold">{group.name}</h3>
                          <p className="m-0 truncate text-sm text-fg-muted">{group.subject || "Study community"}</p>
                        </div>
                      </div>
                      <div className="mt-auto flex items-center justify-between gap-2">
                        <ButtonLink href={`/groups/${group.id}`} variant="secondary" size="sm">
                          Open
                        </ButtonLink>
                        <QuickJoinButton groupId={group.id} groupName={group.name} />
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </main>
      </div>
    );
  } catch (error) {
    console.error("CRITICAL DASHBOARD ERROR:", error);
    return <ErrorView error={error} />;
  }
}
