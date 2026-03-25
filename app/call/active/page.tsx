'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { socket } from '@/lib/socket';

function ActiveCallContent() {
  const searchParams = useSearchParams();
  const participantName = searchParams?.get('name') || 'Elena Vance';
  const participantAvatar = searchParams?.get('avatar') || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAsTCrc0yN-lZtLIEOXMm7EIyn2mWqJn7WQpkRmCp8phBfNqvqBZoTtUT_3kqXJkLLtm05ei-g1kdRwegMu9R2c0L-XXwmGyGRbokCno79Gnp4u0aESt8Jtnm85rFELgC75fW2Is9G9l6z6d-KN3yOy1IOw0NOmn5jwAQoreMEwEcNZL1zTBMmfufC_4pXuVuQP01PIUEuPt-SkQJW7M0JznVNJFSQMU1IkB448YvFaBGV5NqvfSgiwcRHFAnA9ieTlPIE3X13ezXI';
  const initialIsVideo = searchParams?.get('type') === 'video';
  const isCaller = searchParams?.get('isCaller') === 'true';
  const roomId = searchParams?.get('roomId') || `call_${participantName.replace(/\s+/g, '_')}`;

  // Local State
  const [duration, setDuration] = useState(0);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(initialIsVideo);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callStatus, setCallStatus] = useState<string>(isCaller ? 'Calling...' : 'Connecting...');

  // Media Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const connectionRef = useRef<any>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Initialize WebRTC and Socket
  useEffect(() => {
    socket.connect();
    socket.emit('join_room', roomId);

    const initCall = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: initialIsVideo, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        const Peer = (await import('simple-peer')).default;

        if (isCaller) {
          // CALLER LOGIC
          // Wait for receiver to be ready to avoid racing
          socket.on('receiver_ready', () => {
            setCallStatus('Ringing...');
            const peer = new Peer({ initiator: true, trickle: false, stream });
            
            peer.on('signal', (data: any) => {
              socket.emit('call_user', { roomId, signalData: data, callerName: 'Me', callerAvatar: '', isVideo: initialIsVideo });
            });

            peer.on('stream', (remoteStream: any) => {
              if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
              setCallStatus('Connected');
            });

            socket.on('call_answered', (signal: any) => {
              peer.signal(signal);
            });

            connectionRef.current = peer;
          });
        } else {
          // RECEIVER LOGIC
          socket.emit('receiver_ready', { roomId });

          socket.on('incoming_call', (data: any) => {
            setCallStatus('Connecting...');
            const peer = new Peer({ initiator: false, trickle: false, stream });

            peer.on('signal', (answerData: any) => {
              socket.emit('answer_call', { roomId, signalData: answerData });
            });

            peer.on('stream', (remoteStream: any) => {
              if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
              setCallStatus('Connected');
            });

            peer.signal(data.signalData);
            connectionRef.current = peer;
          });
        }
      } catch (err) {
        console.error("Failed to get local stream", err);
        setCallStatus('Camera/Mic permission denied.');
      }
    };

    initCall();

    return () => {
      if (connectionRef.current) connectionRef.current.destroy();
      socket.off('receiver_ready');
      socket.off('call_answered');
      socket.off('incoming_call');
      socket.disconnect();
    };
  }, [isCaller, roomId, initialIsVideo]);

  // Timer Effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (callStatus === 'Connected') {
      timer = setInterval(() => setDuration((prev) => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [callStatus]);

  // Format Duration helper
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    if (seconds >= 3600) {
      const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
      return `${h}:${m}:${s}`;
    }
    return `${m}:${s}`;
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks()[0].enabled = isMicMuted;
      setIsMicMuted(!isMicMuted);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current && initialIsVideo) {
      localStreamRef.current.getVideoTracks()[0].enabled = !isVideoOn;
      setIsVideoOn(!isVideoOn);
    }
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-slate-950 text-white overflow-hidden font-sans select-none">
      
      {/* Top Header Bar */}
      <header className="absolute top-0 inset-x-0 z-40 p-6 flex justify-between items-center bg-gradient-to-b from-slate-950/80 to-transparent pointer-events-none">
        <div className="pointer-events-auto">
          <Link href="/chat/personal" className="w-10 h-10 rounded-full bg-slate-800/60 hover:bg-slate-700/80 backdrop-blur-md flex items-center justify-center transition-colors">
            <span className="material-symbols-outlined text-lg">arrow_back</span>
          </Link>
        </div>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 bg-slate-800/60 backdrop-blur-md px-4 py-1.5 rounded-full mb-1">
            <span className="material-symbols-outlined text-[14px] text-emerald-400">lock</span>
            <span className="text-xs font-bold tracking-wider text-slate-200 uppercase">End-to-End Encrypted</span>
          </div>
          <p className="text-sm font-bold font-mono tracking-widest text-slate-300 drop-shadow-md">
            {callStatus === 'Connected' ? formatTime(duration) : callStatus}
          </p>
        </div>

        <div className="pointer-events-auto">
          <div className="w-10 h-10 bg-transparent"></div> {/* Placeholder for balance */}
        </div>
      </header>

      {/* Main Call Canvas/Video Grid */}
      <main className="flex-1 w-full h-full relative z-10 flex items-center justify-center p-4">
        {/* Remote User Focus */}
        <div className="w-full h-full max-w-6xl max-h-[85vh] rounded-3xl overflow-hidden relative shadow-2xl ring-1 ring-white/10 bg-slate-900 flex items-center justify-center group">
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${callStatus === 'Connected' && initialIsVideo ? 'opacity-100' : 'opacity-0'}`} 
          />
          
          {/* Avatar Fallback during connection or voice-only */}
          {(!initialIsVideo || callStatus !== 'Connected') && (
            <div className="flex flex-col items-center gap-6 z-20">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping scale-150" style={{ animationDuration: '2s' }} />
                <img 
                  src={participantAvatar} 
                  className="w-48 h-48 rounded-full object-cover shadow-2xl ring-8 ring-slate-800 relative z-10" 
                  alt="Avatar" 
                />
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-white drop-shadow-xl">{participantName}</h2>
            </div>
          )}

          {/* Remote User Name tag (floating bottom left) */}
          <div className="absolute bottom-6 left-6 bg-slate-900/70 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-3">
            <span className={`w-2 h-2 rounded-full ${callStatus === 'Connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="font-bold text-sm tracking-wide">{participantName}</span>
          </div>
        </div>

        {/* Local User Self-View (Picture-in-Picture) */}
        {initialIsVideo && (
          <div className="absolute top-24 right-8 w-40 h-56 lg:w-48 lg:h-72 bg-slate-800 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-slate-900/50 z-30 transform hover:scale-105 transition-transform cursor-pointer">
            <video 
              ref={localVideoRef} 
              autoPlay 
              playsInline 
              muted 
              className={`w-full h-full object-cover scale-x-[-1] transition-opacity ${isVideoOn ? 'opacity-100' : 'opacity-0'}`}
            />
            {/* Fallback avatar if video is toggled off */}
            {!isVideoOn && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                <span className="material-symbols-outlined text-4xl text-slate-500">person_off</span>
              </div>
            )}
            <div className="absolute bottom-2 left-2 bg-slate-900/80 px-2 py-1 rounded text-[10px] font-bold">You</div>
          </div>
        )}
      </main>

      {/* Bottom Controls Bar */}
      <footer className="relative z-40 w-full pb-8 pt-4 px-4 flex justify-center mt-auto">
        <div className="bg-slate-800/80 backdrop-blur-2xl border border-white/10 px-8 py-4 rounded-full flex items-center gap-6 md:gap-8 shadow-2xl">
          
          {/* Microphone Toggle */}
          <div className="flex flex-col items-center gap-1.5">
            <button 
              onClick={toggleMic}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMicMuted ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-slate-700/50 hover:bg-slate-600 text-slate-200'}`}
            >
              <span className="material-symbols-outlined text-2xl">
                {isMicMuted ? 'mic_off' : 'mic'}
              </span>
            </button>
            <span className="text-[10px] font-bold text-slate-400 tracking-wider">Mute</span>
          </div>

          {/* Video Toggle */}
          <div className="flex flex-col items-center gap-1.5">
            <button 
              onClick={toggleVideo}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${!isVideoOn ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-slate-700/50 hover:bg-slate-600 text-slate-200'}`}
            >
              <span className="material-symbols-outlined text-2xl">
                {!isVideoOn ? 'videocam_off' : 'videocam'}
              </span>
            </button>
            <span className="text-[10px] font-bold text-slate-400 tracking-wider">Video</span>
          </div>
          
          <div className="w-px h-10 bg-white/10 mx-2" />

          {/* End Call Button */}
          <div className="flex flex-col items-center gap-1.5">
            <Link 
              href="/chat/personal"
              className="w-16 h-14 rounded-[20px] bg-rose-500 flex items-center justify-center hover:bg-rose-600 shadow-lg shadow-rose-500/30 hover:scale-105 active:scale-95 transition-all text-white"
            >
              <span className="material-symbols-outlined text-2xl">call_end</span>
            </Link>
            <span className="text-[10px] font-bold text-slate-400 tracking-wider">End</span>
          </div>

        </div>
      </footer>
    </div>
  );
}

export default function ActiveCallPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen w-full items-center justify-center bg-slate-950 text-white">Loading...</div>}>
      <ActiveCallContent />
    </Suspense>
  );
}
