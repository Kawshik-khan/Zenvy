import { handle, ok, requireUserId } from "@/lib/mobile/http";
import { listConnections } from "@/lib/mobile/people";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Accepted study partners (people the viewer can message). */
export async function GET() {
  return handle(async () => ok({ partners: await listConnections(await requireUserId()) }));
}
