import React from "react";
export const runtime = "nodejs";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Sidebar from "@/app/components/Sidebar";
import NotificationBell from "@/app/components/NotificationBell";
import EventDateTimePicker from "@/app/components/EventDateTimePicker";
import { cancelEvent, createEvent, rsvpEvent } from "@/app/actions/event";

export default async function SchedulingPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

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
      creator: { select: { id: true, name: true } },
      attendees: { select: { userId: true, status: true } },
      _count: { select: { attendees: true } },
    },
    orderBy: { startTime: "asc" },
    take: 50,
  });

  const now = new Date();
  const upcomingEvents = events.filter((event) => event.endTime >= now);
  const pastEvents = events.filter((event) => event.endTime < now).slice(-5).reverse();

  return (
    <div className="app-aurora antialiased">
      <Sidebar />
      <main className="app-main">
        <header className="app-topbar">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Academic Calendar</p>
            <h1 className="text-lg font-black">Scheduling</h1>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <img
              alt=""
              className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/10"
              src={user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "U")}&background=random`}
            />
          </div>
        </header>

        <div className="p-4 md:p-12 max-w-7xl mx-auto space-y-10">
          <section className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <h2 className="text-3xl md:text-5xl font-black tracking-tighter">Your Academic Calendar</h2>
              <p className="text-on-surface-variant mt-2 text-base md:text-lg">
                Schedule study sessions, attach them to groups, and track RSVPs.
              </p>
            </div>
          <div className="grid grid-cols-3 gap-3 min-w-[260px]">
              <div className="glass-panel-subtle rounded-2xl p-4 text-center">
                <p className="text-2xl font-black text-primary">{upcomingEvents.length}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Upcoming</p>
              </div>
              <div className="glass-panel-subtle rounded-2xl p-4 text-center">
                <p className="text-2xl font-black text-secondary">{groupIds.length}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Groups</p>
              </div>
              <div className="glass-panel-subtle rounded-2xl p-4 text-center">
                <p className="text-2xl font-black text-tertiary">{user.eventRSVPs.length}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">RSVPs</p>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <section className="lg:col-span-4 glass-panel-subtle rounded-[28px] p-6 md:p-8">
              <h3 className="text-xl font-black mb-6">Schedule Session</h3>
              <form action={createEvent} className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-on-surface-variant mb-1">Title</label>
                  <input name="title" required maxLength={120} className="app-input px-4 py-3" placeholder="Calculus midterm prep" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-on-surface-variant mb-1">Group</label>
                  <select name="groupId" className="app-input px-4 py-3">
                    <option value="">Personal session</option>
                    {user.groupMemberships.map((membership) => (
                      <option key={membership.groupId} value={membership.groupId}>
                        {membership.group.name}
                      </option>
                    ))}
                  </select>
                </div>
                <EventDateTimePicker />
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-on-surface-variant mb-1">Location</label>
                  <input name="location" maxLength={160} className="app-input px-4 py-3" placeholder="Virtual, library room, or URL" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-on-surface-variant mb-1">Description</label>
                  <textarea name="description" maxLength={500} className="app-input px-4 py-3 resize-none h-24" placeholder="Agenda, goals, or prep notes" />
                </div>
                <button className="w-full rounded-full app-primary-button py-3 font-black">
                  Create Session
                </button>
              </form>
            </section>

            <section className="lg:col-span-8 space-y-6">
              <h3 className="text-xl font-black">Upcoming Sessions</h3>
              {upcomingEvents.length === 0 ? (
                <div className="glass-panel-subtle rounded-[28px] border border-dashed border-outline-variant/30 p-10 text-center text-on-surface-variant">
                  No upcoming sessions yet.
                </div>
              ) : (
                upcomingEvents.map((event) => {
                  const myRsvp = event.attendees.find((attendee) => attendee.userId === user.id)?.status;
                  const canCancel = event.creatorId === user.id || user.groupMemberships.some((membership) => membership.groupId === event.groupId && membership.role === "ADMIN");

                  return (
                    <article key={event.id} className="glass-panel-subtle rounded-[28px] p-6">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
                              {event.group?.name || "Personal"}
                            </span>
                            {myRsvp && (
                              <span className="px-3 py-1 rounded-full bg-surface-container text-on-surface-variant text-[10px] font-black uppercase tracking-widest">
                                {myRsvp}
                              </span>
                            )}
                          </div>
                          <h4 className="text-2xl font-black tracking-tight">{event.title}</h4>
                          {event.description && <p className="text-sm text-on-surface-variant mt-2 max-w-2xl">{event.description}</p>}
                          <div className="flex flex-wrap gap-4 mt-4 text-xs font-semibold text-on-surface-variant">
                            <span>{event.startTime.toLocaleString()} - {event.endTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                            <span>{event.location || "Virtual"}</span>
                            <span>{event._count.attendees} attendee{event._count.attendees === 1 ? "" : "s"}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 md:justify-end">
                          {(["GOING", "MAYBE", "DECLINED"] as const).map((status) => (
                            <form key={status} action={rsvpEvent.bind(null, event.id, status)}>
                              <button className={`px-4 py-2 rounded-full text-xs font-black ${myRsvp === status ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"}`}>
                                {status}
                              </button>
                            </form>
                          ))}
                          {canCancel && (
                            <form action={cancelEvent.bind(null, event.id)}>
                              <button className="px-4 py-2 rounded-full bg-error-container text-on-error-container text-xs font-black">
                                Cancel
                              </button>
                            </form>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })
              )}

              {pastEvents.length > 0 && (
                <section className="pt-6 space-y-3">
                  <h3 className="text-xl font-black">Recent Past Sessions</h3>
                  {pastEvents.map((event) => (
                    <div key={event.id} className="glass-panel-subtle rounded-2xl p-4 flex items-center justify-between gap-4 opacity-80">
                      <div>
                        <p className="font-bold">{event.title}</p>
                        <p className="text-xs text-on-surface-variant">{event.startTime.toLocaleString()}</p>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{event.group?.name || "Personal"}</span>
                    </div>
                  ))}
                </section>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
