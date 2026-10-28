import { cancelEvent } from "@/app/actions/event";
import { handle, ok, requireUserId } from "@/lib/mobile/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Cancels an event (its creator or a group admin only). */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    await requireUserId();
    const { id } = await params;
    await cancelEvent(id);
    return ok({ cancelled: true });
  });
}
