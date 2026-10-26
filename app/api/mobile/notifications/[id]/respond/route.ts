import { acceptMatchRequest, rejectMatchRequest } from "@/app/actions/connection";
import { acceptGroupInvite, declineGroupInvite } from "@/app/actions/group-collaboration";
import { prisma } from "@/lib/prisma";
import { fail, handle, ok, readJson, requireUserId } from "@/lib/mobile/http";
import { listNotifications } from "@/lib/mobile/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Accepts or declines a match request or group invite. Body: { accept: boolean }. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const userId = await requireUserId();
    const { id } = await params;
    const { accept } = await readJson<{ accept?: unknown }>(request);
    const notification = await prisma.notification.findFirst({ where: { id, userId }, select: { type: true } });
    if (!notification) return fail("Notification not found", 404);

    if (notification.type === "MATCH_REQUEST") await (accept === true ? acceptMatchRequest : rejectMatchRequest)(id);
    else if (notification.type === "GROUP_INVITE") await (accept === true ? acceptGroupInvite : declineGroupInvite)(id);
    else return fail("This notification has nothing to respond to");

    return ok({ notifications: await listNotifications(userId) });
  });
}
