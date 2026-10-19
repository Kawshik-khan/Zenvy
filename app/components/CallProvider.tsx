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
import {
  ArrowLeft,
  GripVertical,
  Mic,
  MicOff,
  Music,
  Pause,
  PhoneOff,
  PictureInPicture2,
  ScreenShare,
  ScreenShareOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { Avatar, Badge, Button, cx, IconButton } from "@/components/ui";
import { socket } from "@/lib/socket";
import { focusTracks } from "@/lib/focus-audio";
import { postCallNote, resolveCallNoteTarget } from "@/lib/call-notes";
import FocusHeaderIndicator from "./FocusHeaderIndicator";
import { usePomodoro } from "./PomodoroProvider";
import CallToolsMenu from "./call/CallToolsMenu";
import CallNotePad from "./call/CallNotePad";

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
  hasActiveCallSurface: boolean;
  startOrJoinCall: (input: CallSessionInput) => Promise<void>;
  leaveCall: () => Promise<void>;
  minimizeCall: () => void;
  expandCall: () => void;
};

const CallContext = createContext<CallContextValue | null>(null);
const STORAGE_KEY = "zenvy.activeCall";
const CALL_PANEL_POSITION_PREFIX = "zenvy.callPanelPosition.";
const PANEL_MARGIN = 12;
const MOBILE_BOTTOM_CLEARANCE = 168;
const DESKTOP_BOTTOM_CLEARANCE = 24;

type FloatingPanelPosition = {
  x: number;
  y: number;
};

function getCallPanelPositionKey(callId: string) {
  return `${CALL_PANEL_POSITION_PREFIX}${callId}`;
}

function clearCallPanelPosition(callId: string) {
  if (typeof window === "undefined" || !callId) return;
  window.sessionStorage.removeItem(getCallPanelPositionKey(callId));
}

function clampCallPanelPosition(x: number, y: number, width: number, height: number): FloatingPanelPosition {
  if (typeof window === "undefined") return { x, y };
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const bottomClearance = viewportWidth < 768 ? MOBILE_BOTTOM_CLEARANCE : DESKTOP_BOTTOM_CLEARANCE;
  const maxX = Math.max(PANEL_MARGIN, viewportWidth - width - PANEL_MARGIN);
  const maxY = Math.max(PANEL_MARGIN, viewportHeight - height - bottomClearance);

  return {
    x: Math.min(Math.max(x, PANEL_MARGIN), maxX),
    y: Math.min(Math.max(y, PANEL_MARGIN), maxY),
  };
}

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
  const tracks = useTracks(
    [
      { source: Track.Source.ScreenShare, withPlaceholder: false },
      { source: Track.Source.Camera, withPlaceholder: true },
    ],
    {
      updateOnlyOn: [
        RoomEvent.TrackSubscribed,
        RoomEvent.TrackUnsubscribed,
        RoomEvent.ParticipantConnected,
        RoomEvent.ParticipantDisconnected,
        RoomEvent.LocalTrackPublished,
        RoomEvent.LocalTrackUnpublished,
      ],
    },
  );

  const sortedTracks = [...tracks].sort((a, b) => {
    if (a.source === Track.Source.ScreenShare && b.source !== Track.Source.ScreenShare) return -1;
    if (b.source === Track.Source.ScreenShare && a.source !== Track.Source.ScreenShare) return 1;
    return 0;
  });

  const hasScreenShare = sortedTracks.some((trackRef) => trackRef.source === Track.Source.ScreenShare);

  return (
    <main
      className="grid flex-1 gap-3 overflow-y-auto p-3 md:gap-4 md:p-6"
      style={{
        gridTemplateColumns:
          sortedTracks.length > 1 ? "repeat(auto-fit, minmax(260px, 1fr))" : "1fr",
      }}
    >
      {sortedTracks.map((trackRef) => (
        <div
          key={`${trackRef.participant.identity}-${trackRef.source}`}
          className={cx(
            "relative min-h-52 overflow-hidden rounded-nb-lg border-nb bg-card",
            trackRef.source === Track.Source.ScreenShare && hasScreenShare && "md:col-span-2 md:min-h-72",
          )}
        >
          <ParticipantTile trackRef={trackRef} className="h-full min-h-52 bg-card" disableSpeakingIndicator={false} />
          {trackRef.source === Track.Source.ScreenShare && (
            <Badge tone="chat" size="sm" className="absolute top-3 left-3">
              Sharing screen
            </Badge>
          )}
        </div>
      ))}
      {sortedTracks.length === 0 && (
        <div className="flex min-h-52 items-center justify-center rounded-nb-lg border-nb border-dashed bg-card">
          <p className="m-0 font-grotesk font-bold">Camera is off</p>
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
  onOpenPomodoro,
  onOpenNote,
  compact = false,
}: {
  callId: string;
  scope?: CallScope;
  onLeave: () => void;
  onMinimize?: () => void;
  onError: (message: string) => void;
  speakerMuted: boolean;
  onSpeakerMutedChange: (muted: boolean) => void;
  onOpenPomodoro: () => void;
  onOpenNote: () => void;
  compact?: boolean;
}) {
  const room = useRoomContext();
  const { isCameraEnabled, isMicrophoneEnabled, localParticipant, isScreenShareEnabled } = useLocalParticipant();
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfo[]>([]);
  const [mediaPending, setMediaPending] = useState<"audio" | "video" | "speaker" | "screen" | null>(null);
  const supportsAudioOutput = typeof HTMLMediaElement !== "undefined" && "setSinkId" in HTMLMediaElement.prototype;

  const emitMediaState = useCallback(
    (next: { audioEnabled?: boolean; videoEnabled?: boolean; screenSharing?: boolean }) => {
      socket.emit("call:media-state", { callId, ...next });
    },
    [callId],
  );

  useEffect(() => {
    const handleUnpublished = (publication: { source?: Track.Source }) => {
      if (publication.source === Track.Source.ScreenShare) {
        emitMediaState({ screenSharing: false });
      }
    };

    room.on(RoomEvent.LocalTrackUnpublished, handleUnpublished);
    return () => {
      room.off(RoomEvent.LocalTrackUnpublished, handleUnpublished);
    };
  }, [emitMediaState, room]);

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

  const toggleScreenShare = useCallback(async () => {
    setMediaPending("screen");
    try {
      const enabled = !isScreenShareEnabled;
      await localParticipant.setScreenShareEnabled(enabled);
      emitMediaState({ screenSharing: enabled });
    } catch (error: any) {
      onError(error?.message || "Unable to share screen");
    } finally {
      setMediaPending(null);
    }
  }, [emitMediaState, isScreenShareEnabled, localParticipant, onError]);

  const size = compact ? "sm" : "md";

  return (
    <div className={compact ? "flex items-center gap-2" : "flex flex-wrap items-center justify-center gap-3 md:gap-4"}>
      <IconButton
        size={size}
        variant={isMicrophoneEnabled ? "secondary" : "danger"}
        label={isMicrophoneEnabled ? "Mute microphone" : "Unmute microphone"}
        icon={isMicrophoneEnabled ? <Mic size={20} /> : <MicOff size={20} />}
        onClick={toggleMicrophone}
        disabled={mediaPending === "audio"}
      />
      <IconButton
        size={size}
        variant={isCameraEnabled ? "secondary" : "danger"}
        label={isCameraEnabled ? "Turn camera off" : "Start video"}
        icon={isCameraEnabled ? <Video size={20} /> : <VideoOff size={20} />}
        onClick={toggleCamera}
        disabled={mediaPending === "video"}
      />
      <IconButton
        size={size}
        variant={speakerMuted ? "secondary" : "live"}
        label={speakerMuted ? "Turn speaker on" : "Mute speaker"}
        icon={speakerMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        onClick={toggleSpeaker}
        disabled={mediaPending === "speaker"}
      />
      {onMinimize && <IconButton size={size} label="Minimize call" icon={<PictureInPicture2 size={20} />} onClick={onMinimize} />}
      {scope?.type === "group" && !compact && (
        <span className="hidden md:inline-flex">
          <Button variant="secondary" size="sm" onClick={onMinimize}>
            Back to group
          </Button>
        </span>
      )}
      <IconButton
        size={size}
        variant={isScreenShareEnabled ? "live" : "secondary"}
        label={isScreenShareEnabled ? "Stop screen share" : "Share screen"}
        icon={isScreenShareEnabled ? <ScreenShareOff size={20} /> : <ScreenShare size={20} />}
        onClick={toggleScreenShare}
        disabled={mediaPending === "screen"}
      />
      <CallToolsMenu compact={compact} onOpenPomodoro={onOpenPomodoro} onOpenNote={onOpenNote} />
      <IconButton size={compact ? "sm" : "lg"} variant="danger" label="Leave call" icon={<PhoneOff size={compact ? 20 : 26} />} onClick={onLeave} />
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
  currentUser,
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
  currentUser: CurrentCallUser;
  onLeave: () => void;
  onMinimize: () => void;
  onExpand: () => void;
  onError: (message: string) => void;
  expanded: boolean;
}) {
  const { openPomodoro } = usePomodoro();
  const [notePadOpen, setNotePadOpen] = useState(false);
  const participants = useParticipants();
  const selectedCallTrack = focusTracks[0];
  const callMusicRef = useRef<HTMLAudioElement | null>(null);
  const [callMusicOn, setCallMusicOn] = useState(false);
  const [callMusicAutoStarted, setCallMusicAutoStarted] = useState(false);
  const [callMusicBlocked, setCallMusicBlocked] = useState(false);
  const [callMusicManuallyControlled, setCallMusicManuallyControlled] = useState(false);
  const [speakerMuted, setSpeakerMuted] = useState(false);
  const [panelPosition, setPanelPosition] = useState<FloatingPanelPosition | null>(null);
  const [isPanelDragging, setIsPanelDragging] = useState(false);
  const minimizedPanelRef = useRef<HTMLDivElement | null>(null);
  const panelDragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    lastX: number;
    lastY: number;
    dragged: boolean;
  } | null>(null);
  const suppressPanelExpandRef = useRef(false);
  const isAloneInCall = participants.length <= 1;

  const handleSaveCallNote = useCallback(
    async (content: string) => {
      const target = resolveCallNoteTarget({
        conversationId: call?.conversationId,
        groupId: call?.groupId,
        channelId: call?.channelId,
        scope,
      });
      if (!target) throw new Error("Unable to find chat for this call");
      await postCallNote({
        target,
        sender: currentUser,
        content,
      });
    },
    [call?.channelId, call?.conversationId, call?.groupId, currentUser, scope],
  );

  useEffect(() => {
    if (typeof window === "undefined" || !callId) return;
    const stored = window.sessionStorage.getItem(getCallPanelPositionKey(callId));
    if (!stored) {
      setPanelPosition(null);
      return;
    }

    try {
      const parsed = JSON.parse(stored) as FloatingPanelPosition;
      if (Number.isFinite(parsed.x) && Number.isFinite(parsed.y)) {
        setPanelPosition(parsed);
      } else {
        setPanelPosition(null);
      }
    } catch {
      setPanelPosition(null);
    }
  }, [callId]);

  const persistPanelPosition = useCallback(
    (next: FloatingPanelPosition) => {
      if (typeof window === "undefined" || !callId) return;
      window.sessionStorage.setItem(getCallPanelPositionKey(callId), JSON.stringify(next));
    },
    [callId],
  );

  useEffect(() => {
    if (typeof window === "undefined" || !panelPosition) return;

    const clampStoredPosition = () => {
      const panel = minimizedPanelRef.current;
      if (!panel) return;

      const rect = panel.getBoundingClientRect();
      setPanelPosition((current) => {
        if (!current) return current;
        const next = clampCallPanelPosition(current.x, current.y, rect.width, rect.height);
        if (next.x === current.x && next.y === current.y) return current;
        persistPanelPosition(next);
        return next;
      });
    };

    clampStoredPosition();
    window.addEventListener("resize", clampStoredPosition);
    return () => window.removeEventListener("resize", clampStoredPosition);
  }, [panelPosition, persistPanelPosition]);

  const startPanelDrag = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (event.button !== 0) return;
      const panel = minimizedPanelRef.current;
      if (!panel) return;

      const rect = panel.getBoundingClientRect();
      const origin = panelPosition || clampCallPanelPosition(rect.left, rect.top, rect.width, rect.height);
      setPanelPosition(origin);
      panelDragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originX: origin.x,
        originY: origin.y,
        lastX: origin.x,
        lastY: origin.y,
        dragged: false,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      setIsPanelDragging(true);
    },
    [panelPosition],
  );

  const movePanelDrag = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = panelDragRef.current;
    const panel = minimizedPanelRef.current;
    if (!drag || !panel || drag.pointerId !== event.pointerId) return;

    const rect = panel.getBoundingClientRect();
    const next = clampCallPanelPosition(
      drag.originX + event.clientX - drag.startX,
      drag.originY + event.clientY - drag.startY,
      rect.width,
      rect.height,
    );
    drag.lastX = next.x;
    drag.lastY = next.y;
    if (Math.abs(event.clientX - drag.startX) > 4 || Math.abs(event.clientY - drag.startY) > 4) {
      drag.dragged = true;
      suppressPanelExpandRef.current = true;
    }
    setPanelPosition(next);
  }, []);

  const finishPanelDrag = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      const drag = panelDragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;

      const next = { x: drag.lastX, y: drag.lastY };
      if (drag.dragged) persistPanelPosition(next);
      panelDragRef.current = null;
      setIsPanelDragging(false);
      window.setTimeout(() => {
        suppressPanelExpandRef.current = false;
      }, 0);
    },
    [persistPanelPosition],
  );

  const expandMinimizedPanel = useCallback(() => {
    if (suppressPanelExpandRef.current) return;
    onExpand();
  }, [onExpand]);

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
        <div
          ref={minimizedPanelRef}
          role="region"
          aria-label="Call in progress"
          className={cx(
            "quiet fixed z-[130] flex w-[min(22rem,calc(100vw-1.5rem))] items-center justify-between gap-2 rounded-nb-lg border-nb bg-card p-3 text-fg shadow-nb md:w-[32rem]",
            !panelPosition && "right-3 bottom-[calc(10.5rem+env(safe-area-inset-bottom))] md:right-6 md:bottom-6",
            isPanelDragging && "select-none outline-[3px] outline-offset-2 outline-ink",
          )}
          style={panelPosition ? { left: `${panelPosition.x}px`, top: `${panelPosition.y}px` } : undefined}
        >
          <button
            type="button"
            onPointerDown={startPanelDrag}
            onPointerMove={movePanelDrag}
            onPointerUp={finishPanelDrag}
            onPointerCancel={finishPanelDrag}
            className="nb-focus flex h-11 w-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-nb active:cursor-grabbing"
            title="Drag call panel"
            aria-label="Drag call panel"
          >
            <GripVertical aria-hidden="true" size={20} />
          </button>
          <button type="button" onClick={expandMinimizedPanel} className="nb-focus flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-nb text-left">
            <Avatar name={title} src={avatar} size="md" />
            <span className="min-w-0">
              <span className="block truncate font-grotesk font-bold">{title}</span>
              <span className="block truncate text-sm text-fg-muted">
                {(call?.mediaType || mediaType) === "VIDEO" ? "Video" : "Voice"} call, {participants.length || 1} active
              </span>
            </span>
          </button>
          <CallControls
            callId={callId}
            scope={scope}
            onLeave={onLeave}
            onError={onError}
            speakerMuted={speakerMuted}
            onSpeakerMutedChange={setSpeakerMuted}
            onOpenPomodoro={openPomodoro}
            onOpenNote={() => setNotePadOpen(true)}
            compact
          />
        </div>
        <CallNotePad open={notePadOpen} onClose={() => setNotePadOpen(false)} onSave={handleSaveCallNote} />
      </>
    );
  }

  return (
    <div role="region" aria-label="Call" className="quiet fixed inset-0 z-[140] flex h-dvh flex-col overflow-hidden bg-canvas text-fg">
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
      <header className="flex shrink-0 items-center justify-between gap-3 border-b-[length:var(--nb-border-width)] border-line bg-canvas px-3 py-3 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <IconButton size="sm" label="Minimize call" icon={<ArrowLeft size={20} />} onClick={onMinimize} />
          <Avatar name={title} src={avatar} size="md" />
          <div className="min-w-0">
            <h1 className="m-0 truncate font-grotesk text-lg font-bold">{title}</h1>
            <p className="m-0 text-sm text-fg-muted">
              {(call?.mediaType || mediaType) === "VIDEO" ? "Video" : "Voice"} call, {participants.length || 1} active
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <FocusHeaderIndicator />
          {call?.status && (
            <Badge tone="live" size="sm">
              {call.status.charAt(0) + call.status.slice(1).toLowerCase()}
            </Badge>
          )}
        </div>
      </header>

      <CallTiles />

      {(isAloneInCall || callMusicOn || callMusicBlocked) && selectedCallTrack && (
        <div className="flex shrink-0 flex-wrap items-center justify-center gap-3 border-t-[length:var(--nb-border-width)] border-line bg-card px-4 py-3">
          <div className="min-w-0 text-center md:text-left">
            <p className="m-0 truncate font-grotesk font-bold">{selectedCallTrack.title}</p>
            <p className="m-0 text-sm text-fg-muted">
              {callMusicBlocked ? "Autoplay blocked" : isAloneInCall ? "Waiting alone in the call" : "Local music"}
            </p>
          </div>
          <Button
            variant={callMusicOn ? "focus" : "secondary"}
            size="sm"
            icon={callMusicOn ? <Pause size={16} /> : <Music size={16} />}
            onClick={() => (callMusicOn ? pauseCallMusic(true) : playCallMusic(true))}
          >
            {callMusicOn ? "Pause music" : callMusicBlocked ? "Music blocked, tap to play" : "Play music"}
          </Button>
        </div>
      )}

      <footer className="flex min-h-24 shrink-0 items-center justify-center border-t-[length:var(--nb-border-width)] border-line bg-canvas px-3 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
        <CallControls
          callId={callId}
          scope={scope}
          onLeave={onLeave}
          onMinimize={onMinimize}
          onError={onError}
          speakerMuted={speakerMuted}
          onSpeakerMutedChange={setSpeakerMuted}
          onOpenPomodoro={openPomodoro}
          onOpenNote={() => setNotePadOpen(true)}
        />
      </footer>
      <CallNotePad open={notePadOpen} onClose={() => setNotePadOpen(false)} onSave={handleSaveCallNote} />
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
  const hasActiveCallSurface = Boolean(liveKitReady && currentUser);

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
    const previousCallId = activeCallIdRef.current;
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
    clearCallPanelPosition(previousCallId);
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
      hasActiveCallSurface,
      startOrJoinCall,
      leaveCall,
      minimizeCall,
      expandCall,
    }),
    [activeCallId, call, error, expandCall, hasActiveCallSurface, isConnecting, leaveCall, minimizeCall, startOrJoinCall],
  );

  return (
    <CallContext.Provider value={value}>
      {children}
      {error && !expanded && (
        <div
          role="alert"
          className="quiet fixed right-3 bottom-[calc(10.5rem+env(safe-area-inset-bottom))] left-3 z-[135] mx-auto flex max-w-md items-center justify-between gap-3 rounded-nb-lg border-nb bg-alert p-3 pl-4 font-grotesk font-bold text-ink shadow-nb md:right-6 md:bottom-[calc(1rem+env(safe-area-inset-bottom))] md:left-auto"
        >
          <p className="m-0 text-[15px]">{error}</p>
          <IconButton size="sm" label="Dismiss" icon={<X size={18} />} onClick={() => setError(null)} />
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
            currentUser={currentUser}
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
