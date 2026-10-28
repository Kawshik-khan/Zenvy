import { rsvpEvent } from "@/app/actions/event";
import { fail, handle, ok, readJson, requireUserId } from "@/lib/mobile/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES = new Set(["GOING", "MAYBE", "DECLINED"]);

/** Body: { status: GOING | MAYBE | DECLINED }. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    await requireUserId();
    const { id } = await params;
    const { status } = await readJson<{ status?: unknown }>(request);
    if (typeof status !== "string" || !STATUSES.has(status)) return fail("Choose going, maybe or not going");
    await rsvpEvent(id, status as "GOING" | "MAYBE" | "DECLINED");
    return ok({ status });
  });
}
