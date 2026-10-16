"use client";

import { LogOut, Menu, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/app/actions/auth";
import { usePomodoro } from "@/app/components/PomodoroProvider";
import { Avatar, cx, Sheet, SheetContent, SheetTrigger, toneBg, textOn } from "@/components/ui";
import { navIcons } from "./icons";
import { bottomBarKeys, formatBadge, isPathActive, isSecondaryActive, secondaryNav, type NavItem } from "./nav";
import type { ShellUser } from "./AppShell";

type BottomBarProps = {
  items: NavItem[];
  user: ShellUser;
  unreadCount: number;
  hidden: boolean;
};

const tabBase =
  "nb-focus relative flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-nb border-2 px-1 font-grotesk text-[11px] leading-tight font-bold no-underline";

export function BottomBar({ items, user, unreadCount, hidden }: BottomBarProps) {
  const pathname = usePathname();
  const { openPomodoro } = usePomodoro();
  const [moreOpen, setMoreOpen] = useState(false);
  const badge = formatBadge(unreadCount);
  const barItems = items.filter((item) => bottomBarKeys.includes(item.key));
  // Everything not in the bar except Profile, which the sheet's header already links to.
  const moreItems = items.filter((item) => !bottomBarKeys.includes(item.key) && item.href && item.key !== "profile");
  const profileActive = isPathActive(pathname, ["/profile"]);
  const moreActive = profileActive || moreItems.some((item) => isPathActive(pathname, item.match)) || isSecondaryActive(pathname);

  return (
    <nav
      aria-label="Main"
      aria-hidden={hidden || undefined}
      className={cx(
        "fixed inset-x-0 bottom-0 z-[110] border-t-[length:var(--nb-border-width)] border-line bg-canvas px-2 pt-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] text-fg transition-transform duration-200 md:hidden",
        hidden ? "pointer-events-none translate-y-full" : "translate-y-0",
      )}
    >
      <ul className="m-0 flex list-none items-stretch gap-1.5 p-0">
        {barItems.map((item) => {
          const Icon = navIcons[item.key];
          const active = isPathActive(pathname, item.match);
          const content = (
            <>
              <Icon aria-hidden="true" size={22} />
              <span className="max-w-full truncate">{item.key === "partners" ? "Partners" : item.label}</span>
              {item.key === "messages" && badge && (
                <span className="absolute top-1 right-[calc(50%-22px)] rounded-full border-2 border-line bg-chat px-1.5 text-[10px] text-ink">
                  {badge}
                  <span className="sr-only"> unread</span>
                </span>
              )}
            </>
          );
          return (
            <li key={item.key} className="flex min-w-0 flex-1">
              {item.href ? (
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cx(tabBase, active ? cx(toneBg[item.tone], textOn(item.tone), "border-line shadow-nb-sm") : "border-transparent")}
                >
                  {content}
                </Link>
              ) : (
                <button type="button" onClick={openPomodoro} className={cx(tabBase, "cursor-pointer border-transparent bg-transparent text-fg")}>
                  {content}
                </button>
              )}
            </li>
          );
        })}
        <li className="flex min-w-0 flex-1">
          <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className={cx(tabBase, "cursor-pointer text-fg", moreActive ? "border-line bg-card shadow-nb-sm" : "border-transparent bg-transparent")}
              >
                <Menu aria-hidden="true" size={22} />
                <span>More</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" title="More">
              <div className="flex flex-col gap-5 pb-2">
                <div className="flex items-center gap-3">
                  <Avatar name={user.name} src={user.image} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-lg font-bold">{user.name || "Student"}</div>
                    <Link href="/profile" onClick={() => setMoreOpen(false)} className="nb-focus font-bold">
                      View profile
                    </Link>
                  </div>
                </div>
                <ul className="m-0 grid list-none grid-cols-2 gap-2 p-0">
                  {[...moreItems.map((item) => ({ label: item.label, href: item.href! })), ...secondaryNav].map((link) => {
                    const active = isPathActive(pathname, [link.href]);
                    return (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          aria-current={active ? "page" : undefined}
                          onClick={() => setMoreOpen(false)}
                          className={cx(
                            "nb-focus flex min-h-12 items-center rounded-nb border-nb px-3 font-bold no-underline",
                            active ? "bg-focus text-ink shadow-nb-sm" : "bg-card text-fg",
                          )}
                        >
                          {link.label}
                        </Link>
                      </li>
                    );
                  })}
                  {user.isAdmin && (
                    <li>
                      <Link
                        href="/zenvy-admin"
                        onClick={() => setMoreOpen(false)}
                        className="nb-focus flex min-h-12 items-center gap-2 rounded-nb border-nb bg-card px-3 font-bold text-fg no-underline"
                      >
                        <ShieldCheck aria-hidden="true" size={16} />
                        Admin
                      </Link>
                    </li>
                  )}
                </ul>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="nb-focus flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-nb border-nb bg-card font-grotesk font-bold text-fg"
                  >
                    <LogOut aria-hidden="true" size={18} />
                    Log out
                  </button>
                </form>
              </div>
            </SheetContent>
          </Sheet>
        </li>
      </ul>
    </nav>
  );
}
