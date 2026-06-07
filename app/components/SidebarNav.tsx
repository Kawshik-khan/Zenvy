"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
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

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 overflow-y-auto overflow-x-hidden hide-scrollbar py-2 px-3 space-y-1">
      {links.map((link) => {
        const isActive = pathname?.startsWith(link.href) || pathname === link.href;
        return (
          <Link
            key={link.label}
            href={link.href}
            className={`flex items-center gap-4 px-3 py-3 rounded-2xl transition-all duration-200 relative w-full ${
              isActive
                ? "bg-gradient-to-r from-primary/20 to-transparent text-primary border border-primary/20"
                : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined flex-shrink-0 text-[22px]" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
              {link.icon}
            </span>
            <span className={`text-sm whitespace-nowrap ${isActive ? "font-semibold" : "font-medium"}`}>{link.label}</span>

            {link.badge && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-secondary text-white text-[10px] font-bold flex items-center justify-center shadow-[0_0_10px_rgba(168,85,247,0.5)]">
                {link.badge}
              </div>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
