import { Bell } from "lucide-react";
import Link from "next/link";
import { auth } from "@/auth";
import { buttonClasses } from "@/components/ui";
import { prisma } from "@/lib/prisma";

export default async function NotificationBell() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const unreadCount = await prisma.notification.count({
    where: { userId: session.user.id, read: false },
  });

  return (
    <Link
      href="/notifications"
      aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
      className={buttonClasses({ variant: "secondary", size: "md", square: true, className: "relative" })}
    >
      <Bell aria-hidden="true" size={20} />
      {unreadCount > 0 && (
        <span
          aria-hidden="true"
          className="absolute -top-2 -right-2 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-line bg-alert px-1 font-grotesk text-xs font-bold text-ink"
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
