import React from "react";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Sidebar from "@/app/components/Sidebar";
import NotificationBell from "@/app/components/NotificationBell";
import HeaderProfileMenu from "@/app/components/HeaderProfileMenu";
import ErrorView from "@/app/components/ErrorView";
import EventDateTimePicker from "@/app/components/EventDateTimePicker";
import { cancelEvent, createEvent, rsvpEvent } from "@/app/actions/event";

const rsvpStatuses = ["GOING", "MAYBE", "DECLINED"] as const;

function formatEventRange(startTime: Date, endTime: Date) {
  return `${startTime.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })} - ${endTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

export default async function EventsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        groupMemberships: { include: { group: true } },
        eventRSVPs: true,
      },
    });

    if (!user) redirect("/login");

    const groupIds = user.groupMemberships.map((membership) => membership.groupId);
    const events = await prisma.event.findMany({
      where: {
        OR: [
          { creatorId: user.id },
          { groupId: { in: groupIds } },
          { attendees: { some: { userId: user.id } } },
        ],
      },
      include: {
        group: true,
        creator: { select: { id: true, name: true, image: true } },
        attendees: { select: { userId: true, status: true } },
        _count: { select: { attendees: true } },
      },
      orderBy: { startTime: "asc" },
      take: 60,
    });

    const now = new Date();
    const upcomingEvents = events.filter((event) => event.endTime >= now);
    const todayEvents = upcomingEvents.filter((event) => event.startTime.toDateString() === now.toDateString());
    const hostedEvents = events.filter((event) => event.creatorId === user.id);
    const pastEvents = events.filter((event) => event.endTime < now).slice(-6).reverse();

    return (
      <div className="app-aurora antialiased selection:bg-primary/30 selection:text-on-surface">
        <Sidebar />
        <main className="app-main">
          <header className="app-topbar">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">Academic Calendar</p>
              <h1 className="text-lg font-black text-on-surface">Events</h1>
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
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary">
                    <span className="material-symbols-outlined text-2xl text-white">event</span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-black leading-tight tracking-tight text-on-surface md:text-5xl">Study events</h2>
                    <p className="text-sm text-on-surface-variant">Plan focused sessions and keep your group calendar moving.</p>
                  </div>
                </div>
                <p className="max-w-2xl text-base leading-relaxed text-on-surface-variant md:text-lg">
                  Create personal or group study events, collect RSVP intent, and jump back into the sessions that matter next.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 xl:col-span-5">
                {[
                  { label: "Upcoming", value: upcomingEvents.length, icon: "calendar_month", color: "text-primary" },
                  { label: "Today", value: todayEvents.length, icon: "today", color: "text-tertiary" },
                  { label: "Hosted", value: hostedEvents.length, icon: "verified", color: "text-secondary" },
                ].map((stat) => (
                  <div key={stat.label} className="glass-panel-subtle rounded-[24px] p-4">
                    <span className={`material-symbols-outlined text-xl ${stat.color}`}>{stat.icon}</span>
                    <p className="mt-3 text-2xl font-black text-on-surface">{stat.value}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{stat.label}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
              <div className="glass-panel-subtle rounded-[28px] p-6 md:p-8 lg:col-span-4">
                <h3 className="mb-6 text-xl font-black text-on-surface">Create Event</h3>
                <form action={createEvent} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-black uppercase tracking-widest text-on-surface-variant">Title</label>
                    <input name="title" required maxLength={120} className="app-input px-4 py-3" placeholder="Physics lab review" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-black uppercase tracking-widest text-on-surface-variant">Group</label>
                    <select name="groupId" className="app-input px-4 py-3">
                      <option value="">Personal event</option>
                      {user.groupMemberships.map((membership) => (
                        <option key={membership.groupId} value={membership.groupId}>
                          {membership.group.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <EventDateTimePicker />
                  <div>
                    <label className="mb-1 block text-xs font-black uppercase tracking-widest text-on-surface-variant">Location</label>
                    <input name="location" maxLength={160} className="app-input px-4 py-3" placeholder="Library room, meeting link, or campus spot" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-black uppercase tracking-widest text-on-surface-variant">Notes</label>
                    <textarea name="description" maxLength={500} className="app-input h-24 resize-none px-4 py-3" placeholder="Agenda, prep work, or focus goals" />
                  </div>
                  <button className="app-primary-button flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-black">
                    <span className="material-symbols-outlined text-lg">add</span>
                    Create Event
                  </button>
                </form>
              </div>

              <div className="space-y-6 lg:col-span-8">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-xl font-black text-on-surface">Upcoming Events</h3>
                  <Link href="/scheduling" className="text-xs font-bold text-primary hover:underline">Calendar view</Link>
                </div>

                {upcomingEvents.length === 0 ? (
                  <div className="glass-panel-subtle rounded-[28px] border border-dashed border-primary/25 p-10 text-center">
                    <span className="material-symbols-outlined text-4xl text-primary">event_available</span>
                    <h4 className="mt-4 text-lg font-black text-on-surface">No upcoming events</h4>
                    <p className="mt-2 text-sm text-on-surface-variant">Create your next study event or RSVP through a group.</p>
                  </div>
                ) : (
                  upcomingEvents.map((event) => {
                    const myRsvp = event.attendees.find((attendee) => attendee.userId === user.id)?.status;
                    const canCancel =
                      event.creatorId === user.id ||
                      user.groupMemberships.some((membership) => membership.groupId === event.groupId && membership.role === "ADMIN");

                    return (
                      <article key={event.id} className="glass-panel-subtle glass-interactive rounded-[28px] p-6">
                        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                          <div className="min-w-0">
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
                                {event.group?.name || "Personal"}
                              </span>
                              <span className="rounded-full bg-surface-container px-3 py-1 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                                {myRsvp || "Not RSVP'd"}
                              </span>
                            </div>
                            <h4 className="text-2xl font-black tracking-tight text-on-surface">{event.title}</h4>
                            {event.description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-on-surface-variant">{event.description}</p>}
                            <div className="mt-5 grid gap-3 text-xs font-semibold text-on-surface-variant sm:grid-cols-3">
                              <span className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-base text-primary">schedule</span>
                                {formatEventRange(event.startTime, event.endTime)}
                              </span>
                              <span className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-base text-tertiary">location_on</span>
                                {event.location || "Virtual"}
                              </span>
                              <span className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-base text-secondary">group</span>
                                {event._count.attendees} attendee{event._count.attendees === 1 ? "" : "s"}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 xl:justify-end">
                            {rsvpStatuses.map((status) => (
                              <form key={status} action={rsvpEvent.bind(null, event.id, status)}>
                                <button
                                  className={`rounded-full px-4 py-2 text-xs font-black transition-colors ${
                                    myRsvp === status ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                                  }`}
                                >
                                  {status}
                                </button>
                              </form>
                            ))}
                            {canCancel && (
                              <form action={cancelEvent.bind(null, event.id)}>
                                <button className="rounded-full bg-error-container px-4 py-2 text-xs font-black text-on-error-container">Cancel</button>
                              </form>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}

                {pastEvents.length > 0 && (
                  <section className="space-y-3 pt-4">
                    <h3 className="text-xl font-black text-on-surface">Recently Finished</h3>
                    {pastEvents.map((event) => (
                      <div key={event.id} className="glass-panel-subtle flex items-center justify-between gap-4 rounded-2xl p-4 opacity-80">
                        <div className="min-w-0">
                          <p className="truncate font-bold text-on-surface">{event.title}</p>
                          <p className="text-xs text-on-surface-variant">{formatEventRange(event.startTime, event.endTime)}</p>
                        </div>
                        <span className="shrink-0 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{event.group?.name || "Personal"}</span>
                      </div>
                    ))}
                  </section>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
    );
  } catch (error) {
    console.error("Events Page Error:", error);
    return <ErrorView error={error} />;
  }
}
