"use client";

import React, { useEffect, useState } from 'react';
import SidebarNav from './SidebarNav';

type SidebarMetrics = {
  totalXp: number;
  levelTitle: string;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  levelProgressPercent: number;
  currentStreakDays: number;
  heatmapDays: Array<{ activityCount: number; level: number }>;
};

type SidebarUser = {
  name: string | null;
  image: string | null;
};

type SidebarPayload = {
  user: SidebarUser;
  metrics: SidebarMetrics;
};

const fallbackMetrics: SidebarMetrics = {
  totalXp: 0,
  levelTitle: "Level 1 Scholar",
  xpForCurrentLevel: 0,
  xpForNextLevel: 500,
  levelProgressPercent: 0,
  currentStreakDays: 0,
  heatmapDays: Array.from({ length: 7 }, () => ({ activityCount: 0, level: 0 })),
};

export default function Sidebar() {
  const [payload, setPayload] = useState<SidebarPayload | null>(null);

  useEffect(() => {
    let active = true;

    fetch("/api/study-metrics", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: SidebarPayload | null) => {
        if (active && data) setPayload(data);
      })
      .catch(() => {
        if (active) setPayload(null);
      });

    return () => {
      active = false;
    };
  }, []);

  const user = payload?.user;
  const metrics = payload?.metrics || fallbackMetrics;
  const displayName = user?.name || "Scholar";
  const avatarUrl = user?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;
  const recentDays = metrics.heatmapDays.slice(-7);

  return (
    <aside className="fixed left-4 top-4 bottom-4 w-[250px] z-[100] glass-panel rounded-[28px] flex flex-col hide-scrollbar">
      {/* Logo */}
      <div className="p-6 flex items-center gap-4 cursor-pointer">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex-shrink-0 flex items-center justify-center text-white font-bold text-lg shadow-[0_0_15px_rgba(124,131,255,0.5)]">
          Z
        </div>
        <div className="whitespace-nowrap">
          <h1 className="text-xl font-bold tracking-tight text-on-surface leading-none">Zenvy</h1>
        </div>
      </div>

      {/* Navigation */}
      <SidebarNav />

      {/* User Profile Card at bottom */}
      <div className="p-4 whitespace-nowrap border-t glass-divider">
        <div className="bg-surface-container p-3 rounded-2xl border border-outline-variant/30 flex items-center gap-3 cursor-pointer hover:bg-surface-container-high transition-colors relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-secondary to-primary p-[2px]">
            <div className="w-full h-full rounded-full bg-surface flex items-center justify-center text-on-surface font-bold overflow-hidden">
              <img alt="" className="h-full w-full object-cover" src={avatarUrl} />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-on-surface truncate">{displayName}</p>
            <p className="text-[10px] text-secondary font-medium truncate">{metrics.levelTitle}</p>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant text-sm absolute right-3">expand_less</span>
        </div>

        {/* XP Bar */}
        <div className="mt-4 px-1">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] font-bold text-on-surface-variant">
              {metrics.xpForCurrentLevel.toLocaleString()} / {metrics.xpForNextLevel.toLocaleString()} XP
            </span>
            <span className="text-[10px] font-bold text-primary">{metrics.totalXp.toLocaleString()}</span>
          </div>
          <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-tertiary rounded-full shadow-[0_0_10px_rgba(34,211,238,0.5)]"
              style={{ width: `${metrics.levelProgressPercent}%` }}
            />
          </div>
        </div>

        {/* Study Streak */}
        <div className="mt-4 px-1 pb-2">
          <p className="text-[10px] font-bold text-on-surface-variant mb-1">Study Streak</p>
          <div className="flex items-end gap-2">
            <div className="flex items-center gap-1 text-on-surface">
              <span className="material-symbols-outlined text-secondary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
              <span className="text-xl font-bold">{metrics.currentStreakDays}</span>
            </div>
            <span className="text-[10px] text-on-surface-variant mb-1">days</span>

            {/* Mini Chart */}
            <div className="flex-1 flex items-end justify-end gap-1 h-8 opacity-60">
              {recentDays.map((day, index) => {
                const height = day.level === 0 ? "h-2" : day.level === 1 ? "h-3" : day.level === 2 ? "h-4" : day.level === 3 ? "h-6" : "h-7";
                const color = day.activityCount > 0 ? (index === recentDays.length - 1 ? "bg-tertiary shadow-[0_0_8px_rgba(34,211,238,0.8)]" : "bg-primary") : "bg-surface-container-high";
                return <div key={`${day.activityCount}-${index}`} className={`w-1.5 ${height} ${color} rounded-t-sm`} />;
              })}
            </div>
          </div>
        </div>

        {/* Upgrade Button removed per request */}
      </div>
    </aside>
  );
}
