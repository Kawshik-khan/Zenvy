"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCallSession, type CallScope } from "@/app/components/CallProvider";

interface UnifiedCallClientProps {
  currentUser: { id: string; name: string; image: string };
  initialCallId?: string;
  scope?: CallScope;
  title: string;
  avatar: string;
  mediaType: "AUDIO" | "VIDEO";
}

export default function UnifiedCallClient({
  currentUser,
  initialCallId,
  scope,
  title,
  avatar,
  mediaType,
}: UnifiedCallClientProps) {
  const router = useRouter();
  const { activeCallId, error, isConnecting, startOrJoinCall, leaveCall } = useCallSession();

  useEffect(() => {
    startOrJoinCall({ currentUser, initialCallId, scope, title, avatar, mediaType });
  }, [avatar, currentUser, initialCallId, mediaType, scope, startOrJoinCall, title]);

  if (error) {
    return (
      <div className="app-aurora flex h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
        <span className="material-symbols-outlined text-5xl text-error">error</span>
        <p className="max-w-md text-lg font-bold">{error}</p>
        <div className="flex flex-wrap justify-center gap-3">
          {activeCallId && (
            <button onClick={leaveCall} className="rounded-full bg-error px-5 py-3 font-bold text-on-error">
              Leave Current Call
            </button>
          )}
          <button onClick={() => router.push("/chat")} className="rounded-full bg-primary px-5 py-3 font-bold text-on-primary">
            Go to Chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-aurora flex h-dvh flex-col overflow-hidden">
      <header className="app-topbar shrink-0">
        <div className="flex min-w-0 items-center gap-3">
          <button onClick={() => router.back()} className="rounded-full p-2 hover:bg-surface-container">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <img alt="" src={avatar || currentUser.image} className="h-10 w-10 rounded-xl bg-surface-container object-cover" />
          <div className="min-w-0">
            <h1 className="truncate font-black">{title}</h1>
            <p className="text-xs text-on-surface-variant">
              {isConnecting || !activeCallId ? "Connecting media..." : "Opening call..."}
            </p>
          </div>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center p-6 text-center">
        <div className="rounded-2xl p-6 glass-panel-subtle">
          <span className="material-symbols-outlined animate-pulse text-5xl text-primary">sensors</span>
          <p className="mt-3 text-sm font-bold text-on-surface-variant">Connecting media...</p>
        </div>
      </main>
      <footer className="flex min-h-24 shrink-0 items-center justify-center border-t px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3 glass-panel-subtle glass-divider">
        <button
          onClick={leaveCall}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-error text-on-error hover:bg-error-dim"
          title="Leave Call"
        >
          <span className="material-symbols-outlined text-3xl">call_end</span>
        </button>
      </footer>
    </div>
  );
}
