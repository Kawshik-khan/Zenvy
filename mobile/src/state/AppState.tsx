import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { dmThreads, groupThreads, groups as sampleGroups, me, notifications as sampleNotifications, stats } from "../data/sample";
import type { AppNotification, ChatMessage } from "../data/types";

type Flags = Record<string, boolean>;

type State = {
  requested: Flags;
  connected: Flags;
  joinedGroups: Flags;
  rsvp: Flags;
  savedJobs: Flags;
  appliedJobs: Flags;
  dms: Record<string, ChatMessage[]>;
  groupChats: Record<string, ChatMessage[]>;
  notifications: AppNotification[];
  focusMinutesToday: number;
  sessionsToday: number;
  profile: {
    studyStyle: string;
    interests: string[];
    times: string[];
    available: boolean;
    push: boolean;
  };
};

const initial: State = {
  requested: {},
  connected: { tanvir: false },
  joinedGroups: Object.fromEntries(sampleGroups.map((g) => [g.id, g.joined])),
  rsvp: { e1: true },
  savedJobs: { "nh-data": true },
  appliedJobs: {},
  dms: dmThreads,
  groupChats: groupThreads,
  notifications: sampleNotifications,
  focusMinutesToday: stats.todayMinutes,
  sessionsToday: stats.sessionsToday,
  profile: { studyStyle: "Pair programming", interests: me.interests.slice(0, 3), times: ["Evening", "Late"], available: true, push: true },
};

function nowLabel() {
  const d = new Date();
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h % 12 || 12}:${m} ${h < 12 ? "AM" : "PM"}`;
}

function useAppStateValue() {
  const [state, setState] = useState<State>(initial);

  const toggle = useCallback((key: "requested" | "joinedGroups" | "rsvp" | "savedJobs" | "appliedJobs", id: string) => {
    setState((s) => ({ ...s, [key]: { ...s[key], [id]: !s[key][id] } }));
  }, []);

  const connect = useCallback((id: string) => {
    setState((s) => ({ ...s, connected: { ...s.connected, [id]: true }, requested: { ...s.requested, [id]: false } }));
  }, []);

  const sendDm = useCallback((personId: string, text: string) => {
    const msg: ChatMessage = { id: `local-${Date.now()}`, authorId: "me", text, time: nowLabel() };
    setState((s) => ({ ...s, dms: { ...s.dms, [personId]: [...(s.dms[personId] ?? []), msg] } }));
  }, []);

  const sendGroup = useCallback((groupId: string, text: string) => {
    const msg: ChatMessage = { id: `local-${Date.now()}`, authorId: "me", text, time: nowLabel() };
    setState((s) => ({ ...s, groupChats: { ...s.groupChats, [groupId]: [...(s.groupChats[groupId] ?? []), msg] } }));
  }, []);

  const markAllRead = useCallback(() => {
    setState((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, unread: false })) }));
  }, []);

  const resolveRequest = useCallback((notificationId: string, accept: boolean) => {
    setState((s) => {
      const n = s.notifications.find((x) => x.id === notificationId);
      return {
        ...s,
        connected: accept && n?.refId ? { ...s.connected, [n.refId]: true } : s.connected,
        notifications: s.notifications.map((x) =>
          x.id === notificationId ? { ...x, kind: "match", unread: false, body: accept ? "is now your study partner." : "request declined.", time: "Just now", refId: accept ? x.refId : undefined } : x,
        ),
      };
    });
  }, []);

  const completeSession = useCallback((minutes: number) => {
    setState((s) => ({ ...s, focusMinutesToday: s.focusMinutesToday + minutes, sessionsToday: s.sessionsToday + 1 }));
  }, []);

  const updateProfile = useCallback((patch: Partial<State["profile"]>) => {
    setState((s) => ({ ...s, profile: { ...s.profile, ...patch } }));
  }, []);

  return useMemo(
    () => ({ state, toggle, connect, sendDm, sendGroup, markAllRead, resolveRequest, completeSession, updateProfile }),
    [state, toggle, connect, sendDm, sendGroup, markAllRead, resolveRequest, completeSession, updateProfile],
  );
}

type AppState = ReturnType<typeof useAppStateValue>;
const Ctx = createContext<AppState | null>(null);

/** In-memory app state for the prototype. Replace the setters with API calls when wiring the backend. */
export function AppStateProvider({ children }: { children: ReactNode }) {
  const value = useAppStateValue();
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used inside AppStateProvider");
  return v;
}

export function unreadCount(n: AppNotification[]) {
  return n.filter((x) => x.unread).length;
}

export function formatBadge(count: number) {
  if (count <= 0) return null;
  return count > 9 ? "9+" : String(count);
}

export function formatMinutes(total: number) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}
