import React from "react";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/shell/AppHeader";
import { ButtonLink, StatTile } from "@/components/ui";
import ErrorView from "@/app/components/ErrorView";
import { CreateEventCard, PastEvents, UpcomingEvents } from "@/components/events/EventParts";

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
      <div className="min-h-dvh bg-canvas font-grotesk text-fg">
        <AppHeader />

        <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-6 pb-28 md:px-8 md:pb-10">
          <section aria-labelledby="events-title" className="grid grid-cols-1 gap-6 xl:grid-cols-12 xl:items-end">
            <div className="flex max-w-2xl flex-col gap-2 xl:col-span-7">
              <h1 id="events-title" className="m-0 text-4xl leading-[1.05] font-bold tracking-tight md:text-5xl">
                Study events
              </h1>
              <p className="m-0 text-lg text-fg-muted">Plan focused sessions, collect RSVPs and keep your group calendar moving.</p>
            </div>

            <div className="grid grid-cols-3 gap-3 xl:col-span-5">
              <StatTile label="Upcoming" value={upcomingEvents.length} tone="chat" />
              <StatTile label="Today" value={todayEvents.length} tone="focus" />
              <StatTile label="Hosted" value={hostedEvents.length} tone="career" />
            </div>
          </section>

          <section className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
            <CreateEventCard
              heading="Create event"
              submitLabel="Create event"
              personalLabel="Personal event"
              titlePlaceholder="Physics lab review"
              locationPlaceholder="Library room, meeting link, or campus spot"
              memberships={user.groupMemberships}
              className="lg:col-span-4"
            />

            <div className="flex flex-col gap-6 lg:col-span-8">
              <div className="flex items-center justify-between gap-4">
                <h2 className="m-0 text-2xl font-bold">Upcoming events</h2>
                <ButtonLink href="/scheduling" variant="secondary" size="sm">
                  Calendar view
                </ButtonLink>
              </div>

              <UpcomingEvents
                events={upcomingEvents}
                userId={user.id}
                memberships={user.groupMemberships}
                emptyTitle="No upcoming events"
                emptyDescription="Create your next study event, or RSVP through a group."
              />
              <PastEvents events={pastEvents} heading="Recently finished" />
            </div>
          </section>
        </main>
      </div>
    );
  } catch (error) {
    console.error("Events Page Error:", error);
    return <ErrorView error={error} />;
  }
}
