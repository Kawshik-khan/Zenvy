"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { href: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { href: '/groups', icon: 'group', label: 'Study Groups' },
    { href: '/channels', icon: 'tag', label: 'Channels' },
    { href: '/chat', icon: 'forum', label: 'Chat Rooms' },
    { href: '/matching', icon: 'person_search', label: 'Partner Matching' },
    { href: '/profile', icon: 'account_circle', label: 'Profile' },
    { href: '/scheduling', icon: 'calendar_today', label: 'Scheduling' },
  ];

  return (
    <aside className="fixed left-0 bottom-0 md:top-0 w-full md:w-20 md:hover:w-72 h-16 md:h-full glass-panel-subtle z-[100] transition-all duration-300 group border-t md:border-t-0 md:border-r glass-divider md:overflow-x-hidden md:overflow-y-auto overflow-y-hidden overflow-x-auto no-scrollbar animate-fade-in">
      <div className="p-2 md:p-4 flex flex-row md:flex-col h-full items-center md:items-stretch min-w-max md:min-w-0 pointer-events-auto">
        {/* Logo - Hidden on mobile */}
        <div className="hidden md:flex items-center gap-3 mb-10 mt-4 ml-1">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex-shrink-0 flex items-center justify-center text-white">
            <span className="material-symbols-outlined">school</span>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap overflow-hidden">
            <h1 className="text-2xl font-black tracking-tighter text-on-surface leading-none">Zenvy</h1>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mt-1">Academic Commons</p>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 flex flex-row md:flex-col justify-around md:justify-start w-full md:space-y-1 gap-2 md:gap-0 px-2 md:px-0">
          {links.map((link) => {
            const isActive = (pathname?.startsWith(link.href) && link.href !== '#') || pathname === link.href;
            return (
              <Link 
                key={link.label}
                href={link.href}
                className={`flex items-center gap-1 md:gap-3 px-3 py-2 md:py-3 rounded-xl transition-all duration-200 relative ${
                  isActive 
                    ? 'text-primary bg-primary-container/35'
                    : 'text-on-surface-variant hover:bg-surface-container-high/70 hover:text-on-surface'
                }`}
              >
                {isActive && (
                  <div className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                )}
                <span className="material-symbols-outlined flex-shrink-0 text-2xl md:text-[1.35rem]">{link.icon}</span>
                <span className={`text-[10px] md:text-sm md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap hidden md:inline-block ${isActive ? 'font-bold' : 'font-medium'}`}>{link.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  );
}
