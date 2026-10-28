import { joinGroup, leaveGroup } from "@/app/actions/group";
import { handle, ok, readJson, requireUserId } from "@/lib/mobile/http";
import { getGroup } from "@/lib/mobile/groups";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Body: { join: boolean }. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const userId = await requireUserId();
    const { id } = await params;
    const { join } = await readJson<{ join?: unknown }>(request);
    if (join === true) await joinGroup(id);
    else await leaveGroup(id);
    return ok({ group: await getGroup(userId, id) });
  });
}
