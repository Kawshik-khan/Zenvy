'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LiveKitRoom,
  ParticipantTile,
  RoomAudioRenderer,
  useLocalParticipant,
  useParticipants,
  useRoomContext,
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

type CallApiResponse = {
  call: CallPayload;
  liveKit: LiveKitCredentials;
  error?: string;
};

interface UnifiedCallClientProps {
  currentUser: { id: string; name: string; image: string };
  initialCallId?: string;
  scope?: Scope;
  title: string;
  avatar: string;
  mediaType: 'AUDIO' | 'VIDEO';
}

function CallTiles() {
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
  onError,
  speakerMuted,
  onSpeakerMutedChange,
}: {
  callId: string;
  scope?: Scope;
  onLeave: () => void;
  onError: (message: string) => void;
  speakerMuted: boolean;
  onSpeakerMutedChange: (muted: boolean) => void;
}) {
  const room = useRoomContext();
  const { isCameraEnabled, isMicrophoneEnabled, localParticipant } = useLocalParticipant();
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfo[]>([]);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [mediaPending, setMediaPending] = useState<'audio' | 'video' | 'speaker' | null>(null);
  const supportsAudioOutput = typeof HTMLMediaElement !== 'undefined' && 'setSinkId' in HTMLMediaElement.prototype;

  const emitMediaState = useCallback((next: { audioEnabled?: boolean; videoEnabled?: boolean }) => {
    socket.emit('call:media-state', { callId, ...next });
  }, [callId]);

  useEffect(() => {
    if (!navigator.mediaDevices?.enumerateDevices) return;

    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        setAudioOutputs(devices.filter((device) => device.kind === 'audiooutput'));
      })
      .catch(() => {
        setAudioOutputs([]);
      });
  }, []);

  const toggleMicrophone = useCallback(async () => {
    const enabled = !isMicrophoneEnabled;
    setMediaPending('audio');
    try {
      await localParticipant.setMicrophoneEnabled(enabled);
      emitMediaState({ audioEnabled: enabled });
    } catch (error: any) {
      onError(error?.message || 'Unable to update microphone');
    } finally {
      setMediaPending(null);
    }
  }, [emitMediaState, isMicrophoneEnabled, localParticipant, onError]);

  const toggleCamera = useCallback(async () => {
    const enabled = !isCameraEnabled;
    setMediaPending('video');
    try {
      await localParticipant.setCameraEnabled(enabled);
      emitMediaState({ videoEnabled: enabled });
    } catch (error: any) {
      onError(error?.message || 'Unable to update camera');
    } finally {
      setMediaPending(null);
    }
  }, [emitMediaState, isCameraEnabled, localParticipant, onError]);

  const toggleSpeaker = useCallback(async () => {
    setMediaPending('speaker');
    try {
      const nextMuted = !speakerMuted;
      onSpeakerMutedChange(nextMuted);
      setSpeakerOn(!nextMuted);

      if (!nextMuted && supportsAudioOutput && audioOutputs.length > 1) {
        const target =
          audioOutputs.find((device) => device.label.toLowerCase().includes('speaker')) ||
          audioOutputs.find((device) => device.deviceId !== 'default') ||
          audioOutputs[0];

        if (target) {
          await room.switchActiveDevice('audiooutput', target.deviceId).catch(() => false);
        }
      }
    } finally {
      setMediaPending(null);
    }
  }, [audioOutputs, onSpeakerMutedChange, room, speakerMuted, supportsAudioOutput]);

  const controlClass = 'flex h-14 w-14 items-center justify-center rounded-full bg-surface-container text-on-surface transition-colors hover:bg-surface-container-high disabled:opacity-60';
  const offClass = 'bg-error text-on-error hover:bg-error-dim';

  return (
    <footer className="flex min-h-24 shrink-0 items-center justify-center gap-3 border-t px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3 glass-panel-subtle glass-divider md:gap-4 md:pb-3">
      <button
        type="button"
        onClick={toggleMicrophone}
        disabled={mediaPending === 'audio'}
        className={`${controlClass} ${isMicrophoneEnabled ? '' : offClass}`}
        title={isMicrophoneEnabled ? 'Mute microphone' : 'Unmute microphone'}
        aria-label={isMicrophoneEnabled ? 'Mute microphone' : 'Unmute microphone'}
      >
        <span className="material-symbols-outlined">{isMicrophoneEnabled ? 'mic' : 'mic_off'}</span>
      </button>
      <button
        type="button"
        onClick={toggleCamera}
        disabled={mediaPending === 'video'}
        className={`${controlClass} ${isCameraEnabled ? '' : offClass}`}
        title={isCameraEnabled ? 'Turn camera off' : 'Start video'}
        aria-label={isCameraEnabled ? 'Turn camera off' : 'Start video'}
      >
        <span className="material-symbols-outlined">{isCameraEnabled ? 'videocam' : 'videocam_off'}</span>
      </button>
      <button
        type="button"
        onClick={toggleSpeaker}
        disabled={mediaPending === 'speaker'}
        className={`${controlClass} ${speakerOn && !speakerMuted ? 'bg-primary text-on-primary hover:bg-primary/90' : ''}`}
        title={speakerMuted ? 'Turn speaker on' : 'Mute speaker'}
        aria-label={speakerMuted ? 'Turn speaker on' : 'Mute speaker'}
      >
        <span className="material-symbols-outlined">{speakerMuted ? 'volume_off' : 'volume_up'}</span>
      </button>
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
  const [speakerMuted, setSpeakerMuted] = useState(false);
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
      <RoomAudioRenderer muted={speakerMuted} />
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

      <CallTiles />

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

      <CallControls
        callId={callId}
        scope={scope}
        onLeave={onLeave}
        onError={onError}
        speakerMuted={speakerMuted}
        onSpeakerMutedChange={setSpeakerMuted}
      />
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
        let callId = initialCallId || '';
        let responseData: CallApiResponse;

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
          responseData = startData;
        } else {
          const joinRes = await fetch('/api/calls/join', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ callId }),
          });
          const joinData = await joinRes.json();
          if (!joinRes.ok) throw new Error(joinData.error || 'Unable to join call');
          responseData = joinData;
        }

        if (!responseData.liveKit?.token || !responseData.liveKit?.serverUrl) {
          throw new Error('LiveKit credentials were not returned');
        }

        if (cancelled) return;
        setActiveCallId(callId);
        setCall(responseData.call);
        setCredentials(responseData.liveKit);

        socket.connect();
        socket.emit(initialCallId ? 'call:join' : 'call:start', { callId });
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
      <div className="app-aurora flex h-dvh flex-col overflow-hidden">
        <header className="app-topbar shrink-0">
          <div className="flex min-w-0 items-center gap-3">
            <button onClick={() => router.back()} className="rounded-full p-2 hover:bg-surface-container">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <img alt="" src={avatar || currentUser.image} className="h-10 w-10 rounded-xl bg-surface-container object-cover" />
            <div className="min-w-0">
              <h1 className="truncate font-black">{title}</h1>
              <p className="text-xs text-on-surface-variant">Connecting media...</p>
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
            onClick={() => router.back()}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-error text-on-error hover:bg-error-dim"
            title="Leave Call"
          >
            <span className="material-symbols-outlined text-3xl">call_end</span>
          </button>
        </footer>
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
