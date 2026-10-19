export const runtime = "nodejs";

import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { BellOff } from "lucide-react";
import { AppHeader } from "@/components/shell/AppHeader";
import { Badge, Button, Card, EmptyState } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { markAllNotificationsRead } from "@/app/actions/notifications";
import { NotificationActions } from "./NotificationActions";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [user, notifications] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, image: true },
    }),
    prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  if (!user) redirect("/login");

  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const matchRequestIds = notifications
    .filter((notification) => notification.type === "MATCH_REQUEST" && notification.relatedId)
    .map((notification) => notification.relatedId as string);
  const matchRequests = matchRequestIds.length
    ? await prisma.match.findMany({
        where: { id: { in: matchRequestIds } },
        select: { id: true, requestNote: true },
      })
    : [];
  const requestNoteByMatchId = new Map(matchRequests.map((match) => [match.id, match.requestNote]));

  return (
    <div className="min-h-dvh bg-canvas font-grotesk text-fg">
      <AppHeader />

      <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-6 pb-28 md:px-8 md:pb-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="m-0 text-4xl leading-[1.05] font-bold tracking-tight md:text-5xl">Notifications</h1>
            <p className="m-0 text-lg text-fg-muted" aria-live="polite">
              {unreadCount > 0 ? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}.` : "You are all caught up."}
            </p>
          </div>
          {unreadCount > 0 && (
            <form action={markAllNotificationsRead}>
              <Button type="submit" variant="secondary">
                Mark all read
              </Button>
            </form>
          )}
        </div>

        {notifications.length === 0 ? (
          <EmptyState icon={<BellOff size={26} />} title="No notifications yet" description="Match requests, group invites and replies show up here." />
        ) : (
          <ul className="m-0 flex list-none flex-col gap-4 p-0">
            {notifications.map((notification) => {
              const requestNote = notification.relatedId ? requestNoteByMatchId.get(notification.relatedId) : null;

              return (
                <li key={notification.id}>
                  <Card
                    as="article"
                    tone={notification.read ? "card" : "focus"}
                    shadow={notification.read ? "none" : "sm"}
                    padding="sm"
                    className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="m-0 flex items-center gap-2 font-grotesk text-sm font-bold tracking-wide uppercase">
                        {!notification.read && (
                          <Badge tone="ink" size="sm">
                            New
                          </Badge>
                        )}
                        {notification.type.replace(/_/g, " ")}
                      </p>
                      <p className="m-0 mt-2 text-[17px] font-bold">{notification.content}</p>
                      {requestNote && (
                        <blockquote className="m-0 mt-3 rounded-nb border-2 border-line bg-canvas px-4 py-3 text-fg">
                          <p className="m-0 text-xs font-bold tracking-wide uppercase">Request note</p>
                          <p className="m-0 mt-1 text-[15px]">{requestNote}</p>
                        </blockquote>
                      )}
                      <p className="m-0 mt-2 text-sm">
                        <time dateTime={notification.createdAt.toISOString()}>{notification.createdAt.toLocaleString()}</time>
                      </p>
                    </div>
                    <NotificationActions notificationId={notification.id} type={notification.type} read={notification.read} />
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
