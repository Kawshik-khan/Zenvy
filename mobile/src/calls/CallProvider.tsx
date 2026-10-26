import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { router } from "expo-router";
import { api } from "../api/client";
import type { LiveKitCredentials, ServerCall } from "../api/types";
import { useAuth } from "../auth/AuthProvider";
import { notify } from "../lib/dialog";
import { useSocket } from "../realtime/SocketProvider";

type ActiveCall = { call: ServerCall; liveKit: LiveKitCredentials; title: string };
type CallResponse = { call: ServerCall; liveKit: LiveKitCredentials };

type CallValue = {
  active: ActiveCall | null;
  incoming: ServerCall | null;
  busy: boolean;
  startCall: (input: { conversationId: string; mediaType: "AUDIO" | "VIDEO"; title: string }) => Promise<void>;
  acceptIncoming: () => Promise<void>;
  declineIncoming: () => Promise<void>;
  leaveCall: () => Promise<void>;
};

const CallContext = createContext<CallValue | null>(null);

/** Unanswered calls stop ringing after this long, on both sides. */
const RING_MS = 45_000;

/**
 * Calls use the same server pieces as the web app: REST routes under /api/calls create the
 * CallSession and return LiveKit credentials, the socket rings the other person
 * (`call:start` → their `call:incoming`) and keeps everyone's state in sync (`call:state`).
 */
export function CallProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [active, setActive] = useState<ActiveCall | null>(null);
  const [incoming, setIncoming] = useState<ServerCall | null>(null);
  const [busy, setBusy] = useState(false);
  const activeRef = useRef<ActiveCall | null>(null);
  const incomingRef = useRef<ServerCall | null>(null);
  activeRef.current = active;
  incomingRef.current = incoming;

  const finish = useCallback((message?: string) => {
    setActive(null);
    if (message) notify(message);
    if (router.canGoBack()) router.back();
    else router.replace("/messages");
  }, []);

  const startCall = useCallback<CallValue["startCall"]>(
    async ({ conversationId, mediaType, title }) => {
      if (activeRef.current) return void router.push("/call/live");
      setBusy(true);
      try {
        const res = await api<CallResponse>("/api/calls/start", { method: "POST", body: { conversationId, mediaType } });
        setActive({ ...res, title });
        socket?.emit("call:start", { callId: res.call.id });
        router.push("/call/live");
      } catch (e) {
        notify("Couldn't start the call", e instanceof Error ? e.message : undefined);
      } finally {
        setBusy(false);
      }
    },
    [socket],
  );

  const acceptIncoming = useCallback(async () => {
    const call = incomingRef.current;
    if (!call) return;
    setBusy(true);
    try {
      const res = await api<CallResponse>("/api/calls/join", { method: "POST", body: { callId: call.id } });
      const caller = call.participants.find((p) => p.userId === call.startedById)?.user?.name ?? "Call";
      setIncoming(null);
      setActive({ ...res, title: caller });
      socket?.emit("call:join", { callId: call.id });
      router.replace("/call/live");
    } catch (e) {
      setIncoming(null);
      notify("Couldn't join the call", e instanceof Error ? e.message : undefined);
      if (router.canGoBack()) router.back();
    } finally {
      setBusy(false);
    }
  }, [socket]);

  const declineIncoming = useCallback(async () => {
    const call = incomingRef.current;
    if (!call) return;
    setIncoming(null);
    if (router.canGoBack()) router.back();
    // REST first so the socket's call:state reflects the decline.
    await api("/api/calls/decline", { method: "POST", body: { callId: call.id } }).catch(() => {});
    socket?.emit("call:decline", { callId: call.id });
  }, [socket]);

  const leaveCall = useCallback(async () => {
    const current = activeRef.current;
    if (!current) return finish();
    setActive(null);
    finish();
    await api("/api/calls/leave", { method: "POST", body: { callId: current.call.id } }).catch(() => {});
    socket?.emit("call:leave", { callId: current.call.id });
  }, [socket, finish]);

  // Socket events: ringing, declines, and state changes for the call we are in.
  useEffect(() => {
    if (!socket || !user) return;

    const onIncoming = (call: ServerCall) => {
      if (call.startedById === user.id) return;
      if (activeRef.current) {
        // Already on a call: decline so the caller isn't left ringing.
        void api("/api/calls/decline", { method: "POST", body: { callId: call.id } }).catch(() => {});
        socket.emit("call:decline", { callId: call.id });
        return;
      }
      setIncoming(call);
      router.push("/call/incoming");
    };

    const onDeclined = ({ callId }: { callId: string }) => {
      const current = activeRef.current;
      if (current?.call.id === callId && current.call.type === "DM") {
        void api("/api/calls/leave", { method: "POST", body: { callId } }).catch(() => {});
        finish(`${current.title} can't talk right now.`);
      }
    };

    const onState = (call: ServerCall) => {
      const current = activeRef.current;
      if (current?.call.id === call.id) {
        const others = call.participants.filter((p) => p.userId !== user.id);
        const everyoneLeft = call.type === "DM" && others.length > 0 && others.every((p) => p.status === "LEFT" || p.status === "DECLINED");
        if (call.status === "ENDED" || call.status === "MISSED") finish("Call ended");
        else if (everyoneLeft) {
          // The other person hung up; leave too so the CallSession ends.
          void api("/api/calls/leave", { method: "POST", body: { callId: call.id } }).catch(() => {});
          finish("Call ended");
        } else setActive({ ...current, call });
      }
      if (incomingRef.current?.id === call.id && (call.status === "ENDED" || call.status === "MISSED")) {
        setIncoming(null);
        if (router.canGoBack()) router.back();
      }
    };

    socket.on("call:incoming", onIncoming);
    socket.on("call:declined", onDeclined);
    socket.on("call:state", onState);
    return () => {
      socket.off("call:incoming", onIncoming);
      socket.off("call:declined", onDeclined);
      socket.off("call:state", onState);
    };
  }, [socket, user, finish]);

  // Stop ringing after RING_MS: the caller leaves, the callee's screen closes as a missed call.
  useEffect(() => {
    if (!incoming) return;
    const t = setTimeout(() => {
      if (incomingRef.current?.id !== incoming.id) return;
      setIncoming(null);
      if (router.canGoBack()) router.back();
    }, RING_MS);
    return () => clearTimeout(t);
  }, [incoming]);

  useEffect(() => {
    if (!active || active.call.type !== "DM") return;
    const joinedOthers = active.call.participants.some((p) => p.userId !== user?.id && p.status === "JOINED");
    if (joinedOthers) return;
    const t = setTimeout(() => {
      const current = activeRef.current;
      const answered = current?.call.participants.some((p) => p.userId !== user?.id && p.status === "JOINED");
      if (current?.call.id === active.call.id && !answered) {
        void leaveCall();
        notify("No answer", `${active.title} didn't pick up.`);
      }
    }, RING_MS);
    return () => clearTimeout(t);
  }, [active, user?.id, leaveCall]);

  // Signing out ends any call.
  useEffect(() => {
    if (!user) {
      setActive(null);
      setIncoming(null);
    }
  }, [user]);

  const value = useMemo(
    () => ({ active, incoming, busy, startCall, acceptIncoming, declineIncoming, leaveCall }),
    [active, incoming, busy, startCall, acceptIncoming, declineIncoming, leaveCall],
  );
  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
}

export function useCalls() {
  const value = useContext(CallContext);
  if (!value) throw new Error("useCalls must be used inside CallProvider");
  return value;
}
