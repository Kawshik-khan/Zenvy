"use client";

import { ArrowLeft, PhoneOff, Radio } from "lucide-react";
import React, { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCallSession, type CallScope } from "@/app/components/CallProvider";
import FocusHeaderIndicator from "@/app/components/FocusHeaderIndicator";
import { Alert, Avatar, Button, Card, IconButton } from "@/components/ui";

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
  const { activeCallId, error, isConnecting, hasActiveCallSurface, startOrJoinCall, leaveCall } = useCallSession();
  const initializedKeyRef = useRef("");
  const callKey = useMemo(
    () => initialCallId || `${scope?.type || "unknown"}:${scope?.id || "missing"}:${mediaType}`,
    [initialCallId, mediaType, scope?.id, scope?.type],
  );

  useEffect(() => {
    if (initializedKeyRef.current === callKey) return;
    initializedKeyRef.current = callKey;
    startOrJoinCall({ currentUser, initialCallId, scope, title, avatar, mediaType });
  }, [avatar, callKey, currentUser, initialCallId, mediaType, scope, startOrJoinCall, title]);

  if (error) {
    return (
      <main className="quiet flex h-dvh flex-col items-center justify-center gap-5 bg-canvas p-6 text-center text-fg">
        <Alert tone="error" className="max-w-md text-left">
          {error}
        </Alert>
        <div className="flex flex-wrap justify-center gap-3">
          {activeCallId && (
            <Button variant="danger" onClick={leaveCall}>
              Leave current call
            </Button>
          )}
          <Button variant="primary" onClick={() => router.push("/chat")}>
            Go to messages
          </Button>
        </div>
      </main>
    );
  }

  if (hasActiveCallSurface) {
    return null;
  }

  return (
    <div className="quiet flex h-dvh flex-col overflow-hidden bg-canvas text-fg">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b-[length:var(--nb-border-width)] border-line bg-canvas px-3 py-3 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <IconButton size="sm" label="Go back" icon={<ArrowLeft size={20} />} onClick={() => router.back()} />
          <Avatar name={title} src={avatar || currentUser.image} size="md" />
          <div className="min-w-0">
            <h1 className="m-0 truncate font-grotesk text-lg font-bold">{title}</h1>
            <p className="m-0 text-sm text-fg-muted" role="status">
              {isConnecting || !activeCallId ? "Connecting" : "Opening call"}
            </p>
          </div>
        </div>
        <FocusHeaderIndicator />
      </header>
      <main className="flex flex-1 items-center justify-center p-6 text-center">
        <Card shadow="md" className="flex flex-col items-center gap-3">
          <Radio aria-hidden="true" size={40} className="animate-pulse motion-reduce:animate-none" />
          <p className="m-0 font-grotesk font-bold">Connecting media</p>
        </Card>
      </main>
      <footer className="flex min-h-24 shrink-0 items-center justify-center border-t-[length:var(--nb-border-width)] border-line bg-canvas px-3 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
        <IconButton size="lg" variant="danger" label="Leave call" icon={<PhoneOff size={26} />} onClick={leaveCall} />
      </footer>
    </div>
  );
}
