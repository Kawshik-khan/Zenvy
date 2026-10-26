import { handle, ok, requireUserId } from "@/lib/mobile/http";
import { getPerson } from "@/lib/mobile/people";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const userId = await requireUserId();
    const { id } = await params;
    return ok({ person: await getPerson(userId, id) });
  });
}
