import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/app/components/Sidebar";
import { prisma } from "@/lib/prisma";
import QuickJoinButton from "./QuickJoinButton";
import ErrorView from "@/app/components/ErrorView";
import HeaderProfileMenu from "@/app/components/HeaderProfileMenu";
import NotificationBell from "@/app/components/NotificationBell";
import { getStudyMetrics } from "@/lib/study-metrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ActivityItem = {
  id: string;
  type: "MESSAGE" | "MEMBER";
  title: string;
  description: string;
  time: Date;
};

const cardClass = "bg-[#0E1525]/80 backdrop-blur-md border border-white/5 shadow-xl";
const heatmapColors = ["bg-[#141C30]", "bg-[#7C83FF]/30", "bg-[#7C83FF]/60", "bg-[#7C83FF]", "bg-[#A855F7]"];

function formatHours(hours: number) {
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)}h`;
}

function formatEventDay(date: Date, now: Date) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const eventDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.round((eventDay - today) / 86_400_000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatTimeAgo(date: Date) {
  const diff = Date.now() - date.getTime();
  const mins = Math.max(0, Math.floor(diff / 60000));
  if (mins < 60) return `${mins}m ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

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
      getStudyMetrics(user.id, now),
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

    const kpis = [
      { value: formatHours(metrics.studyHours), label: "Study Hours", icon: "schedule", color: "#A855F7", detail: "Completed time" },
      { value: metrics.completedSessions.toLocaleString(), label: "Sessions", icon: "school", color: "#7C83FF", detail: "Finished" },
      { value: groupIds.length.toLocaleString(), label: "Groups", icon: "group", color: "#22D3EE", detail: "Active memberships" },
      { value: `${attendanceDisplay}%`, label: "Attendance", icon: "verified", color: "#34D399", detail: "RSVP follow-through" },
    ];

    const progressCards = [
      {
        label: "Level Progress",
        value: `${metrics.levelProgressPercent}%`,
        detail: `${metrics.xpForCurrentLevel.toLocaleString()} / ${metrics.xpForNextLevel.toLocaleString()} XP`,
        icon: "military_tech",
        color: "#7C83FF",
        progress: metrics.levelProgressPercent,
      },
      {
        label: "Study Hours",
        value: `${formatHours(metrics.studyHours)} / ${studyHourGoal}h`,
        detail: "Goal progress",
        icon: "timer",
        color: "#22D3EE",
        progress: studyHourProgress,
      },
      {
        label: "Active Days",
        value: `${metrics.activeDaysLast28} / ${activeDayGoal}`,
        detail: "Last 28 days",
        icon: "calendar_month",
        color: "#34D399",
        progress: activeDayProgress,
      },
    ];

    return (
      <div className="bg-[#070B14] text-[#F8FAFC] selection:bg-[#7C83FF]/30 selection:text-[#F8FAFC] flex min-h-screen relative overflow-x-hidden font-sans">
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] h-[70vw] w-[70vw] rounded-full bg-[#A855F7]/15 blur-[120px] mix-blend-screen opacity-60" />
          <div className="absolute bottom-[-10%] left-[-10%] h-[50vw] w-[50vw] rounded-full bg-[#22D3EE]/10 blur-[100px] mix-blend-screen opacity-50" />
          <div className="absolute top-[30%] left-[20%] h-[40vw] w-[40vw] rounded-full bg-[#7C83FF]/10 blur-[90px] mix-blend-screen opacity-40" />
          <div
            className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
            style={{
              backgroundImage:
                'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")',
            }}
          />
        </div>

        <Sidebar />

        <main className="mobile-safe-bottom min-h-screen w-full max-w-full px-4 py-4 relative z-10 md:ml-[280px] md:px-4 md:py-6 md:pr-8">
          <header className="mb-6 flex items-center justify-between gap-3 md:mb-8 md:gap-6">
            <div className="group relative min-w-0 flex-1 md:max-w-xl">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-lg text-[#94A3B8] transition-colors group-focus-within:text-[#7C83FF]">search</span>
              <input
                className="w-full rounded-2xl border border-white/5 bg-[#0E1525]/80 py-3.5 pl-12 pr-12 text-sm text-[#F8FAFC] shadow-[0_4px_20px_rgba(0,0,0,0.2)] outline-none backdrop-blur-md transition-all placeholder:text-[#94A3B8] focus:border-[#7C83FF]/50 focus:ring-1 focus:ring-[#7C83FF]/50"
                placeholder="Search groups, people, messages..."
                type="text"
              />
              <div className="absolute right-4 top-1/2 hidden -translate-y-1/2 items-center gap-1 opacity-50 sm:flex">
                <span className="rounded border border-white/10 bg-[#141C30] px-1.5 py-0.5 font-mono text-[10px] font-bold">Ctrl</span>
                <span className="rounded border border-white/10 bg-[#141C30] px-1.5 py-0.5 font-mono text-[10px] font-bold">K</span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 md:gap-4">
              <Link
                href="/events"
                className="hidden items-center gap-2 rounded-xl border border-white/10 bg-transparent px-4 py-2.5 text-sm font-semibold text-[#F8FAFC] transition-all hover:border-white/20 hover:bg-[#141C30] md:flex"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Create
              </Link>
              <NotificationBell />
              <HeaderProfileMenu userName={userName} imageUrl={user.image} />
            </div>
          </header>

          <div className="space-y-6">
            <section className={`${cardClass} overflow-hidden rounded-[28px] p-6 md:p-8`}>
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                <div>
                  <p className="mb-3 text-[11px] font-black uppercase tracking-[0.24em] text-[#22D3EE]">Welcome Hero</p>
                  <h1 className="text-3xl font-black tracking-tight text-[#F8FAFC] sm:text-4xl md:text-5xl">Good evening, {firstName}</h1>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#94A3B8] md:text-base">
                    Keep your study momentum visible across sessions, groups, streaks, and daily activity.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-[#141C30]/80 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Level</p>
                    <p className="mt-1 text-2xl font-black text-[#F8FAFC]">{metrics.level}</p>
                  </div>
                  <div className="rounded-2xl bg-[#141C30]/80 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">XP</p>
                    <p className="mt-1 text-2xl font-black text-[#F8FAFC]">{metrics.totalXp.toLocaleString()}</p>
                  </div>
                  <div className="rounded-2xl bg-[#141C30]/80 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Next</p>
                    <p className="mt-1 truncate text-sm font-black text-[#F8FAFC]">{upcomingEvents[0]?.title || "Open slot"}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {kpis.map((stat) => (
                <div key={stat.label} className={`${cardClass} rounded-2xl p-5 transition-colors hover:bg-[#141C30]`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-[#94A3B8]">{stat.label}</p>
                      <h2 className="mt-3 text-3xl font-black tracking-tight text-[#F8FAFC]">{stat.value}</h2>
                      <p className="mt-1 truncate text-xs font-medium text-[#94A3B8]">{stat.detail}</p>
                    </div>
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-lg"
                      style={{ background: `linear-gradient(135deg, ${stat.color}33, ${stat.color}11)`, boxShadow: `0 4px 20px ${stat.color}22` }}
                    >
                      <span className="material-symbols-outlined" style={{ color: stat.color, fontVariationSettings: "'FILL' 1" }}>
                        {stat.icon}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </section>

            <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div className={`${cardClass} rounded-[24px] p-5 lg:col-span-4`}>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#7C83FF]">Goal</p>
                    <h2 className="text-base font-black text-[#F8FAFC]">Study Progress</h2>
                  </div>
                  <Link href="/stats" className="text-[11px] font-bold text-[#94A3B8] transition-colors hover:text-[#F8FAFC]">
                    View stats
                  </Link>
                </div>
                <div className="space-y-3">
                  {progressCards.map((progress) => (
                    <div key={progress.label} className="rounded-2xl border border-white/5 bg-[#141C30]/70 p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${progress.color}22` }}>
                          <span className="material-symbols-outlined text-lg" style={{ color: progress.color }}>
                            {progress.icon}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <p className="truncate text-sm font-bold text-[#F8FAFC]">{progress.label}</p>
                            <p className="shrink-0 text-xs font-black text-[#F8FAFC]">{progress.value}</p>
                          </div>
                          <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-[#94A3B8]">{progress.detail}</p>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#0E1525]">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${progress.progress}%`,
                                background: `linear-gradient(90deg, ${progress.color}, #22D3EE)`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`${cardClass} rounded-[24px] p-5 lg:col-span-3`}>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#A855F7]">Streak</p>
                <div className="mt-5 flex items-end gap-3">
                  <span className="material-symbols-outlined text-4xl text-[#A855F7]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    local_fire_department
                  </span>
                  <div>
                    <p className="text-5xl font-black tracking-tight text-[#F8FAFC]">{metrics.currentStreakDays}</p>
                    <p className="text-sm font-bold text-[#94A3B8]">day streak</p>
                  </div>
                </div>
                <div className="mt-6 flex h-14 items-end gap-1.5">
                  {metrics.heatmapDays.slice(-14).map((day) => (
                    <div
                      key={day.date}
                      title={`${day.date}: ${day.activityCount} activities, ${formatHours(day.studyHours)}`}
                      className={`w-full rounded-t-md ${heatmapColors[day.level]}`}
                      style={{ height: `${Math.max(18, day.level * 12 + 12)}px` }}
                    />
                  ))}
                </div>
                <p className="mt-4 text-xs leading-relaxed text-[#94A3B8]">{metrics.activeDaysLast28} active days in the last 28 days.</p>
              </div>

              <div className={`${cardClass} rounded-[24px] p-5 lg:col-span-5`}>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#22D3EE]">Heatmap</p>
                    <h2 className="text-base font-black text-[#F8FAFC]">28-Day Study Heatmap</h2>
                  </div>
                  <span className="rounded-full bg-[#141C30] px-3 py-1 text-[10px] font-bold text-[#94A3B8]">Last 4 weeks</span>
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {metrics.heatmapDays.map((day) => (
                    <div
                      key={day.date}
                      title={`${day.date}: ${day.activityCount} activities, ${formatHours(day.studyHours)}`}
                      className={`aspect-square rounded-[5px] ring-1 ring-white/5 transition-all hover:ring-white/50 ${heatmapColors[day.level]}`}
                    />
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-[9px] font-medium text-[#94A3B8]">
                  Less
                  <div className="flex gap-1">
                    {heatmapColors.map((color) => (
                      <span key={color} className={`h-2.5 w-2.5 rounded-sm ${color}`} />
                    ))}
                  </div>
                  More
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className={`${cardClass} rounded-[28px] p-6`}>
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-base font-bold text-[#F8FAFC]">Upcoming Sessions</h2>
                  <Link href="/events" className="text-[11px] font-bold text-[#7C83FF] hover:underline">
                    View all
                  </Link>
                </div>
                <div className="space-y-3">
                  {upcomingEvents.length === 0 ? (
                    <p className="rounded-2xl bg-[#141C30]/70 p-4 text-sm text-[#94A3B8]">No upcoming sessions are on your calendar.</p>
                  ) : (
                    upcomingEvents.map((event) => (
                      <div key={event.id} className="group flex items-center gap-3 rounded-2xl border border-transparent p-3 transition-colors hover:border-white/5 hover:bg-[#141C30]">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAB308]/15">
                          <span className="material-symbols-outlined text-lg text-[#EAB308]">event</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-bold text-[#F8FAFC]">{event.title}</h3>
                          <p className="truncate text-[11px] text-[#94A3B8]">{event.group?.name || "Personal"} · {event._count.attendees} attending</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-[11px] font-bold text-[#F8FAFC]">{formatEventDay(event.startTime, now)}</p>
                          <p className="text-[10px] text-[#94A3B8]">{event.startTime.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className={`${cardClass} rounded-[28px] p-6`}>
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-base font-bold text-[#F8FAFC]">Joined Groups</h2>
                  <Link href="/groups" className="text-[11px] font-bold text-[#7C83FF] hover:underline">
                    View all
                  </Link>
                </div>
                <div className="space-y-3">
                  {user.groupMemberships.length === 0 ? (
                    <p className="rounded-2xl bg-[#141C30]/70 p-4 text-sm text-[#94A3B8]">Join a group to see it here.</p>
                  ) : (
                    user.groupMemberships.slice(0, 4).map((membership, index) => {
                      const colors = ["#3B82F6", "#EC4899", "#EAB308", "#8B5CF6"];
                      const color = colors[index % colors.length];
                      return (
                        <Link key={membership.id} href={`/groups/${membership.groupId}`} className="flex items-center gap-3 rounded-2xl p-3 transition-colors hover:bg-[#141C30]">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-white shadow-lg" style={{ backgroundColor: color }}>
                            <span className="material-symbols-outlined text-lg">group</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-sm font-bold text-[#F8FAFC]">{membership.group.name}</h3>
                            <p className="text-[10px] text-[#94A3B8]">{membership.group.subject || "Study group"}</p>
                          </div>
                          <span className="material-symbols-outlined text-[18px] text-[#94A3B8]">arrow_forward</span>
                        </Link>
                      );
                    })
                  )}
                </div>
              </div>

              <div className={`${cardClass} rounded-[28px] p-6`}>
                <h2 className="mb-5 text-base font-bold text-[#F8FAFC]">Recent Activity</h2>
                <div className="space-y-4">
                  {activities.length === 0 ? (
                    <p className="rounded-2xl bg-[#141C30]/70 p-4 text-sm text-[#94A3B8]">Recent group activity will appear here.</p>
                  ) : (
                    activities.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="flex gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-[#141C30] to-[#2D3748]">
                          <span className="material-symbols-outlined text-[14px] text-[#7C83FF]">{activity.type === "MESSAGE" ? "chat" : "person_add"}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-[#F8FAFC]">{activity.title}</p>
                          <p className="truncate text-xs text-[#94A3B8]">{activity.description}</p>
                        </div>
                        <span className="shrink-0 text-[10px] font-medium text-[#94A3B8]">{formatTimeAgo(activity.time)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            <section className="mb-8">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-base font-bold text-[#F8FAFC]">Popular Groups</h2>
                <Link href="/groups" className="text-[11px] font-bold text-[#94A3B8] transition-colors hover:text-[#F8FAFC]">
                  View all
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {popularGroups.map((group, index) => {
                  const colors = ["#3B82F6", "#06B6D4", "#EC4899", "#8B5CF6"];
                  const color = colors[index % colors.length];
                  return (
                    <div key={group.id} className={`${cardClass} flex items-center gap-4 rounded-2xl p-4 transition-all hover:border-white/10 hover:bg-[#141C30]`}>
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-lg" style={{ background: `linear-gradient(135deg, ${color}44, ${color}11)` }}>
                        <span className="material-symbols-outlined text-3xl" style={{ color }}>
                          group
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="mb-1 truncate text-sm font-bold text-[#F8FAFC]">{group.name}</h3>
                        <p className="mb-2 truncate text-[10px] text-[#94A3B8]">{group.subject || "Study community"}</p>
                        <div className="flex items-center justify-between gap-2">
                          <Link href={`/groups/${group.id}`} className="text-[10px] font-bold text-[#7C83FF] hover:underline">
                            Open
                          </Link>
                          <QuickJoinButton groupId={group.id} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </main>
      </div>
    );
  } catch (error) {
    console.error("CRITICAL DASHBOARD ERROR:", error);
    return <ErrorView error={error} />;
  }
}
