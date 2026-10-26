import { markAllNotificationsRead, markNotificationRead } from "@/app/actions/notifications";
import { handle, ok, readJson, requireUserId } from "@/lib/mobile/http";
import { listNotifications } from "@/lib/mobile/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => ok({ notifications: await listNotifications(await requireUserId()) }));
}

/** Marks one notification read ({ id }) or all of them ({}). */
export async function POST(request: Request) {
  return handle(async () => {
    const userId = await requireUserId();
    const { id } = await readJson<{ id?: unknown }>(request).catch(() => ({ id: undefined }));
    if (typeof id === "string" && id) await markNotificationRead(id);
    else await markAllNotificationsRead();
    return ok({ notifications: await listNotifications(userId) });
  });
}
