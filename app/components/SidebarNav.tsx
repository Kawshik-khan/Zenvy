"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePomodoro } from "./PomodoroProvider";

export const sidebarLinks = [
  { href: "/dashboard", icon: "home", label: "Dashboard" },
  { href: "/groups", icon: "groups", label: "Groups" },
  { href: "/channels", icon: "tag", label: "Channels" },
  { href: "/chat", icon: "chat_bubble", label: "Chat" },
  { href: "#focus-timer", icon: "timer", label: "Focus Timer", action: "pomodoro" },
  { href: "/matching", icon: "favorite", label: "Matching" },
  { href: "/events", icon: "event", label: "Events" },
  { href: "/notifications", icon: "notifications", label: "Notifications" },
  { href: "/bookmarks", icon: "bookmark", label: "Bookmarks" },
  { href: "/stats", icon: "monitoring", label: "Study Stats" },
];

type SidebarNavProps = {
  variant?: "sidebar" | "bottom";
  chatUnreadCount?: number;
};

export default function SidebarNav({ variant = "sidebar", chatUnreadCount = 0 }: SidebarNavProps) {
  const pathname = usePathname();
  const { openPomodoro } = usePomodoro();
  const isBottom = variant === "bottom";
  const chatBadge = chatUnreadCount > 9 ? "9+" : chatUnreadCount > 0 ? String(chatUnreadCount) : null;

  return (
    <nav
      className={
        isBottom
          ? "flex min-w-0 flex-1 items-stretch gap-1 overflow-x-auto hide-scrollbar"
          : "flex-1 overflow-y-auto overflow-x-hidden hide-scrollbar py-2 px-3 space-y-1"
      }
      aria-label={isBottom ? "Primary navigation" : "Sidebar navigation"}
    >
      {sidebarLinks.map((link) => {
        const isAction = link.action === "pomodoro";
        const isActive = !isAction && (pathname?.startsWith(link.href) || pathname === link.href);
        const badge = link.href === "/chat" ? chatBadge : null;
        const className = `relative transition-all duration-200 ${
          isBottom
            ? "flex min-w-[4.5rem] flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2"
            : "flex w-full items-center gap-4 rounded-2xl px-3 py-3"
        } ${
          isActive
            ? "bg-gradient-to-r from-primary/20 to-transparent text-primary border border-primary/20"
            : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
        }`;
        const content = (
          <>
            <span className="material-symbols-outlined flex-shrink-0 text-[22px]" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
              {link.icon}
            </span>
            <span className={`${isBottom ? "max-w-full truncate text-[10px]" : "text-sm"} whitespace-nowrap ${isActive ? "font-semibold" : "font-medium"}`}>{link.label}</span>

            {badge && (
              <div
                className={`absolute flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-bold text-white shadow-[0_0_10px_rgba(168,85,247,0.5)] ${
                  isBottom ? "right-2 top-1" : "right-4 top-1/2 -translate-y-1/2"
                }`}
              >
                {badge}
              </div>
            )}
          </>
        );
        if (isAction) {
          return (
            <button key={link.label} type="button" onClick={openPomodoro} className={className}>
              {content}
            </button>
          );
        }
        return (
          <Link
            key={link.label}
            href={link.href}
            className={className}
          >
            {content}
          </Link>
        );
      })}
    </nav>
  );
}
