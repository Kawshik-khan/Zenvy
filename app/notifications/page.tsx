export const runtime = "nodejs";

import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/app/components/Sidebar";
import { prisma } from "@/lib/prisma";
import { markAllNotificationsRead } from "@/app/actions/notifications";
import { NotificationActions } from "./NotificationActions";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  return (
    <div className="bg-surface text-on-surface antialiased min-h-screen">
      <Sidebar />
      <main className="md:ml-20 p-4 md:p-12 pb-24 min-h-screen">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <Link href="/dashboard" className="text-xs font-black uppercase tracking-widest text-primary">
                Back to dashboard
              </Link>
              <h1 className="text-3xl md:text-5xl font-black tracking-tighter mt-3">Notifications</h1>
              <p className="text-on-surface-variant mt-2">
                {unreadCount > 0 ? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}.` : "You are all caught up."}
              </p>
            </div>
            {unreadCount > 0 && (
              <form action={markAllNotificationsRead}>
                <button className="px-5 py-2.5 rounded-full bg-surface-container text-on-surface-variant text-sm font-bold">
                  Mark all read
                </button>
              </form>
            )}
          </div>

          <section className="space-y-3">
            {notifications.length === 0 ? (
              <div className="rounded-xl border border-dashed border-outline-variant/30 bg-surface-container-lowest p-10 text-center">
                <span className="material-symbols-outlined text-5xl text-on-surface-variant/50">notifications_off</span>
                <p className="mt-4 text-sm text-on-surface-variant">No notifications yet.</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`rounded-xl border p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
                    notification.read
                      ? "bg-surface-container-lowest border-outline-variant/10"
                      : "bg-primary-container/10 border-primary/20"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {!notification.read && <span className="h-2 w-2 rounded-full bg-primary" />}
                      <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                        {notification.type.replace(/_/g, " ")}
                      </p>
                    </div>
                    <p className="mt-2 text-sm font-semibold">{notification.content}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">
                      {notification.createdAt.toLocaleString()}
                    </p>
                  </div>
                  <NotificationActions notificationId={notification.id} type={notification.type} read={notification.read} />
                </div>
              ))
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
