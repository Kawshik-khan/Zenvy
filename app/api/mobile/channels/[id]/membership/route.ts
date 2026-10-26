import { joinChannel, leaveChannel } from "@/app/actions/channel";
import { handle, ok, readJson, requireUserId } from "@/lib/mobile/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Body: { join: boolean }. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    await requireUserId();
    const { id } = await params;
    const { join } = await readJson<{ join?: unknown }>(request);
    if (join === true) await joinChannel(id);
    else await leaveChannel(id);
    return ok({ member: join === true });
  });
}
