import { sendMatchRequest } from "@/app/actions/connection";
import { handle, ok, readJson, requireUserId } from "@/lib/mobile/http";
import { getPerson } from "@/lib/mobile/people";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Sends a study-partner request, with an optional note (180 characters). */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const userId = await requireUserId();
    const { id } = await params;
    const body = await readJson<{ note?: unknown }>(request).catch(() => ({ note: undefined }));
    await sendMatchRequest(id, typeof body.note === "string" ? body.note : undefined);
    return ok({ person: await getPerson(userId, id) });
  });
}
