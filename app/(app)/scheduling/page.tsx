import React from "react";
export const runtime = "nodejs";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/shell/AppHeader";
import { CreateEventCard, PastEvents, UpcomingEvents } from "@/components/events/EventParts";
import { StatTile } from "@/components/ui";

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
    <div className="min-h-dvh bg-canvas font-grotesk text-fg">
      <AppHeader />

      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-6 pb-28 md:px-8 md:pb-10">
        <section aria-labelledby="scheduling-title" className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex max-w-2xl flex-col gap-2">
            <h1 id="scheduling-title" className="m-0 text-4xl leading-[1.05] font-bold tracking-tight md:text-5xl">
              Scheduling
            </h1>
            <p className="m-0 text-lg text-fg-muted">Schedule study sessions, attach them to groups and track RSVPs.</p>
          </div>
          <div className="grid grid-cols-3 gap-3 lg:min-w-[22rem]">
            <StatTile label="Upcoming" value={upcomingEvents.length} tone="chat" />
            <StatTile label="Groups" value={groupIds.length} tone="career" />
            <StatTile label="RSVPs" value={user.eventRSVPs.length} tone="focus" />
          </div>
        </section>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <CreateEventCard
            heading="Schedule a session"
            submitLabel="Create session"
            personalLabel="Personal session"
            titlePlaceholder="Calculus midterm prep"
            locationPlaceholder="Virtual, library room, or URL"
            memberships={user.groupMemberships}
            className="lg:col-span-4"
          />

          <section aria-labelledby="upcoming-sessions" className="flex flex-col gap-6 lg:col-span-8">
            <h2 id="upcoming-sessions" className="m-0 text-2xl font-bold">
              Upcoming sessions
            </h2>
            <UpcomingEvents
              events={upcomingEvents}
              userId={user.id}
              memberships={user.groupMemberships}
              emptyTitle="No upcoming sessions yet"
              emptyDescription="Schedule one with the form, or RSVP to a group session."
            />
            <PastEvents events={pastEvents} heading="Recent past sessions" />
          </section>
        </div>
      </main>
    </div>
  );
}
