import { acceptMatchRequest, rejectMatchRequest } from "@/app/actions/connection";
import { fail, handle, ok, readJson, requireUserId } from "@/lib/mobile/http";
import { getPerson } from "@/lib/mobile/people";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Accepts or declines this person's pending request to the viewer. Body: { accept: boolean }. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const userId = await requireUserId();
    const { id } = await params;
    const { accept } = await readJson<{ accept?: unknown }>(request);
    const person = await getPerson(userId, id);
    if (!person.requestNotificationId) return fail("There's no pending request from this person", 404);
    await (accept === true ? acceptMatchRequest : rejectMatchRequest)(person.requestNotificationId);
    return ok({ person: await getPerson(userId, id) });
  });
}
