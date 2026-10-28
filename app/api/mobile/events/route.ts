import { createEvent } from "@/app/actions/event";
import { fail, handle, ok, readJson, requireUserId } from "@/lib/mobile/http";
import { listEvents } from "@/lib/mobile/activity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Events from the viewer's groups, ones they created and ones they RSVP'd to. ?upcoming=1 hides past ones. */
export async function GET(request: Request) {
  return handle(async () => {
    const userId = await requireUserId();
    const upcomingOnly = new URL(request.url).searchParams.get("upcoming") === "1";
    return ok({ events: await listEvents(userId, { upcomingOnly }) });
  });
}

/** "2026-10-28T14:30:00.000Z" -> "2026-10-28T14:30", which createEvent reads as UTC with offset 0. */
function utcMinute(value: unknown) {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 16);
}

/** Body: { title, startTime, endTime (ISO 8601), groupId?, location?, type?: VIRTUAL | IN_PERSON, description? }. */
export async function POST(request: Request) {
  return handle(async () => {
    const userId = await requireUserId();
    const body = await readJson<Record<string, unknown>>(request);
    const start = utcMinute(body.startTime);
    const end = utcMinute(body.endTime);
    if (!start || !end) return fail("Pick a start and end time");

    const form = new FormData();
    form.set("title", typeof body.title === "string" ? body.title.trim() : "");
    form.set("startTime", start);
    form.set("endTime", end);
    form.set("timezoneOffset", "0");
    form.set("type", body.type === "IN_PERSON" ? "IN_PERSON" : "VIRTUAL");
    for (const key of ["groupId", "location", "description"] as const) {
      if (typeof body[key] === "string" && (body[key] as string).trim()) form.set(key, (body[key] as string).trim());
    }
    await createEvent(form);
    return ok({ events: await listEvents(userId, { upcomingOnly: true }) }, { status: 201 });
  });
}
