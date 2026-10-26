import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, setApiToken, setUnauthorizedHandler } from "../api/client";
import { isLive } from "../api/config";
import { readSession, writeSession } from "../api/storage";
import type { AuthResponse, MobileUser } from "../api/types";

type Status = "loading" | "signedOut" | "signedIn" | "demo";

type AuthValue = {
  status: Status;
  user: MobileUser | null;
  signIn: (email: string, password: string, remember?: boolean) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

/**
 * Session for the app. With a backend configured it restores the stored token on launch,
 * checks it against /api/mobile/auth/me and signs out on any 401. Without one it stays in demo mode.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>(isLive ? "loading" : "demo");
  const [user, setUser] = useState<MobileUser | null>(null);

  const clear = useCallback(async () => {
    setApiToken(null);
    await writeSession(null);
    setUser(null);
    setStatus("signedOut");
  }, []);

  useEffect(() => {
    if (!isLive) return;
    setUnauthorizedHandler(() => void clear());
    let cancelled = false;
    (async () => {
      const stored = await readSession();
      if (!stored) return !cancelled && setStatus("signedOut");
      setApiToken(stored.token);
      try {
        const { user: me } = await api<{ user: MobileUser }>("/api/mobile/auth/me");
        if (cancelled) return;
        setUser(me);
        setStatus("signedIn");
      } catch {
        // Offline at launch: keep the session and let screens retry; 401s already cleared it.
        if (!cancelled) setStatus((s) => (s === "loading" ? "signedIn" : s));
      }
    })();
    return () => {
      cancelled = true;
      setUnauthorizedHandler(null);
    };
  }, [clear]);

  const accept = useCallback(async (res: AuthResponse, remember = true) => {
    setApiToken(res.token);
    // "Keep me signed in" off: the token lives in memory only and is gone on the next launch.
    await writeSession(remember ? { token: res.token, expiresAt: res.expiresAt } : null);
    setUser(res.user);
    setStatus("signedIn");
  }, []);

  const signIn = useCallback(
    async (email: string, password: string, remember = true) =>
      accept(await api<AuthResponse>("/api/mobile/auth/login", { method: "POST", body: { email, password }, auth: false }), remember),
    [accept],
  );

  const signUp = useCallback(
    async (name: string, email: string, password: string) =>
      accept(await api<AuthResponse>("/api/mobile/auth/register", { method: "POST", body: { name, email, password }, auth: false })),
    [accept],
  );

  const value = useMemo(() => ({ status, user, signIn, signUp, signOut: clear }), [status, user, signIn, signUp, clear]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}

export function initialsOf(name: string | null | undefined) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}
