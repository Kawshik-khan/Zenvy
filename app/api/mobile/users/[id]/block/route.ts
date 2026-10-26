import { blockUser } from "@/app/actions/connection";
import { handle, ok, requireUserId } from "@/lib/mobile/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    await requireUserId();
    const { id } = await params;
    await blockUser(id);
    return ok({ blocked: true });
  });
}
