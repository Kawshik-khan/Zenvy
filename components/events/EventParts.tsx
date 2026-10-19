import { Clock, MapPin, Plus, Users } from "lucide-react";
import EventDateTimePicker from "@/app/components/EventDateTimePicker";
import { cancelEvent, createEvent, rsvpEvent } from "@/app/actions/event";
import { Badge, Button, Card, EmptyState, Input, Select, Textarea } from "@/components/ui";

export type EventItem = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startTime: Date;
  endTime: Date;
  creatorId: string;
  groupId: string | null;
  group: { name: string } | null;
  attendees: { userId: string; status: string }[];
  _count: { attendees: number };
};

export type GroupMembership = { groupId: string; role: string; group: { name: string } };

const rsvpStatuses = ["GOING", "MAYBE", "DECLINED"] as const;
const rsvpLabels: Record<string, string> = { GOING: "Going", MAYBE: "Maybe", DECLINED: "Can't go" };

export function formatEventRange(startTime: Date, endTime: Date) {
  return `${startTime.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })} - ${endTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

type CreateEventCardProps = {
  heading: string;
  submitLabel: string;
  personalLabel: string;
  titlePlaceholder: string;
  locationPlaceholder: string;
  memberships: GroupMembership[];
  className?: string;
};

/** The create form shared by Events and Scheduling. The server action is the same. */
export function CreateEventCard({ heading, submitLabel, personalLabel, titlePlaceholder, locationPlaceholder, memberships, className }: CreateEventCardProps) {
  return (
    <Card tone="card" shadow="md" className={className}>
      <h2 className="m-0 mb-5 text-2xl font-bold">{heading}</h2>
      <form action={createEvent} className="flex flex-col gap-4">
        <Input id="event-title" name="title" label="Title" required maxLength={120} placeholder={titlePlaceholder} />
        <Select id="event-group" name="groupId" label="Group">
          <option value="">{personalLabel}</option>
          {memberships.map((membership) => (
            <option key={membership.groupId} value={membership.groupId}>
              {membership.group.name}
            </option>
          ))}
        </Select>
        <EventDateTimePicker />
        <Input id="event-location" name="location" label="Location" maxLength={160} placeholder={locationPlaceholder} />
        <Textarea id="event-notes" name="description" label="Notes" maxLength={500} rows={3} placeholder="Agenda, prep work, or focus goals" />
        <Button type="submit" variant="focus" fullWidth icon={<Plus size={18} />}>
          {submitLabel}
        </Button>
      </form>
    </Card>
  );
}

type UpcomingEventsProps = {
  events: EventItem[];
  userId: string;
  memberships: GroupMembership[];
  emptyTitle: string;
  emptyDescription: string;
};

export function UpcomingEvents({ events, userId, memberships, emptyTitle, emptyDescription }: UpcomingEventsProps) {
  if (events.length === 0) return <EmptyState title={emptyTitle} description={emptyDescription} />;

  return (
    <ul className="m-0 flex list-none flex-col gap-5 p-0">
      {events.map((event) => {
        const myRsvp = event.attendees.find((attendee) => attendee.userId === userId)?.status;
        const canCancel = event.creatorId === userId || memberships.some((membership) => membership.groupId === event.groupId && membership.role === "ADMIN");

        return (
          <li key={event.id}>
            <Card as="article" shadow="md" className="flex flex-col gap-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={event.group ? "career" : "paper"} size="sm">
                  {event.group?.name || "Personal"}
                </Badge>
                <Badge tone={myRsvp === "GOING" ? "live" : "card"} size="sm">
                  {myRsvp ? (rsvpLabels[myRsvp] ?? myRsvp) : "No RSVP yet"}
                </Badge>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="m-0 text-2xl leading-tight font-bold">{event.title}</h3>
                {event.description && <p className="m-0 max-w-2xl text-[15px] text-fg-muted">{event.description}</p>}
              </div>
              <ul className="m-0 grid list-none gap-3 p-0 text-[15px] font-bold sm:grid-cols-3">
                <li className="flex items-center gap-2">
                  <Clock aria-hidden="true" size={18} className="shrink-0" />
                  {formatEventRange(event.startTime, event.endTime)}
                </li>
                <li className="flex items-center gap-2">
                  <MapPin aria-hidden="true" size={18} className="shrink-0" />
                  {event.location || "Virtual"}
                </li>
                <li className="flex items-center gap-2">
                  <Users aria-hidden="true" size={18} className="shrink-0" />
                  {event._count.attendees} attendee{event._count.attendees === 1 ? "" : "s"}
                </li>
              </ul>

              <div className="flex flex-wrap gap-2 border-t-2 border-line pt-4">
                {rsvpStatuses.map((status) => (
                  <form key={status} action={rsvpEvent.bind(null, event.id, status)}>
                    <Button
                      type="submit"
                      size="sm"
                      variant={myRsvp === status ? "focus" : "secondary"}
                      aria-pressed={myRsvp === status}
                      aria-label={`${rsvpLabels[status]}: ${event.title}`}
                    >
                      {rsvpLabels[status]}
                    </Button>
                  </form>
                ))}
                {canCancel && (
                  <form action={cancelEvent.bind(null, event.id)} className="sm:ml-auto">
                    <Button type="submit" size="sm" variant="danger" aria-label={`Cancel event: ${event.title}`}>
                      Cancel event
                    </Button>
                  </form>
                )}
              </div>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}

export function PastEvents({ events, heading }: { events: EventItem[]; heading: string }) {
  if (events.length === 0) return null;
  return (
    <section aria-labelledby="past-events" className="flex flex-col gap-3 pt-2">
      <h2 id="past-events" className="m-0 text-2xl font-bold">
        {heading}
      </h2>
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {events.map((event) => (
          <li key={event.id} className="flex items-center justify-between gap-4 rounded-nb border-2 border-line bg-card p-4">
            <div className="min-w-0">
              <p className="m-0 truncate font-bold">{event.title}</p>
              <p className="m-0 text-sm text-fg-muted">{formatEventRange(event.startTime, event.endTime)}</p>
            </div>
            <span className="shrink-0 text-sm font-bold text-fg-muted">{event.group?.name || "Personal"}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
