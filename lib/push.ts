import webpush from "web-push";
import { prisma } from "@/lib/prisma";

let configured = false;

function configure() {
  if (configured) return true;
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return false;
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL || "admin@zenvy.app"}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
  configured = true;
  return true;
}

export type WebPushPayload = {
  type: string;
  title: string;
  body: string;
  /** Where a tap on the notification opens. */
  url?: string;
  /** Where the notification's "Call back" action opens, for missed calls. */
  callBackUrl?: string;
};

/** Sends a browser push to every device the user subscribed. Best effort: failures are logged, not thrown. */
export async function sendWebPush(userId: string, payload: WebPushPayload) {
  if (!configure()) return;
  try {
    const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
    const body = JSON.stringify(payload);
    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, body);
        } catch (err: any) {
          // The browser dropped this subscription.
          if (err?.statusCode === 410 || err?.statusCode === 404) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
          }
        }
      }),
    );
  } catch (err) {
    console.error("Web push failed:", err);
  }
}
