"use client";

import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { ToastProvider } from "@/components/ui";
import { AppSidebar } from "./AppSidebar";
import { BottomBar } from "./BottomBar";
import { hidesMobileBar, visiblePrimaryNav } from "./nav";
import { useShellData } from "./useShellData";

export type ShellUser = {
  name: string | null;
  image: string | null;
  isAdmin: boolean;
};

type AppShellProps = {
  user: ShellUser;
  flags: { jobs: boolean };
  children: ReactNode;
};

/** Shared chrome for every signed-in screen: desktop sidebar, mobile bottom bar, toasts. */
export function AppShell({ user, flags, children }: AppShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { metrics, unreadCount } = useShellData();
  const items = visiblePrimaryNav(flags);
  const hideMobileBar = hidesMobileBar(pathname, Boolean(searchParams?.get("conversation")));

  return (
    <ToastProvider>
      <a
        href="#main-content"
        className="nb-focus sr-only z-[400] rounded-nb border-nb bg-focus px-4 py-2 font-grotesk font-bold text-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <div className="min-h-dvh md:flex">
        <AppSidebar items={items} user={user} metrics={metrics} unreadCount={unreadCount} />
        <div id="main-content" tabIndex={-1} className="min-w-0 flex-1 outline-none">
          {children}
        </div>
      </div>
      <BottomBar items={items} user={user} unreadCount={unreadCount} hidden={hideMobileBar} />
    </ToastProvider>
  );
}
