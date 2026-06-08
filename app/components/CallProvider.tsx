"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LiveKitRoom,
  ParticipantTile,
  RoomAudioRenderer,
  useLocalParticipant,
  useParticipants,
  useRoomContext,
  useTracks,
} from "@livekit/components-react";
import { RoomEvent, Track } from "livekit-client";
import { socket } from "@/lib/socket";
import { focusTracks } from "@/lib/focus-audio";

type CallParticipant = {
  userId: string;
  status: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
  user: { id: string; name: string; image: string | null } | null;
};

type CallPayload = {
  id: string;
  type: string;
  mediaType: string;
  status: string;
  conversationId: string | null;
  groupId: string | null;
  channelId: string | null;
  startedById: string | null;
  participants: CallParticipant[];
};

export type CallScope =
  | { type: "dm"; id: string }
  | { type: "group"; id: string }
  | { type: "channel"; id: string };

type LiveKitCredentials = {
  token: string;
  serverUrl: string;
  roomName: string;
};

type CurrentCallUser = { id: string; name: string; image: string };

type CallSessionInput = {
  currentUser: CurrentCallUser;
  initialCallId?: string;
  scope?: CallScope;
  title: string;
  avatar: string;
  mediaType: "AUDIO" | "VIDEO";
};

type StoredCall = {
  callId: string;
  title: string;
  avatar: string;
  mediaType: "AUDIO" | "VIDEO";
  currentUser: CurrentCallUser;
  scope?: CallScope;
};

type CallContextValue = {
  call: CallPayload | null;
  activeCallId: string;
  error: string | null;
  isConnecting: boolean;
  startOrJoinCall: (input: CallSessionInput) => Promise<void>;
  leaveCall: () => Promise<void>;
  minimizeCall: () => void;
  expandCall: () => void;
};

const CallContext = createContext<CallContextValue | null>(null);
const STORAGE_KEY = "zenvy.activeCall";

export function useCallSession() {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error("useCallSession must be used inside CallProvider");
  }
  return context;
}

function getCallTarget(call: CallPayload | null, fallbackScope?: CallScope) {
  if (!call) return fallbackScope;
  if (call.conversationId) return { type: "dm", id: call.conversationId } as const;
  if (call.groupId) return { type: "group", id: call.groupId } as const;
  if (call.channelId) return { type: "channel", id: call.channelId } as const;
  return fallbackScope;
}

function sameScope(a?: CallScope, b?: CallScope) {
  return Boolean(a && b && a.type === b.type && a.id === b.id);
}

function CallTiles() {
  const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }], {
    updateOnlyOn: [
      RoomEvent.TrackSubscribed,
      RoomEvent.TrackUnsubscribed,
      RoomEvent.ParticipantConnected,
      RoomEvent.ParticipantDisconnected,
      RoomEvent.LocalTrackPublished,
      RoomEvent.LocalTrackUnpublished,
    ],
  });

  return (
    <main
      className="grid flex-1 gap-3 overflow-y-auto p-3 md:gap-4 md:p-6"
      style={{ gridTemplateColumns: tracks.length > 1 ? "repeat(auto-fit, minmax(260px, 1fr))" : "1fr" }}
    >
      {tracks.map((trackRef) => (
        <div key={trackRef.participant.identity} className="min-h-52 overflow-hidden rounded-2xl glass-panel-subtle">
          <ParticipantTile
            trackRef={trackRef}
            className="h-full min-h-52 bg-surface-container-low"
            disableSpeakingIndicator={false}
          />
        </div>
      ))}
      {tracks.length === 0 && (
        <div className="flex min-h-52 items-center justify-center rounded-2xl glass-panel-subtle">
          <p className="text-sm font-bold text-on-surface-variant">Camera is off</p>
        </div>
      )}
    </main>
  );
}

function CallControls({
  callId,
  scope,
  onLeave,
  onMinimize,
  onError,
  speakerMuted,
  onSpeakerMutedChange,
  compact = false,
}: {
  callId: string;
  scope?: CallScope;
  onLeave: () => void;
  onMinimize?: () => void;
  onError: (message: string) => void;
  speakerMuted: boolean;
  onSpeakerMutedChange: (muted: boolean) => void;
  compact?: boolean;
}) {
  const room = useRoomContext();
  const { isCameraEnabled, isMicrophoneEnabled, localParticipant } = useLocalParticipant();
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfo[]>([]);
  const [mediaPending, setMediaPending] = useState<"audio" | "video" | "speaker" | null>(null);
  const supportsAudioOutput = typeof HTMLMediaElement !== "undefined" && "setSinkId" in HTMLMediaElement.prototype;

  const emitMediaState = useCallback(
    (next: { audioEnabled?: boolean; videoEnabled?: boolean }) => {
      socket.emit("call:media-state", { callId, ...next });
    },
    [callId],
  );

  useEffect(() => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => setAudioOutputs(devices.filter((device) => device.kind === "audiooutput")))
      .catch(() => setAudioOutputs([]));
  }, []);

  const toggleMicrophone = useCallback(async () => {
    const enabled = !isMicrophoneEnabled;
    setMediaPending("audio");
    try {
      await localParticipant.setMicrophoneEnabled(enabled);
      emitMediaState({ audioEnabled: enabled });
    } catch (error: any) {
      onError(error?.message || "Unable to update microphone");
    } finally {
      setMediaPending(null);
    }
  }, [emitMediaState, isMicrophoneEnabled, localParticipant, onError]);

  const toggleCamera = useCallback(async () => {
    const enabled = !isCameraEnabled;
    setMediaPending("video");
    try {
      await localParticipant.setCameraEnabled(enabled);
      emitMediaState({ videoEnabled: enabled });
    } catch (error: any) {
      onError(error?.message || "Unable to update camera");
    } finally {
      setMediaPending(null);
    }
  }, [emitMediaState, isCameraEnabled, localParticipant, onError]);

  const toggleSpeaker = useCallback(async () => {
    setMediaPending("speaker");
    try {
      const nextMuted = !speakerMuted;
      onSpeakerMutedChange(nextMuted);

      if (!nextMuted && supportsAudioOutput && audioOutputs.length > 1) {
        const target =
          audioOutputs.find((device) => device.label.toLowerCase().includes("speaker")) ||
          audioOutputs.find((device) => device.deviceId !== "default") ||
          audioOutputs[0];
        if (target) await room.switchActiveDevice("audiooutput", target.deviceId).catch(() => false);
      }
    } finally {
      setMediaPending(null);
    }
  }, [audioOutputs, onSpeakerMutedChange, room, speakerMuted, supportsAudioOutput]);

  const sizeClass = compact ? "h-10 w-10" : "h-14 w-14";
  const controlClass = `flex ${sizeClass} items-center justify-center rounded-full bg-surface-container text-on-surface transition-colors hover:bg-surface-container-high disabled:opacity-60`;
  const offClass = "bg-error text-on-error hover:bg-error-dim";

  return (
    <div className={compact ? "flex items-center gap-2" : "flex items-center justify-center gap-3 md:gap-4"}>
      <button
        type="button"
        onClick={toggleMicrophone}
        disabled={mediaPending === "audio"}
        className={`${controlClass} ${isMicrophoneEnabled ? "" : offClass}`}
        title={isMicrophoneEnabled ? "Mute microphone" : "Unmute microphone"}
        aria-label={isMicrophoneEnabled ? "Mute microphone" : "Unmute microphone"}
      >
        <span className="material-symbols-outlined">{isMicrophoneEnabled ? "mic" : "mic_off"}</span>
      </button>
      <button
        type="button"
        onClick={toggleCamera}
        disabled={mediaPending === "video"}
        className={`${controlClass} ${isCameraEnabled ? "" : offClass}`}
        title={isCameraEnabled ? "Turn camera off" : "Start video"}
        aria-label={isCameraEnabled ? "Turn camera off" : "Start video"}
      >
        <span className="material-symbols-outlined">{isCameraEnabled ? "videocam" : "videocam_off"}</span>
      </button>
      <button
        type="button"
        onClick={toggleSpeaker}
        disabled={mediaPending === "speaker"}
        className={`${controlClass} ${!speakerMuted ? "bg-primary text-on-primary hover:bg-primary/90" : ""}`}
        title={speakerMuted ? "Turn speaker on" : "Mute speaker"}
        aria-label={speakerMuted ? "Turn speaker on" : "Mute speaker"}
      >
        <span className="material-symbols-outlined">{speakerMuted ? "volume_off" : "volume_up"}</span>
      </button>
      {onMinimize && (
        <button
          type="button"
          onClick={onMinimize}
          className={controlClass}
          title="Minimize call"
          aria-label="Minimize call"
        >
          <span className="material-symbols-outlined">picture_in_picture_alt</span>
        </button>
      )}
      {scope?.type === "group" && !compact && (
        <button
          type="button"
          onClick={onMinimize}
          className="hidden rounded-full bg-surface-container px-4 py-2 text-sm font-bold md:inline-flex"
        >
          Back to Group
        </button>
      )}
      <button
        type="button"
        onClick={onLeave}
        className={`flex ${compact ? "h-11 w-11" : "h-16 w-16"} items-center justify-center rounded-full bg-error text-on-error hover:bg-error-dim`}
        title="Leave call"
        aria-label="Leave call"
      >
        <span className={`material-symbols-outlined ${compact ? "text-xl" : "text-3xl"}`}>call_end</span>
      </button>
    </div>
  );
}

function LiveCallSurface({
  callId,
  call,
  mediaType,
  scope,
  title,
  avatar,
  onLeave,
  onMinimize,
  onExpand,
  onError,
  expanded,
}: {
  callId: string;
  call: CallPayload | null;
  mediaType: "AUDIO" | "VIDEO";
  scope?: CallScope;
  title: string;
  avatar: string;
  onLeave: () => void;
  onMinimize: () => void;
  onExpand: () => void;
  onError: (message: string) => void;
  expanded: boolean;
}) {
  const participants = useParticipants();
  const selectedCallTrack = focusTracks[0];
  const callMusicRef = useRef<HTMLAudioElement | null>(null);
  const [callMusicOn, setCallMusicOn] = useState(false);
  const [callMusicAutoStarted, setCallMusicAutoStarted] = useState(false);
  const [callMusicBlocked, setCallMusicBlocked] = useState(false);
  const [callMusicManuallyControlled, setCallMusicManuallyControlled] = useState(false);
  const [speakerMuted, setSpeakerMuted] = useState(false);
  const isAloneInCall = participants.length <= 1;

  const playCallMusic = useCallback(
    async (manual = false) => {
      const audio = callMusicRef.current;
      if (!audio || callMusicOn) return;

      if (manual) setCallMusicManuallyControlled(true);
      setCallMusicBlocked(false);

      try {
        audio.volume = 0.75;
        audio.loop = true;
        await audio.play();
        setCallMusicOn(true);
        setCallMusicAutoStarted(!manual);
      } catch {
        setCallMusicOn(false);
        setCallMusicAutoStarted(false);
        setCallMusicBlocked(true);
      }
    },
    [callMusicOn],
  );

  const pauseCallMusic = useCallback((manual = false) => {
    callMusicRef.current?.pause();
    setCallMusicOn(false);
    setCallMusicAutoStarted(false);
    setCallMusicBlocked(false);
    if (manual) setCallMusicManuallyControlled(true);
  }, []);

  useEffect(() => {
    if (!selectedCallTrack) return;
    if (!isAloneInCall) {
      if (callMusicAutoStarted) pauseCallMusic();
      return;
    }
    if (callMusicOn || callMusicBlocked || callMusicManuallyControlled) return;

    const timer = window.setTimeout(() => playCallMusic(false), 30_000);
    return () => window.clearTimeout(timer);
  }, [
    callMusicAutoStarted,
    callMusicBlocked,
    callMusicManuallyControlled,
    callMusicOn,
    isAloneInCall,
    pauseCallMusic,
    playCallMusic,
    selectedCallTrack,
  ]);

  useEffect(() => () => pauseCallMusic(), [pauseCallMusic]);

  if (!expanded) {
    return (
      <>
        {selectedCallTrack && (
          <audio
            ref={callMusicRef}
            src={selectedCallTrack.src}
            preload="metadata"
            loop
            onEnded={() => setCallMusicOn(false)}
            onError={() => {
              setCallMusicOn(false);
              setCallMusicBlocked(true);
            }}
          />
        )}
        <RoomAudioRenderer muted={speakerMuted} />
        <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-3 right-3 z-[130] mx-auto flex max-w-2xl items-center justify-between gap-3 rounded-3xl border border-white/10 bg-surface-container-low/95 p-3 text-on-surface shadow-2xl backdrop-blur-2xl md:left-auto md:right-6 md:w-[32rem]">
          <button type="button" onClick={onExpand} className="flex min-w-0 flex-1 items-center gap-3 text-left">
            <img alt="" src={avatar} className="h-11 w-11 rounded-2xl bg-surface-container object-cover" />
            <div className="min-w-0">
              <p className="truncate text-sm font-black">{title}</p>
              <p className="truncate text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                {call?.mediaType || mediaType} call - {participants.length || 1} active
              </p>
            </div>
          </button>
          <CallControls
            callId={callId}
            scope={scope}
            onLeave={onLeave}
            onError={onError}
            speakerMuted={speakerMuted}
            onSpeakerMutedChange={setSpeakerMuted}
            compact
          />
        </div>
      </>
    );
  }

  return (
    <div className="fixed inset-0 z-[140] flex h-dvh flex-col overflow-hidden app-aurora">
      {selectedCallTrack && (
        <audio
          ref={callMusicRef}
          src={selectedCallTrack.src}
          preload="metadata"
          loop
          onEnded={() => setCallMusicOn(false)}
          onError={() => {
            setCallMusicOn(false);
            setCallMusicBlocked(true);
          }}
        />
      )}
      <RoomAudioRenderer muted={speakerMuted} />
      <header className="app-topbar shrink-0">
        <div className="flex min-w-0 items-center gap-3">
          <button onClick={onMinimize} className="rounded-full p-2 hover:bg-surface-container" title="Minimize call">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <img alt="" src={avatar} className="h-10 w-10 rounded-xl bg-surface-container object-cover" />
          <div className="min-w-0">
            <h1 className="truncate font-black">{title}</h1>
            <p className="text-xs text-on-surface-variant">
              {call?.mediaType || mediaType} call - {participants.length || 1} active
            </p>
          </div>
        </div>
        {call?.status && (
          <span className="rounded-full bg-accent-green/15 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-accent-green">
            {call.status}
          </span>
        )}
      </header>

      <CallTiles />

      {(isAloneInCall || callMusicOn || callMusicBlocked) && selectedCallTrack && (
        <div className="flex shrink-0 flex-wrap items-center justify-center gap-3 border-t px-4 py-3 glass-panel-subtle glass-divider">
          <div className="min-w-0 text-center md:text-left">
            <p className="truncate text-xs font-black text-on-surface">{selectedCallTrack.title}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              {callMusicBlocked ? "Autoplay blocked" : isAloneInCall ? "Waiting alone in call" : "Local music"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => (callMusicOn ? pauseCallMusic(true) : playCallMusic(true))}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black transition-colors ${
              callMusicOn
                ? "bg-tertiary/15 text-tertiary ring-1 ring-tertiary/30"
                : "bg-surface-container text-on-surface hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-base">{callMusicOn ? "pause" : "music_note"}</span>
            {callMusicOn ? "Pause Music" : callMusicBlocked ? "Music blocked - tap to play" : "Play Music"}
          </button>
        </div>
      )}

      <footer className="flex min-h-24 shrink-0 items-center justify-center border-t px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3 glass-panel-subtle glass-divider">
        <CallControls
          callId={callId}
          scope={scope}
          onLeave={onLeave}
          onMinimize={onMinimize}
          onError={onError}
          speakerMuted={speakerMuted}
          onSpeakerMutedChange={setSpeakerMuted}
        />
      </footer>
    </div>
  );
}

export default function CallProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [call, setCall] = useState<CallPayload | null>(null);
  const [activeCallId, setActiveCallId] = useState("");
  const [credentials, setCredentials] = useState<LiveKitCredentials | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentCallUser | null>(null);
  const [scope, setScope] = useState<CallScope | undefined>();
  const [title, setTitle] = useState("Call");
  const [avatar, setAvatar] = useState("");
  const [mediaType, setMediaType] = useState<"AUDIO" | "VIDEO">("AUDIO");
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const activeCallIdRef = useRef("");
  const callRef = useRef<CallPayload | null>(null);
  const credentialsRef = useRef<LiveKitCredentials | null>(null);
  const scopeRef = useRef<CallScope | undefined>(undefined);
  const mediaTypeRef = useRef<"AUDIO" | "VIDEO">("AUDIO");
  const inFlightKeyRef = useRef("");
  const restoreAttemptedRef = useRef(false);

  const expanded = pathname === "/call/active";
  const liveKitReady = Boolean(credentials?.serverUrl && credentials?.token && activeCallId);

  useEffect(() => {
    activeCallIdRef.current = activeCallId;
    callRef.current = call;
    credentialsRef.current = credentials;
    scopeRef.current = scope;
    mediaTypeRef.current = mediaType;
  }, [activeCallId, call, credentials, mediaType, scope]);

  const persistCall = useCallback((next: StoredCall | null) => {
    if (typeof window === "undefined") return;
    if (!next) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const clearCall = useCallback(() => {
    setCall(null);
    setActiveCallId("");
    setCredentials(null);
    setScope(undefined);
    setError(null);
    setIsConnecting(false);
    activeCallIdRef.current = "";
    callRef.current = null;
    credentialsRef.current = null;
    scopeRef.current = undefined;
    inFlightKeyRef.current = "";
    persistCall(null);
  }, [persistCall]);

  const startOrJoinCall = useCallback(
    async (input: CallSessionInput) => {
      const targetKey = input.initialCallId || `${input.scope?.type || "unknown"}:${input.scope?.id || "missing"}:${input.mediaType}`;
      const currentActiveCallId = activeCallIdRef.current;
      const currentCredentials = credentialsRef.current;
      const currentLiveKitReady = Boolean(currentCredentials?.serverUrl && currentCredentials?.token && currentActiveCallId);
      const activeScope = getCallTarget(callRef.current, scopeRef.current);

      if (
        currentActiveCallId &&
        currentLiveKitReady &&
        ((input.initialCallId && input.initialCallId === currentActiveCallId) || sameScope(input.scope, activeScope))
      ) {
        setCurrentUser(input.currentUser);
        setTitle(input.title);
        setAvatar(input.avatar || input.currentUser.image);
        if (mediaTypeRef.current !== input.mediaType) {
          setMediaType(input.mediaType);
          mediaTypeRef.current = input.mediaType;
        }
        return;
      }

      if (currentActiveCallId && currentLiveKitReady) {
        setError("Leave the current call before joining another one.");
        return;
      }

      if (inFlightKeyRef.current === targetKey) return;
      inFlightKeyRef.current = targetKey;
      setIsConnecting(true);
      setError(null);
      setCurrentUser(input.currentUser);
      setTitle(input.title);
      setAvatar(input.avatar || input.currentUser.image);
      setMediaType(input.mediaType);
      mediaTypeRef.current = input.mediaType;
      setScope(input.scope);
      scopeRef.current = input.scope;

      try {
        let callId = input.initialCallId || "";
        let responseData: { call: CallPayload; liveKit: LiveKitCredentials; error?: string };

        if (!callId) {
          if (!input.scope) throw new Error("Missing call target");
          const body =
            input.scope.type === "dm"
              ? { conversationId: input.scope.id, mediaType: input.mediaType }
              : input.scope.type === "group"
                ? { groupId: input.scope.id, mediaType: input.mediaType }
                : { channelId: input.scope.id, mediaType: input.mediaType };

          const startRes = await fetch("/api/calls/start", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          const startData = await startRes.json();
          if (!startRes.ok) throw new Error(startData.error || "Unable to start call");
          callId = startData.call.id;
          responseData = startData;
        } else {
          const joinRes = await fetch("/api/calls/join", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ callId }),
          });
          const joinData = await joinRes.json();
          if (!joinRes.ok) throw new Error(joinData.error || "Unable to join call");
          responseData = joinData;
        }

        if (!responseData.liveKit?.token || !responseData.liveKit?.serverUrl) {
          throw new Error("LiveKit credentials were not returned");
        }

        const resolvedScope = getCallTarget(responseData.call, input.scope);
        setActiveCallId(callId);
        setCall(responseData.call);
        setCredentials(responseData.liveKit);
        setScope(resolvedScope);
        activeCallIdRef.current = callId;
        callRef.current = responseData.call;
        credentialsRef.current = responseData.liveKit;
        scopeRef.current = resolvedScope;
        socket.connect();
        socket.emit(input.initialCallId ? "call:join" : "call:start", { callId });

        persistCall({
          callId,
          title: input.title,
          avatar: input.avatar || input.currentUser.image,
          mediaType: responseData.call.mediaType === "VIDEO" ? "VIDEO" : "AUDIO",
          currentUser: input.currentUser,
          scope: resolvedScope,
        });
      } catch (err: any) {
        setError(err.message || "Unable to initialize call");
      } finally {
        setIsConnecting(false);
        if (inFlightKeyRef.current === targetKey) inFlightKeyRef.current = "";
      }
    },
    [persistCall],
  );

  useEffect(() => {
    if (typeof window === "undefined" || activeCallId || restoreAttemptedRef.current) return;
    restoreAttemptedRef.current = true;
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored) as StoredCall;
      if (!parsed.callId || !parsed.currentUser) return;
      startOrJoinCall({
        currentUser: parsed.currentUser,
        initialCallId: parsed.callId,
        scope: parsed.scope,
        title: parsed.title || "Call",
        avatar: parsed.avatar || parsed.currentUser.image,
        mediaType: parsed.mediaType || "AUDIO",
      }).catch(() => persistCall(null));
    } catch {
      persistCall(null);
    }
  }, [activeCallId, persistCall, startOrJoinCall]);

  useEffect(() => {
    const onCallState = (payload: CallPayload) => {
      if (payload.id === activeCallId) {
        setCall(payload);
        if (payload.status === "ENDED" || payload.status === "MISSED") clearCall();
      }
    };

    const onCallEnded = (payload: CallPayload | { callId: string }) => {
      if ("id" in payload && payload.id !== activeCallId) return;
      if ("callId" in payload && payload.callId !== activeCallId) return;
      clearCall();
      if (pathname === "/call/active") router.push("/chat");
    };

    const onSocketError = (payload: { message: string }) => setError(payload.message);

    socket.on("call:state", onCallState);
    socket.on("call:ended", onCallEnded);
    socket.on("call:error", onSocketError);

    return () => {
      socket.off("call:state", onCallState);
      socket.off("call:ended", onCallEnded);
      socket.off("call:error", onSocketError);
    };
  }, [activeCallId, clearCall, pathname, router]);

  const leaveCall = useCallback(async () => {
    const callId = activeCallId;
    if (callId) {
      socket.emit("call:leave", { callId });
      await fetch("/api/calls/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callId }),
      }).catch(() => {});
    }
    clearCall();
    if (pathname === "/call/active") router.push("/chat");
  }, [activeCallId, clearCall, pathname, router]);

  const minimizeCall = useCallback(() => {
    if (pathname === "/call/active") router.back();
  }, [pathname, router]);

  const expandCall = useCallback(() => {
    if (!activeCallId) return;
    router.push(`/call/active?callId=${activeCallId}&media=${mediaType === "VIDEO" ? "video" : "audio"}`);
  }, [activeCallId, mediaType, router]);

  const value = useMemo(
    () => ({
      call,
      activeCallId,
      error,
      isConnecting,
      startOrJoinCall,
      leaveCall,
      minimizeCall,
      expandCall,
    }),
    [activeCallId, call, error, expandCall, isConnecting, leaveCall, minimizeCall, startOrJoinCall],
  );

  return (
    <CallContext.Provider value={value}>
      {children}
      {error && !expanded && (
        <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-3 right-3 z-[135] mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl border border-error/30 bg-error-container p-4 text-on-error-container shadow-2xl md:right-6 md:left-auto">
          <p className="text-sm font-bold">{error}</p>
          <button type="button" onClick={() => setError(null)} className="rounded-full p-1 hover:bg-error/10">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      )}
      {liveKitReady && credentials && currentUser && (
        <LiveKitRoom
          serverUrl={credentials.serverUrl}
          token={credentials.token}
          connect
          audio
          video={mediaType === "VIDEO"}
          options={{ adaptiveStream: true, dynacast: true }}
          onError={(liveKitError) => setError(liveKitError.message || "Unable to connect LiveKit call")}
        >
          <LiveCallSurface
            callId={activeCallId}
            call={call}
            mediaType={mediaType}
            scope={scope}
            title={title}
            avatar={avatar || currentUser.image}
            onLeave={leaveCall}
            onMinimize={minimizeCall}
            onExpand={expandCall}
            onError={setError}
            expanded={expanded}
          />
        </LiveKitRoom>
      )}
    </CallContext.Provider>
  );
}
