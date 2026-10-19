import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function NotificationBell() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const unreadCount = await prisma.notification.count({
    where: { userId: session.user.id, read: false },
  });

  return (
    <Link
      href="/notifications"
      aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
      className="relative hover:bg-surface-container rounded-full p-2 transition-transform active:scale-95 text-on-surface-variant hover:text-on-surface inline-flex"
    >
      <span className="material-symbols-outlined">notifications</span>
      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 min-w-5 h-5 rounded-full bg-error px-1 text-[10px] font-black leading-5 text-white text-center">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
