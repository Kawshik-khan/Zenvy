import React from "react";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/shell/AppHeader";
import { Badge, Card, ProgressBar, StatTile } from "@/components/ui";
import { Heatmap } from "../dashboard/Heatmap";
import ErrorView from "@/app/components/ErrorView";
import { getStudyMetrics } from "@/lib/study-metrics";

function formatHours(hours: number) {
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)}h`;
}

export default async function StudyStatsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { groupMemberships: { include: { group: true } } },
    });

    if (!user) redirect("/login");

    const now = new Date();
    const groupIds = user.groupMemberships.map((membership) => membership.groupId);

    const [metrics, upcomingEvents] = await Promise.all([
      getStudyMetrics(user.id, now),
      prisma.event.findMany({
        where: {
          startTime: { gte: now },
          OR: [{ creatorId: user.id }, { groupId: { in: groupIds } }, { attendees: { some: { userId: user.id } } }],
        },
        orderBy: { startTime: "asc" },
        take: 5,
        include: { group: true },
      }),
    ]);

    const circumference = 251.2;

    return (
      <div className="min-h-dvh bg-canvas font-grotesk text-fg">
        <AppHeader />

        <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-6 pb-28 md:px-8 md:pb-10">
          <section aria-labelledby="stats-title" className="flex flex-col gap-6">
            <div className="flex max-w-2xl flex-col gap-2">
              <h1 id="stats-title" className="m-0 text-4xl leading-[1.05] font-bold tracking-tight md:text-5xl">
                Study stats
              </h1>
              <p className="m-0 text-lg text-fg-muted">Sessions, momentum and participation over the last 28 days.</p>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
              <StatTile label="Level" value={metrics.level} tone="focus" />
              <StatTile label="Total XP" value={metrics.totalXp.toLocaleString()} />
              <StatTile label="Study hours" value={formatHours(metrics.studyHours)} tone="chat" />
              <StatTile label="Streak" value={`${metrics.currentStreakDays}d`} tone="live" />
              <StatTile label="Messages" value={metrics.totalMessages} tone="match" />
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <Card tone="card" shadow="md" className="lg:col-span-5">
              <div className="mb-6 flex items-center justify-between gap-3">
                <div>
                  <h2 className="m-0 text-2xl font-bold">Level progress</h2>
                  <p className="m-0 text-fg-muted">{metrics.levelTitle}</p>
                </div>
                <Badge tone="focus">{metrics.levelProgressPercent}%</Badge>
              </div>
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                <div className="relative flex size-40 shrink-0 items-center justify-center">
                  <svg aria-hidden="true" className="size-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" strokeWidth="11" fill="none" className="stroke-heat-0" />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      strokeWidth="11"
                      fill="none"
                      className="stroke-focus"
                      strokeDasharray={circumference}
                      strokeDashoffset={circumference - (circumference * metrics.levelProgressPercent) / 100}
                      strokeLinecap="butt"
                    />
                    <circle cx="50" cy="50" r="45.5" strokeWidth="1.5" fill="none" className="stroke-line" />
                    <circle cx="50" cy="50" r="34.5" strokeWidth="1.5" fill="none" className="stroke-line" />
                  </svg>
                  <div className="absolute text-center">
                    <p className="m-0 font-jetbrains text-4xl font-bold">{metrics.level}</p>
                    <p className="m-0 text-xs font-bold tracking-wide uppercase">Level</p>
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <p className="m-0 flex justify-between text-sm font-bold">
                      <span>XP this level</span>
                      <span>
                        {metrics.xpForCurrentLevel.toLocaleString()} / {metrics.xpForNextLevel.toLocaleString()}
                      </span>
                    </p>
                    <ProgressBar value={metrics.levelProgressPercent} label="Progress to next level" />
                  </div>
                  <p className="m-0 text-[15px] text-fg-muted">
                    XP comes from completed sessions, study hours, events, groups, channels, resources and capped daily messages.
                  </p>
                </div>
              </div>
            </Card>

            <Card tone="card" shadow="md" className="lg:col-span-7">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="m-0 text-2xl font-bold">28-day study heatmap</h2>
                <span className="text-sm font-bold text-fg-muted">Last 4 weeks</span>
              </div>
              <Heatmap days={metrics.heatmapDays} summary={`Study activity for the last 28 days: ${metrics.activeDaysLast28} active days.`} />
            </Card>
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card tone="card" shadow="md">
              <h2 className="m-0 mb-5 text-2xl font-bold">Subject focus</h2>
              {metrics.subjectRows.length === 0 ? (
                <p className="m-0 text-fg-muted">Complete RSVP&apos;d study events to build a subject breakdown.</p>
              ) : (
                <ul className="m-0 flex list-none flex-col gap-4 p-0">
                  {metrics.subjectRows.map(({ subject, hours }) => {
                    const rounded = Math.round(hours * 10) / 10;
                    return (
                      <li key={subject} className="flex flex-col gap-2">
                        <p className="m-0 flex items-center justify-between gap-4 font-bold">
                          <span>{subject}</span>
                          <span className="font-jetbrains">{formatHours(rounded)}</span>
                        </p>
                        <ProgressBar value={hours} max={metrics.studyHours || 1} label={`${subject} share of study time`} tone="chat" />
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            <Card tone="card" shadow="md">
              <h2 className="m-0 mb-5 text-2xl font-bold">Next sessions</h2>
              {upcomingEvents.length === 0 ? (
                <p className="m-0 text-fg-muted">No upcoming sessions are on your calendar.</p>
              ) : (
                <ul className="m-0 flex list-none flex-col gap-3 p-0">
                  {upcomingEvents.map((event) => (
                    <li key={event.id} className="rounded-nb border-2 border-line bg-canvas p-3">
                      <p className="m-0 truncate font-bold">{event.title}</p>
                      <p className="m-0 text-sm text-fg-muted">
                        {event.group?.name || "Personal"} · {event.startTime.toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </section>
        </main>
      </div>
    );
  } catch (error) {
    console.error("Study Stats Page Error:", error);
    return <ErrorView error={error} />;
  }
}
