"use client";

import { useEffect, useState } from "react";

export type ShellMetrics = {
  levelTitle: string;
  currentStreakDays: number;
};

const UNREAD_REFRESH_MS = 30_000;

/** Study metrics and unread count for the shell. Carried over from the old Sidebar. */
export function useShellData() {
  const [metrics, setMetrics] = useState<ShellMetrics | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let active = true;
    fetch("/api/study-metrics", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { metrics?: ShellMetrics } | null) => {
        if (active && data?.metrics) setMetrics(data.metrics);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const refresh = () => {
      fetch("/api/conversations/unread", { cache: "no-store" })
        .then((response) => (response.ok ? response.json() : null))
        .then((data: { unreadCount?: number } | null) => {
          if (active) setUnreadCount(Math.max(0, Number(data?.unreadCount || 0)));
        })
        .catch(() => {});
    };

    refresh();
    window.addEventListener("focus", refresh);
    const interval = window.setInterval(refresh, UNREAD_REFRESH_MS);
    return () => {
      active = false;
      window.removeEventListener("focus", refresh);
      window.clearInterval(interval);
    };
  }, []);

  return { metrics, unreadCount };
}
