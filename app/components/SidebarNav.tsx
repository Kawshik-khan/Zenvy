"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const sidebarLinks = [
  { href: "/dashboard", icon: "home", label: "Dashboard" },
  { href: "/groups", icon: "groups", label: "Groups" },
  { href: "/channels", icon: "tag", label: "Channels" },
  { href: "/chat", icon: "chat_bubble", label: "Chat", badge: 3 },
  { href: "/matching", icon: "favorite", label: "Matching" },
  { href: "/events", icon: "event", label: "Events" },
  { href: "/notifications", icon: "notifications", label: "Notifications" },
  { href: "/bookmarks", icon: "bookmark", label: "Bookmarks" },
  { href: "/stats", icon: "monitoring", label: "Study Stats" },
];

type SidebarNavProps = {
  variant?: "sidebar" | "bottom";
};

export default function SidebarNav({ variant = "sidebar" }: SidebarNavProps) {
  const pathname = usePathname();
  const isBottom = variant === "bottom";

  return (
    <nav
      className={
        isBottom
          ? "flex items-stretch gap-1 overflow-x-auto px-2 py-2 hide-scrollbar"
          : "flex-1 overflow-y-auto overflow-x-hidden hide-scrollbar py-2 px-3 space-y-1"
      }
      aria-label={isBottom ? "Primary navigation" : "Sidebar navigation"}
    >
      {sidebarLinks.map((link) => {
        const isActive = pathname?.startsWith(link.href) || pathname === link.href;
        return (
          <Link
            key={link.label}
            href={link.href}
            className={`relative transition-all duration-200 ${
              isBottom
                ? "flex min-w-[4.5rem] flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2"
                : "flex w-full items-center gap-4 rounded-2xl px-3 py-3"
            } ${
              isActive
                ? "bg-gradient-to-r from-primary/20 to-transparent text-primary border border-primary/20"
                : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined flex-shrink-0 text-[22px]" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
              {link.icon}
            </span>
            <span className={`${isBottom ? "max-w-full truncate text-[10px]" : "text-sm"} whitespace-nowrap ${isActive ? "font-semibold" : "font-medium"}`}>{link.label}</span>

            {link.badge && (
              <div
                className={`absolute flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-bold text-white shadow-[0_0_10px_rgba(168,85,247,0.5)] ${
                  isBottom ? "right-2 top-1" : "right-4 top-1/2 -translate-y-1/2"
                }`}
              >
                {link.badge}
              </div>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
