'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { socket } from '@/lib/socket';

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

interface UnifiedCallClientProps {
  currentUser: { id: string; name: string; image: string };
  initialCallId?: string;
  scope?: Scope;
  title: string;
  avatar: string;
  mediaType: 'AUDIO' | 'VIDEO';
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

function VideoTile({
  stream,
  label,
  muted,
  videoOff,
  avatar,
}: {
  stream: MediaStream | null;
  label: string;
  muted?: boolean;
  videoOff?: boolean;
  avatar?: string | null;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);

  return (
    <div className="relative min-h-52 rounded-2xl overflow-hidden bg-slate-900 border border-white/10 flex items-center justify-center">
      {stream && !videoOff ? (
        <video ref={ref} autoPlay playsInline muted={muted} className="w-full h-full object-cover" />
      ) : (
        <div className="flex flex-col items-center gap-3">
          <img
            alt=""
            className="w-20 h-20 rounded-full object-cover bg-slate-800"
            src={avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(label)}&background=random`}
          />
          <span className="material-symbols-outlined text-slate-500 text-4xl">videocam_off</span>
        </div>
      )}
      <div className="absolute left-3 bottom-3 rounded-lg bg-black/60 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
        {label}
      </div>
    </div>
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
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, { stream: MediaStream; userId: string }>>({});
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(mediaType !== 'VIDEO');
  const [error, setError] = useState<string | null>(null);
  const peersRef = useRef<Record<string, RTCPeerConnection>>({});
  const streamRef = useRef<MediaStream | null>(null);
  const callIdRef = useRef<string | null>(initialCallId || null);

  const activeParticipants = useMemo(
    () => call?.participants.filter((participant) => participant.status === 'JOINED') || [],
    [call]
  );

  const emitMediaState = (next: { audioEnabled?: boolean; videoEnabled?: boolean }) => {
    if (!callIdRef.current) return;
    socket.emit('call:media-state', { callId: callIdRef.current, ...next });
  };

  const createPeer = (targetSocketId: string, targetUserId: string) => {
    if (peersRef.current[targetSocketId]) return peersRef.current[targetSocketId];

    const peer = new RTCPeerConnection(ICE_SERVERS);
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
    }

    peer.ontrack = (event) => {
      setRemoteStreams((prev) => ({
        ...prev,
        [targetSocketId]: { stream: event.streams[0], userId: targetUserId },
      }));
    };

    peer.onicecandidate = (event) => {
      if (event.candidate && callIdRef.current) {
        socket.emit('call:signal', {
          callId: callIdRef.current,
          toSocketId: targetSocketId,
          signal: { candidate: event.candidate },
        });
      }
    };

    peersRef.current[targetSocketId] = peer;
    return peer;
  };

  const joinCall = async (callId: string) => {
    const joinRes = await fetch('/api/calls/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callId }),
    });
    const joinData = await joinRes.json();
    if (!joinRes.ok) throw new Error(joinData.error || 'Unable to join call');
    callIdRef.current = callId;
    setCall(joinData.call);
    socket.emit('call:join', { callId });
  };

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: mediaType === 'VIDEO',
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        setLocalStream(stream);

        socket.connect();

        let activeCallId = initialCallId || null;
        if (!activeCallId) {
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
          activeCallId = startData.call.id;
          setCall(startData.call);
          socket.emit('call:start', { callId: activeCallId });
        }

        if (!activeCallId) throw new Error('Missing call id');
        await joinCall(activeCallId);
      } catch (err: any) {
        setError(err.message || 'Unable to initialize call');
      }
    };

    initialize();

    return () => {
      cancelled = true;
      const activeCallId = callIdRef.current;
      if (activeCallId) {
        socket.emit('call:leave', { callId: activeCallId });
        fetch('/api/calls/leave', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ callId: activeCallId }),
        }).catch(() => {});
      }
      Object.values(peersRef.current).forEach((peer) => peer.close());
      peersRef.current = {};
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [initialCallId, mediaType, scope?.id, scope?.type]);

  useEffect(() => {
    const onPeerJoined = async (data: { callId: string; socketId: string; userId: string }) => {
      if (data.callId !== callIdRef.current || data.userId === currentUser.id) return;
      const peer = createPeer(data.socketId, data.userId);
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      socket.emit('call:signal', {
        callId: data.callId,
        toSocketId: data.socketId,
        signal: { description: peer.localDescription },
      });
    };

    const onSignal = async (data: { callId: string; fromSocketId: string; fromUserId: string; signal: any }) => {
      if (data.callId !== callIdRef.current) return;
      const peer = createPeer(data.fromSocketId, data.fromUserId);

      if (data.signal.description) {
        await peer.setRemoteDescription(new RTCSessionDescription(data.signal.description));
        if (data.signal.description.type === 'offer') {
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          socket.emit('call:signal', {
            callId: data.callId,
            toSocketId: data.fromSocketId,
            signal: { description: peer.localDescription },
          });
        }
      }

      if (data.signal.candidate) {
        await peer.addIceCandidate(new RTCIceCandidate(data.signal.candidate));
      }
    };

    const onPeerLeft = (data: { callId: string; socketId: string }) => {
      if (data.callId !== callIdRef.current) return;
      peersRef.current[data.socketId]?.close();
      delete peersRef.current[data.socketId];
      setRemoteStreams((prev) => {
        const next = { ...prev };
        delete next[data.socketId];
        return next;
      });
    };

    const onCallState = (payload: CallPayload) => {
      if (payload.id === callIdRef.current) setCall(payload);
    };

    const onCallEnded = (payload: CallPayload | { callId: string }) => {
      if ('id' in payload && payload.id !== callIdRef.current) return;
      if ('callId' in payload && payload.callId !== callIdRef.current) return;
      router.back();
    };

    const onError = (payload: { message: string }) => setError(payload.message);

    socket.on('call:peer-joined', onPeerJoined);
    socket.on('call:signal', onSignal);
    socket.on('call:peer-left', onPeerLeft);
    socket.on('call:state', onCallState);
    socket.on('call:ended', onCallEnded);
    socket.on('call:error', onError);

    return () => {
      socket.off('call:peer-joined', onPeerJoined);
      socket.off('call:signal', onSignal);
      socket.off('call:peer-left', onPeerLeft);
      socket.off('call:state', onCallState);
      socket.off('call:ended', onCallEnded);
      socket.off('call:error', onError);
    };
  }, [currentUser.id, router]);

  const toggleMute = () => {
    const track = streamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsMuted(!track.enabled);
    emitMediaState({ audioEnabled: track.enabled });
  };

  const toggleVideo = () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsVideoOff(!track.enabled);
    emitMediaState({ videoEnabled: track.enabled });
  };

  const leaveCall = async () => {
    const activeCallId = callIdRef.current;
    if (activeCallId) {
      socket.emit('call:leave', { callId: activeCallId });
      await fetch('/api/calls/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId: activeCallId }),
      });
    }
    router.back();
  };

  const remoteTiles = Object.entries(remoteStreams);

  if (error) {
    return (
      <div className="h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-4 p-6 text-center">
        <span className="material-symbols-outlined text-5xl text-red-500">error</span>
        <p className="text-lg font-bold">{error}</p>
        <button onClick={() => router.back()} className="rounded-full bg-primary text-on-primary px-5 py-3 font-bold">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-950 text-white flex flex-col overflow-hidden">
      <header className="h-16 px-4 md:px-8 flex items-center justify-between bg-slate-900/80 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-white/10">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <img alt="" src={avatar} className="w-10 h-10 rounded-xl object-cover bg-slate-800" />
          <div className="min-w-0">
            <h1 className="font-black truncate">{title}</h1>
            <p className="text-xs text-slate-400">
              {call?.mediaType || mediaType} call - {activeParticipants.length || 1} active
            </p>
          </div>
        </div>
        {call?.status && (
          <span className="rounded-full bg-emerald-500/15 text-emerald-300 px-3 py-1 text-[10px] font-black uppercase tracking-widest">
            {call.status}
          </span>
        )}
      </header>

      <main className="flex-1 min-h-0 p-3 md:p-6 grid gap-3 md:gap-4 overflow-y-auto" style={{ gridTemplateColumns: remoteTiles.length ? 'repeat(auto-fit, minmax(260px, 1fr))' : '1fr' }}>
        <VideoTile
          stream={localStream}
          label="You"
          muted
          videoOff={isVideoOff || mediaType === 'AUDIO'}
          avatar={currentUser.image}
        />
        {remoteTiles.map(([socketId, item]) => {
          const participant = call?.participants.find((entry) => entry.userId === item.userId);
          return (
            <VideoTile
              key={socketId}
              stream={item.stream}
              label={participant?.user?.name || item.userId.slice(0, 8)}
              videoOff={participant ? !participant.videoEnabled : mediaType === 'AUDIO'}
              avatar={participant?.user?.image}
            />
          );
        })}
      </main>

      <footer className="h-24 bg-slate-900/90 border-t border-white/10 flex items-center justify-center gap-4 shrink-0">
        <button
          onClick={toggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center ${isMuted ? 'bg-red-600' : 'bg-slate-800 hover:bg-slate-700'}`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          <span className="material-symbols-outlined">{isMuted ? 'mic_off' : 'mic'}</span>
        </button>
        {mediaType === 'VIDEO' && (
          <button
            onClick={toggleVideo}
            className={`w-14 h-14 rounded-full flex items-center justify-center ${isVideoOff ? 'bg-red-600' : 'bg-slate-800 hover:bg-slate-700'}`}
            title={isVideoOff ? 'Start Video' : 'Stop Video'}
          >
            <span className="material-symbols-outlined">{isVideoOff ? 'videocam_off' : 'videocam'}</span>
          </button>
        )}
        <button
          onClick={leaveCall}
          className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center"
          title="Leave Call"
        >
          <span className="material-symbols-outlined text-3xl">call_end</span>
        </button>
        {scope?.type === 'group' && (
          <Link href={`/groups/${scope.id}`} className="hidden md:inline-flex px-4 py-2 rounded-full bg-slate-800 text-sm font-bold">
            Back to Group
          </Link>
        )}
      </footer>
    </div>
  );
}
