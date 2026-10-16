import React from "react";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Sidebar from "@/app/components/Sidebar";
import NotificationBell from "@/app/components/NotificationBell";
import HeaderProfileMenu from "@/app/components/HeaderProfileMenu";
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

    return (
      <div className="app-aurora antialiased selection:bg-primary/30 selection:text-on-surface">
        <Sidebar />
        <main className="app-main">
          <header className="app-topbar">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">Learning Analytics</p>
              <h1 className="text-lg font-black text-on-surface">Study Stats</h1>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell />
              <HeaderProfileMenu userName={user.name || "Student"} imageUrl={user.image} />
            </div>
          </header>

          <div className="app-content mx-auto max-w-7xl space-y-10 p-4 md:p-12">
            <section className="grid grid-cols-1 gap-6 xl:grid-cols-12 xl:items-end">
              <div className="xl:col-span-7">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-secondary to-tertiary">
                    <span className="material-symbols-outlined text-2xl text-white">monitoring</span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-black leading-tight tracking-tight text-on-surface md:text-5xl">Study stats</h2>
                    <p className="text-sm text-on-surface-variant">A 30-day view of sessions, momentum, and participation.</p>
                  </div>
                </div>
                <p className="max-w-2xl text-base leading-relaxed text-on-surface-variant md:text-lg">
                  Track the signals that matter: completed study time, active days, collaboration, and what is coming next.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-5 xl:col-span-5">
                {[
                  { label: "Level", value: metrics.level, icon: "military_tech", color: "text-primary" },
                  { label: "Total XP", value: metrics.totalXp.toLocaleString(), icon: "bolt", color: "text-secondary" },
                  { label: "Study Hours", value: formatHours(metrics.studyHours), icon: "schedule", color: "text-tertiary" },
                  { label: "Streak", value: `${metrics.currentStreakDays}d`, icon: "local_fire_department", color: "text-accent-green" },
                  { label: "Messages", value: metrics.totalMessages, icon: "forum", color: "text-primary" },
                ].map((stat) => (
                  <div key={stat.label} className="glass-panel-subtle rounded-[24px] p-4">
                    <span className={`material-symbols-outlined text-xl ${stat.color}`}>{stat.icon}</span>
                    <p className="mt-3 text-2xl font-black text-on-surface">{stat.value}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{stat.label}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="glass-panel-subtle rounded-[28px] p-6 md:p-8 lg:col-span-5">
                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-on-surface">Level Progress</h3>
                    <p className="text-sm text-on-surface-variant">{metrics.levelTitle}</p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-4 py-2 text-sm font-black text-primary">{metrics.levelProgressPercent}%</span>
                </div>
                <div className="flex flex-col gap-8 sm:flex-row sm:items-center">
                  <div className="relative flex h-40 w-40 shrink-0 items-center justify-center">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" stroke="rgba(244,247,251,0.08)" strokeWidth="9" fill="none" />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#7c83ff"
                        strokeWidth="9"
                        fill="none"
                        strokeDasharray="251.2"
                        strokeDashoffset={251.2 - (251.2 * metrics.levelProgressPercent) / 100}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <p className="text-4xl font-black tracking-tight text-on-surface">{metrics.level}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Level</p>
                    </div>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <div className="mb-2 flex justify-between text-xs font-bold text-on-surface-variant">
                        <span>XP this level</span>
                        <span>{metrics.xpForCurrentLevel.toLocaleString()} / {metrics.xpForNextLevel.toLocaleString()}</span>
                      </div>
                      <div className="h-2 rounded-full bg-surface-container">
                        <div className="h-full rounded-full bg-gradient-to-r from-primary to-tertiary" style={{ width: `${metrics.levelProgressPercent}%` }} />
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed text-on-surface-variant">
                      XP is derived from completed sessions, study hours, events, groups, channels, resources, and capped daily messages.
                    </p>
                  </div>
                </div>
              </div>

              <div className="glass-panel-subtle rounded-[28px] p-6 md:p-8 lg:col-span-7">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-xl font-black text-on-surface">28-Day Study Heatmap</h3>
                  <span className="text-xs font-bold text-on-surface-variant">Last 4 weeks</span>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {metrics.heatmapDays.map((day) => {
                    const colors = ["bg-surface-container", "bg-primary/25", "bg-primary/50", "bg-primary", "bg-secondary"];
                    return (
                      <div
                        key={day.date}
                        title={`${day.date}: ${day.activityCount} activities, ${formatHours(day.studyHours)}`}
                        className={`aspect-square rounded-lg ${colors[day.level]} ring-1 ring-white/5`}
                      />
                    );
                  })}
                </div>
                <div className="mt-5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Less
                  <span className="h-3 w-3 rounded bg-surface-container" />
                  <span className="h-3 w-3 rounded bg-primary/25" />
                  <span className="h-3 w-3 rounded bg-primary/50" />
                  <span className="h-3 w-3 rounded bg-primary" />
                  <span className="h-3 w-3 rounded bg-secondary" />
                  More
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="glass-panel-subtle rounded-[28px] p-6 md:p-8">
                <h3 className="text-xl font-black text-on-surface">Subject Focus</h3>
                <div className="mt-6 space-y-4">
                  {metrics.subjectRows.length === 0 ? (
                    <p className="text-sm text-on-surface-variant">Complete RSVP&apos;d study events to build a subject breakdown.</p>
                  ) : (
                    metrics.subjectRows.map(({ subject, hours }) => {
                      const width = metrics.studyHours > 0 ? Math.max(8, Math.round((hours / metrics.studyHours) * 100)) : 0;
                      return (
                        <div key={subject}>
                          <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                            <span className="font-bold text-on-surface">{subject}</span>
                            <span className="font-black text-primary">{formatHours(Math.round(hours * 10) / 10)}</span>
                          </div>
                          <div className="h-2 rounded-full bg-surface-container">
                            <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${width}%` }} />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="glass-panel-subtle rounded-[28px] p-6 md:p-8">
                <h3 className="text-xl font-black text-on-surface">Next Sessions</h3>
                <div className="mt-6 space-y-3">
                  {upcomingEvents.length === 0 ? (
                    <p className="text-sm text-on-surface-variant">No upcoming sessions are on your calendar.</p>
                  ) : (
                    upcomingEvents.map((event) => (
                      <div key={event.id} className="flex items-center justify-between gap-4 rounded-2xl bg-surface-container/60 p-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-on-surface">{event.title}</p>
                          <p className="text-xs text-on-surface-variant">{event.group?.name || "Personal"} · {event.startTime.toLocaleString()}</p>
                        </div>
                        <span className="material-symbols-outlined shrink-0 text-primary">arrow_forward</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    );
  } catch (error) {
    console.error("Study Stats Page Error:", error);
    return <ErrorView error={error} />;
  }
}
