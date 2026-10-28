import { toggleSaveAction } from "@/app/(app)/jobs/actions";
import { fail, handle, ok, requireUserId } from "@/lib/mobile/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Toggles the saved state; returns { saved }. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    await requireUserId();
    const { id } = await params;
    const result = await toggleSaveAction(id);
    if ("error" in result) return fail(result.error ?? "Could not update your saved posts");
    return ok({ saved: result.saved });
  });
}
