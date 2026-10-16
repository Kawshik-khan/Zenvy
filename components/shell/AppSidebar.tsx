"use client";

import { Flame, LogOut, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { usePomodoro } from "@/app/components/PomodoroProvider";
import { Avatar, cx, toneBg, textOn } from "@/components/ui";
import { FocusStatus } from "./FocusStatus";
import { navIcons } from "./icons";
import { formatBadge, isPathActive, secondaryNav, type NavItem } from "./nav";
import type { ShellMetrics } from "./useShellData";
import type { ShellUser } from "./AppShell";

type AppSidebarProps = {
  items: NavItem[];
  user: ShellUser;
  metrics: ShellMetrics | null;
  unreadCount: number;
};

const itemBase =
  "nb-focus flex min-h-11 w-full items-center gap-3 rounded-nb border-nb px-3 font-grotesk text-base no-underline transition-[background-color] duration-100";

export function AppSidebar({ items, user, metrics, unreadCount }: AppSidebarProps) {
  const pathname = usePathname();
  const { openPomodoro } = usePomodoro();
  const badge = formatBadge(unreadCount);

  return (
    <aside className="sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col gap-4 overflow-y-auto border-r-[length:var(--nb-border-width)] border-line bg-canvas px-4 py-4 font-grotesk text-fg md:flex">
      <Link href="/dashboard" className="nb-focus flex items-center gap-2.5 rounded-nb px-1 no-underline">
        <span aria-hidden="true" className="inline-flex size-10 items-center justify-center rounded-nb border-nb bg-focus text-xl font-bold text-ink shadow-nb-sm">
          Z
        </span>
        <span className="text-2xl font-bold tracking-tight">zenvy</span>
      </Link>

      <nav aria-label="Main" className="flex flex-col gap-1.5">
        {items.map((item) => {
          const Icon = navIcons[item.key];
          const active = isPathActive(pathname, item.match);
          const content = (
            <>
              <Icon aria-hidden="true" size={20} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.key === "messages" && badge && (
                <span className="rounded-full border-2 border-line bg-chat px-2 text-xs font-bold text-ink">
                  <span className="sr-only">, </span>
                  {badge}
                  <span className="sr-only"> unread</span>
                </span>
              )}
            </>
          );

          if (!item.href) {
            return (
              <button key={item.key} type="button" onClick={openPomodoro} className={cx(itemBase, "cursor-pointer border-transparent font-medium hover:bg-card")}>
                {content}
              </button>
            );
          }

          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cx(
                itemBase,
                active ? cx(toneBg[item.tone], textOn(item.tone), "font-bold shadow-nb-sm") : "border-transparent font-medium hover:bg-card",
              )}
            >
              {content}
            </Link>
          );
        })}
      </nav>

      <nav aria-label="More" className="flex flex-col gap-0.5">
        <span className="px-3 pb-0.5 text-xs font-bold tracking-[0.08em] text-fg-muted uppercase">More</span>
        {secondaryNav.map((link) => {
          const active = isPathActive(pathname, [link.href]);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={cx(
                "nb-focus rounded-nb px-3 py-1 text-[15px] no-underline hover:bg-card",
                active ? "bg-card font-bold underline decoration-2 underline-offset-4" : "text-fg",
              )}
            >
              {link.label}
            </Link>
          );
        })}
        {user.isAdmin && (
          <Link href="/zenvy-admin" className="nb-focus flex items-center gap-2 rounded-nb px-3 py-1.5 text-[15px] no-underline hover:bg-card">
            <ShieldCheck aria-hidden="true" size={16} />
            Admin
          </Link>
        )}
      </nav>

      <div className="mt-auto flex flex-col gap-3">
        <FocusStatus />
        <div className="flex items-center gap-2.5 rounded-nb border-nb bg-card p-2.5 shadow-nb-sm">
          <Avatar name={user.name} src={user.image} size="md" />
          <div className="min-w-0 flex-1">
            <Link href="/profile" className="nb-focus block truncate font-bold no-underline hover:underline">
              {user.name || "Student"}
            </Link>
            <span className="flex items-center gap-1 text-sm whitespace-nowrap text-fg-muted">
              {metrics ? (
                <>
                  <Flame aria-hidden="true" size={14} className="shrink-0" />
                  {metrics.currentStreakDays} day{metrics.currentStreakDays === 1 ? "" : "s"}
                  <span className="sr-only"> study streak</span>
                </>
              ) : (
                "Student"
              )}
            </span>
          </div>
          <form action={logoutAction}>
            <button type="submit" aria-label="Log out" title="Log out" className="nb-focus inline-flex size-11 cursor-pointer items-center justify-center rounded-nb hover:bg-canvas">
              <LogOut aria-hidden="true" size={18} />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
