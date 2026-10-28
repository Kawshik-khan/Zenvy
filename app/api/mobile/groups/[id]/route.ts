import { handle, ok, requireUserId } from "@/lib/mobile/http";
import { getGroup } from "@/lib/mobile/groups";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const userId = await requireUserId();
    const { id } = await params;
    return ok({ group: await getGroup(userId, id) });
  });
}
