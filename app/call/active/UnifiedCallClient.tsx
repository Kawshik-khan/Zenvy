'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LiveKitRoom,
  ParticipantTile,
  RoomAudioRenderer,
  TrackToggle,
  useParticipants,
  useTracks,
} from '@livekit/components-react';
import { RoomEvent, Track } from 'livekit-client';
import { socket } from '@/lib/socket';
import { focusTracks } from '@/lib/focus-audio';

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

type Scope =
  | { type: 'dm'; id: string }
  | { type: 'group'; id: string }
  | { type: 'channel'; id: string };

type LiveKitCredentials = {
  token: string;
  serverUrl: string;
  roomName: string;
};

interface UnifiedCallClientProps {
  currentUser: { id: string; name: string; image: string };
  initialCallId?: string;
  scope?: Scope;
  title: string;
  avatar: string;
  mediaType: 'AUDIO' | 'VIDEO';
}

function CallTiles({ mediaType }: { mediaType: 'AUDIO' | 'VIDEO' }) {
  const tracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }],
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

  return (
    <main
      className="grid flex-1 gap-3 overflow-y-auto p-3 md:gap-4 md:p-6"
      style={{ gridTemplateColumns: tracks.length > 1 ? 'repeat(auto-fit, minmax(260px, 1fr))' : '1fr' }}
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
      {mediaType === 'AUDIO' && tracks.length === 0 && (
        <div className="flex min-h-52 items-center justify-center rounded-2xl glass-panel-subtle">
          <p className="text-sm font-bold text-on-surface-variant">Connecting audio...</p>
        </div>
      )}
    </main>
  );
}

function CallControls({
  callId,
  mediaType,
  scope,
  onLeave,
}: {
  callId: string;
  mediaType: 'AUDIO' | 'VIDEO';
  scope?: Scope;
  onLeave: () => void;
}) {
  const emitMediaState = useCallback((next: { audioEnabled?: boolean; videoEnabled?: boolean }) => {
    socket.emit('call:media-state', { callId, ...next });
  }, [callId]);

  return (
    <footer className="flex min-h-24 shrink-0 items-center justify-center gap-3 border-t px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3 glass-panel-subtle glass-divider md:gap-4 md:pb-3">
      <TrackToggle
        source={Track.Source.Microphone}
        showIcon={false}
        onChange={(enabled) => emitMediaState({ audioEnabled: enabled })}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-container text-on-surface hover:bg-surface-container-high data-[lk-enabled=false]:bg-error data-[lk-enabled=false]:text-on-error"
        title="Toggle microphone"
      >
        <span className="material-symbols-outlined">mic</span>
      </TrackToggle>
      {mediaType === 'VIDEO' && (
        <TrackToggle
          source={Track.Source.Camera}
          showIcon={false}
          onChange={(enabled) => emitMediaState({ videoEnabled: enabled })}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-container text-on-surface hover:bg-surface-container-high data-[lk-enabled=false]:bg-error data-[lk-enabled=false]:text-on-error"
          title="Toggle camera"
        >
          <span className="material-symbols-outlined">videocam</span>
        </TrackToggle>
      )}
      <button
        onClick={onLeave}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-error text-on-error hover:bg-error-dim"
        title="Leave Call"
      >
        <span className="material-symbols-outlined text-3xl">call_end</span>
      </button>
      {scope?.type === 'group' && (
        <Link href={`/groups/${scope.id}`} className="hidden rounded-full bg-surface-container px-4 py-2 text-sm font-bold md:inline-flex">
          Back to Group
        </Link>
      )}
    </footer>
  );
}

function LiveKitCallContent({
  callId,
  call,
  mediaType,
  scope,
  title,
  avatar,
  onLeave,
  onError,
}: {
  callId: string;
  call: CallPayload | null;
  mediaType: 'AUDIO' | 'VIDEO';
  scope?: Scope;
  title: string;
  avatar: string;
  onLeave: () => void;
  onError: (message: string) => void;
}) {
  const participants = useParticipants();
  const selectedCallTrack = focusTracks[0];
  const callMusicRef = useRef<HTMLAudioElement | null>(null);
  const [callMusicOn, setCallMusicOn] = useState(false);
  const [callMusicAutoStarted, setCallMusicAutoStarted] = useState(false);
  const [callMusicBlocked, setCallMusicBlocked] = useState(false);
  const [callMusicManuallyControlled, setCallMusicManuallyControlled] = useState(false);
  const isAloneInCall = participants.length <= 1;

  const playCallMusic = useCallback(async (manual = false) => {
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
  }, [callMusicOn]);

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

    const timer = window.setTimeout(() => {
      playCallMusic(false);
    }, 30_000);

    return () => window.clearTimeout(timer);
  }, [callMusicAutoStarted, callMusicBlocked, callMusicManuallyControlled, callMusicOn, isAloneInCall, pauseCallMusic, playCallMusic, selectedCallTrack]);

  useEffect(() => {
    return () => {
      pauseCallMusic();
    };
  }, [pauseCallMusic]);

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
      <RoomAudioRenderer />
      <header className="app-topbar shrink-0">
        <div className="flex min-w-0 items-center gap-3">
          <button onClick={onLeave} className="rounded-full p-2 hover:bg-surface-container">
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

      <CallTiles mediaType={mediaType} />

      {(isAloneInCall || callMusicOn || callMusicBlocked) && selectedCallTrack && (
        <div className="flex shrink-0 flex-wrap items-center justify-center gap-3 border-t px-4 py-3 glass-panel-subtle glass-divider">
          <div className="min-w-0 text-center md:text-left">
            <p className="truncate text-xs font-black text-on-surface">{selectedCallTrack.title}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              {callMusicBlocked ? 'Autoplay blocked' : isAloneInCall ? 'Waiting alone in call' : 'Local music'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => (callMusicOn ? pauseCallMusic(true) : playCallMusic(true))}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black transition-colors ${
              callMusicOn
                ? 'bg-tertiary/15 text-tertiary ring-1 ring-tertiary/30'
                : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-base">{callMusicOn ? 'pause' : 'music_note'}</span>
            {callMusicOn ? 'Pause Music' : callMusicBlocked ? 'Music blocked - tap to play' : 'Play Music'}
          </button>
        </div>
      )}

      <CallControls callId={callId} mediaType={mediaType} scope={scope} onLeave={onLeave} />
    </>
  );
}

function LiveKitCallRoom({
  credentials,
  callId,
  call,
  mediaType,
  scope,
  title,
  avatar,
  onLeave,
  onError,
}: {
  credentials: LiveKitCredentials;
  callId: string;
  call: CallPayload | null;
  mediaType: 'AUDIO' | 'VIDEO';
  scope?: Scope;
  title: string;
  avatar: string;
  onLeave: () => void;
  onError: (message: string) => void;
}) {
  return (
    <LiveKitRoom
      serverUrl={credentials.serverUrl}
      token={credentials.token}
      connect
      audio
      video={mediaType === 'VIDEO'}
      options={{ adaptiveStream: true, dynacast: true }}
      onError={(error) => onError(error.message || 'Unable to connect LiveKit call')}
      className="flex h-dvh flex-col overflow-hidden"
    >
      <LiveKitCallContent
        callId={callId}
        call={call}
        mediaType={mediaType}
        scope={scope}
        title={title}
        avatar={avatar}
        onLeave={onLeave}
        onError={onError}
      />
    </LiveKitRoom>
  );
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
  const [call, setCall] = useState<CallPayload | null>(null);
  const [activeCallId, setActiveCallId] = useState(initialCallId || '');
  const [credentials, setCredentials] = useState<LiveKitCredentials | null>(null);
  const [error, setError] = useState<string | null>(null);

  const liveKitReady = useMemo(
    () => Boolean(credentials?.serverUrl && credentials?.token && activeCallId),
    [activeCallId, credentials],
  );

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      try {
        socket.connect();

        let callId = initialCallId || '';
        if (!callId) {
          if (!scope) throw new Error('Missing call target');
          const body =
            scope.type === 'dm'
              ? { conversationId: scope.id, mediaType }
              : scope.type === 'group'
                ? { groupId: scope.id, mediaType }
                : { channelId: scope.id, mediaType };

          const startRes = await fetch('/api/calls/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
          const startData = await startRes.json();
          if (!startRes.ok) throw new Error(startData.error || 'Unable to start call');
          callId = startData.call.id;
          if (!cancelled) setCall(startData.call);
          socket.emit('call:start', { callId });
        }

        const joinRes = await fetch('/api/calls/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ callId }),
        });
        const joinData = await joinRes.json();
        if (!joinRes.ok) throw new Error(joinData.error || 'Unable to join call');

        const tokenRes = await fetch(`/api/livekit-token?callId=${encodeURIComponent(callId)}`, { cache: 'no-store' });
        const tokenData = await tokenRes.json();
        if (!tokenRes.ok) throw new Error(tokenData.error || 'Unable to get LiveKit token');

        if (cancelled) return;
        setActiveCallId(callId);
        setCall(joinData.call);
        setCredentials(tokenData);
        socket.emit('call:join', { callId });
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Unable to initialize call');
      }
    }

    initialize();

    return () => {
      cancelled = true;
    };
  }, [initialCallId, mediaType, scope]);

  useEffect(() => {
    const onCallState = (payload: CallPayload) => {
      if (payload.id === activeCallId) setCall(payload);
    };

    const onCallEnded = (payload: CallPayload | { callId: string }) => {
      if ('id' in payload && payload.id !== activeCallId) return;
      if ('callId' in payload && payload.callId !== activeCallId) return;
      router.back();
    };

    const onError = (payload: { message: string }) => setError(payload.message);

    socket.on('call:state', onCallState);
    socket.on('call:ended', onCallEnded);
    socket.on('call:error', onError);

    return () => {
      socket.off('call:state', onCallState);
      socket.off('call:ended', onCallEnded);
      socket.off('call:error', onError);
    };
  }, [activeCallId, router]);

  const leaveCall = useCallback(async () => {
    const callId = activeCallId;
    if (callId) {
      socket.emit('call:leave', { callId });
      await fetch('/api/calls/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId }),
      }).catch(() => {});
    }
    router.back();
  }, [activeCallId, router]);

  if (error) {
    return (
      <div className="app-aurora flex h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
        <span className="material-symbols-outlined text-5xl text-error">error</span>
        <p className="text-lg font-bold">{error}</p>
        <button onClick={() => router.back()} className="rounded-full bg-primary px-5 py-3 font-bold text-on-primary">
          Go Back
        </button>
      </div>
    );
  }

  if (!liveKitReady || !credentials) {
    return (
      <div className="app-aurora flex h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
        <span className="material-symbols-outlined animate-pulse text-5xl text-primary">sensors</span>
        <p className="text-sm font-bold text-on-surface-variant">Preparing secure call...</p>
      </div>
    );
  }

  return (
    <div className="app-aurora h-dvh overflow-hidden">
      <LiveKitCallRoom
        credentials={credentials}
        callId={activeCallId}
        call={call}
        mediaType={mediaType}
        scope={scope}
        title={title}
        avatar={avatar || currentUser.image}
        onLeave={leaveCall}
        onError={setError}
      />
    </div>
  );
}
