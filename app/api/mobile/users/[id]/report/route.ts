import { reportUser } from "@/app/actions/connection";
import { fail, handle, ok, readJson, requireUserId } from "@/lib/mobile/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Body: { reason: string } (up to 500 characters). */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    await requireUserId();
    const { id } = await params;
    const { reason } = await readJson<{ reason?: unknown }>(request);
    const text = typeof reason === "string" ? reason.trim().slice(0, 500) : "";
    if (!text) return fail("Tell us what happened");
    await reportUser(id, text);
    return ok({ reported: true });
  });
}
