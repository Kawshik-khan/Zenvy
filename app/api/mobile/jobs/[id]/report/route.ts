import { reportJobAction } from "@/app/(app)/jobs/actions";
import { fail, handle, ok, readJson, requireUserId } from "@/lib/mobile/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Body: { reason: SCAM_FEE | FAKE_COMPANY | SPAM | OFFENSIVE | OTHER, details?: string }. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    await requireUserId();
    const { id } = await params;
    const body = await readJson<{ reason?: unknown; details?: unknown }>(request);
    const result = await reportJobAction(id, String(body.reason ?? ""), typeof body.details === "string" ? body.details : "");
    if ("error" in result) return fail(result.error ?? "Could not send your report");
    return ok({ reported: true, alreadyReported: result.alreadyReported });
  });
}
