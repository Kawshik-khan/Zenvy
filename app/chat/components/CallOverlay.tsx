'use client';

import React, { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import { socket } from '@/lib/socket';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    // Add your TURN server here for reliable mobile NAT traversal:
    // { urls: 'turn:your-turn-server.com:3478', username: 'user', credential: 'pass' },
  ],
};

interface CallOverlayProps {
  currentUser: any;
  targetUser: any;
  roomId: string;
  isIncoming: boolean;
  isVideoCall: boolean;
  onClose: () => void;
  incomingSignal?: any;
}

export default function CallOverlay({
  currentUser,
  targetUser,
  roomId,
  isIncoming,
  isVideoCall,
  onClose,
  incomingSignal
}: CallOverlayProps) {
  const [callStatus, setCallStatus] = useState<'INITIALIZING' | 'RINGING' | 'CONNECTED' | 'ENDED'>('INITIALIZING');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(!isVideoCall);
  const [duration, setDuration] = useState(0);

  const myVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<Peer.Instance | null>(null);

  // Call timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (callStatus === 'CONNECTED') {
      timer = setInterval(() => setDuration(prev => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [callStatus]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  useEffect(() => {
    const initCall = async () => {
      try {
        const constraints = { video: isVideoCall, audio: true };
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = mediaStream;

        if (isVideoCall && myVideo.current) {
          myVideo.current.srcObject = mediaStream;
        }

        if (isIncoming && incomingSignal) {
          answerCall(mediaStream);
        } else {
          startCall(mediaStream);
        }
      } catch (err) {
        console.error("Failed to get local stream", err);
        setCallStatus('ENDED');
        setTimeout(onClose, 2000);
      }
    };

    initCall();

    // Listen for remote hang up
    const handleCallEnded = () => {
      setCallStatus('ENDED');
      streamRef.current?.getTracks().forEach(t => t.stop());
      peerRef.current?.destroy();
      setTimeout(onClose, 1500);
    };

    const handleCallDeclined = () => {
      setCallStatus('ENDED');
      streamRef.current?.getTracks().forEach(t => t.stop());
      peerRef.current?.destroy();
      setTimeout(onClose, 1500);
    };

    socket.on('call_ended', handleCallEnded);
    socket.on('call_declined', handleCallDeclined);

    return () => {
      streamRef.current?.getTracks().forEach(track => track.stop());
      peerRef.current?.destroy();
      socket.off('call_ended', handleCallEnded);
      socket.off('call_declined', handleCallDeclined);
    };
  }, []);

  const startCall = (localStream: MediaStream) => {
    setCallStatus('RINGING');

    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: localStream,
      config: ICE_SERVERS,
    });

    peer.on('signal', (data) => {
      socket.emit('call_user', {
        to: targetUser.id,
        signalData: data,
        callerName: currentUser.name || 'Unknown',
        callerAvatar: currentUser.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name || 'U')}&background=random`,
        isVideo: isVideoCall,
        roomId,
      });
    });

    peer.on('stream', (rStream) => {
      setCallStatus('CONNECTED');
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = rStream;
      }
    });

    peer.on('error', (err) => {
      console.error('Peer error:', err);
      setCallStatus('ENDED');
      setTimeout(onClose, 2000);
    });

    // Listen for the answer signal
    const handleCallAnswered = (signal: any) => {
      setCallStatus('CONNECTED');
      peer.signal(signal);
    };

    socket.on('call_answered', handleCallAnswered);

    peerRef.current = peer;
  };

  const answerCall = (localStream: MediaStream) => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: localStream,
      config: ICE_SERVERS,
    });

    peer.on('signal', (data) => {
      socket.emit('answer_call', {
        to: incomingSignal.from || targetUser.id,
        signalData: data,
      });
    });

    peer.on('stream', (rStream) => {
      setCallStatus('CONNECTED');
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = rStream;
      }
    });

    peer.on('error', (err) => {
      console.error('Peer error:', err);
      setCallStatus('ENDED');
      setTimeout(onClose, 2000);
    });

    peer.signal(incomingSignal.signalData || incomingSignal);
    peerRef.current = peer;
    setCallStatus('CONNECTED'); // Optimistic update, or waiting for stream
  };

  const toggleMute = () => {
    if (streamRef.current) {
      const track = streamRef.current.getAudioTracks()[0];
      if (track) {
        track.enabled = isMuted;
        setIsMuted(!isMuted);
      }
    }
  };

  const toggleVideo = () => {
    if (streamRef.current && isVideoCall) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track) {
        track.enabled = isVideoOff;
        setIsVideoOff(!isVideoOff);
      }
    }
  };

  const endCall = () => {
    socket.emit('end_call', { to: targetUser.id, roomId });
    streamRef.current?.getTracks().forEach(track => track.stop());
    peerRef.current?.destroy();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center p-4 md:p-8 animate-in fade-in zoom-in duration-300">
      <div className="relative w-full max-w-5xl h-full flex flex-col gap-4">

        {/* Call Info Header */}
        <div className="flex items-center justify-between text-white mb-2">
          <div className="flex items-center gap-4">
            <img src={targetUser.avatar} className="w-12 h-12 rounded-full border-2 border-primary" alt={targetUser.name} />
            <div>
              <h3 className="text-xl font-bold">{targetUser.name}</h3>
              <p className="text-xs text-slate-400 capitalize">
                {isVideoCall ? 'Video' : 'Voice'} · {callStatus === 'CONNECTED' ? formatTime(duration) : callStatus.toLowerCase()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-900/50 px-4 py-2 rounded-full backdrop-blur-md">
            <span className={`w-2 h-2 rounded-full ${callStatus === 'CONNECTED' ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`}></span>
            <span className="text-[10px] font-bold uppercase tracking-widest leading-none">
              {callStatus === 'CONNECTED' ? 'Connected' : callStatus === 'RINGING' ? 'Ringing' : 'Initializing'}
            </span>
          </div>
        </div>

        {/* Video Canvas */}
        <div className="flex-1 relative bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-white/5">
          {(!isVideoCall || callStatus !== 'CONNECTED') && (
             <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
                <div className="w-32 h-32 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center relative">
                   <img src={targetUser.avatar} className="w-28 h-28 rounded-full z-10" alt={targetUser.name} />
                   {callStatus === 'RINGING' && (
                     <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping"></div>
                   )}
                </div>
                <p className="text-white text-lg font-medium">
                  {callStatus === 'CONNECTED' ? `In ${isVideoCall ? 'Video' : 'Voice'} Call with ${targetUser.name}` : callStatus === 'ENDED' ? 'Call Ended' : `Calling ${targetUser.name}...`}
                </p>
             </div>
          )}

          {isVideoCall && (
            <video
              ref={remoteVideo}
              autoPlay
              playsInline
              className={`w-full h-full object-cover transition-opacity duration-700 ${callStatus === 'CONNECTED' ? 'opacity-100' : 'opacity-0'}`}
            />
          )}

          {/* Audio element for voice-only calls */}
          {!isVideoCall && (
            <audio ref={remoteVideo as any} autoPlay />
          )}

          {isVideoCall && (
            <div className="absolute bottom-6 right-6 w-32 md:w-48 h-44 md:h-64 bg-slate-800 rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl z-20">
              <video
                ref={myVideo}
                autoPlay
                muted
                playsInline
                className={`w-full h-full object-cover ${isVideoOff ? 'opacity-0' : 'opacity-100'}`}
              />
              {isVideoOff && (
                 <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-white">
                   <span className="material-symbols-outlined text-4xl">videocam_off</span>
                 </div>
              )}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="w-full h-20 flex items-center justify-center gap-4 md:gap-8 bg-slate-900/80 backdrop-blur-xl rounded-full border border-white/5 py-3 px-8 shadow-2xl">
           <button
             onClick={toggleMute}
             className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
           >
             <span className="material-symbols-outlined">{isMuted ? 'mic_off' : 'mic'}</span>
           </button>

           {isVideoCall && (
             <button
               onClick={toggleVideo}
               className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isVideoOff ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
             >
               <span className="material-symbols-outlined">{isVideoOff ? 'videocam_off' : 'videocam'}</span>
             </button>
           )}

           <button
             onClick={endCall}
             className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/30 hover:scale-110 active:scale-95 transition-all"
           >
             <span className="material-symbols-outlined text-3xl">call_end</span>
           </button>
        </div>
      </div>
    </div>
  );
}
