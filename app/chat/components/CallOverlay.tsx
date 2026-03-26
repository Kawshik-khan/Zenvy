'use client';

import React, { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import { socket } from '@/lib/socket';

interface CallOverlayProps {
  currentUser: any;
  targetUser: any;
  roomId: string;
  isIncoming: boolean;
  onClose: () => void;
  incomingSignal?: any;
}

export default function CallOverlay({ 
  currentUser, 
  targetUser, 
  roomId, 
  isIncoming, 
  onClose,
  incomingSignal 
}: CallOverlayProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callStatus, setCallStatus] = useState<'INITIALIZING' | 'RINGING' | 'CONNECTED' | 'ENDED'>('INITIALIZING');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  
  const myVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<Peer.Instance | null>(null);

  useEffect(() => {
    const initCall = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(mediaStream);
        if (myVideo.current) myVideo.current.srcObject = mediaStream;

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

    return () => {
      stream?.getTracks().forEach(track => track.stop());
      peerRef.current?.destroy();
    };
  }, []);

  const startCall = (localStream: MediaStream) => {
    setCallStatus('RINGING');
    
    // Create Peer (initiator)
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: localStream,
    });

    peer.on('signal', (data) => {
      socket.emit('call_user', {
        roomId,
        signalData: data,
        from: currentUser.id,
        name: currentUser.name
      });
    });

    peer.on('stream', (rStream) => {
      setRemoteStream(rStream);
      setCallStatus('CONNECTED');
      if (remoteVideo.current) remoteVideo.current.srcObject = rStream;
    });

    socket.on('call_accepted', (signal) => {
      setCallStatus('CONNECTED');
      peer.signal(signal);
    });

    peerRef.current = peer;
  };

  const answerCall = (localStream: MediaStream) => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: localStream,
    });

    peer.on('signal', (data) => {
      socket.emit('answer_call', { signal: data, to: targetUser.id, roomId });
    });

    peer.on('stream', (rStream) => {
      setRemoteStream(rStream);
      setCallStatus('CONNECTED');
      if (remoteVideo.current) remoteVideo.current.srcObject = rStream;
    });

    peer.signal(incomingSignal);
    peerRef.current = peer;
    setCallStatus('CONNECTED');
  };

  const toggleMute = () => {
    if (stream) {
      stream.getAudioTracks()[0].enabled = isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks()[0].enabled = isVideoOff;
      setIsVideoOff(!isVideoOff);
    }
  };

  const endCall = () => {
    socket.emit('end_call', { roomId });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center p-4 md:p-8 animate-in fade-in zoom-in duration-300">
      <div className="relative w-full max-w-5xl h-full flex flex-col gap-6">
        
        {/* Call Info Header */}
        <div className="flex items-center justify-between text-white mb-4">
          <div className="flex items-center gap-4">
            <img src={targetUser.avatar} className="w-12 h-12 rounded-full border-2 border-primary" alt={targetUser.name} />
            <div>
              <h3 className="text-xl font-bold">{targetUser.name}</h3>
              <p className="text-xs text-slate-400 capitalize">{callStatus.toLowerCase()}...</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-900/50 px-4 py-2 rounded-full backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Secure Connection</span>
          </div>
        </div>

        {/* Video Canvas Container */}
        <div className="flex-1 relative bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-white/5">
          {/* Remote Video (Main) */}
          <video 
            ref={remoteVideo} 
            autoPlay 
            playsInline 
            className={`w-full h-full object-cover transition-opacity duration-700 ${callStatus === 'CONNECTED' ? 'opacity-100' : 'opacity-0'}`} 
          />
          
          {callStatus !== 'CONNECTED' && (
             <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
                <div className="w-32 h-32 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center relative">
                   <img src={targetUser.avatar} className="w-28 h-28 rounded-full z-10" alt={targetUser.name} />
                   <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping"></div>
                </div>
                <p className="text-white text-lg font-medium animate-pulse">Calling {targetUser.name}...</p>
             </div>
          )}

          {/* Local Video (PIP) */}
          <div className="absolute bottom-6 right-6 w-32 md:w-56 h-48 md:h-80 bg-slate-800 rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl z-20">
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
        </div>

        {/* Controls Bar */}
        <div className="w-full h-24 flex items-center justify-center gap-4 md:gap-8 bg-slate-900/80 backdrop-blur-xl rounded-full border border-white/5 py-4 px-8 shadow-2xl">
           <button 
             onClick={toggleMute}
             className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
           >
             <span className="material-symbols-outlined">{isMuted ? 'mic_off' : 'mic'}</span>
           </button>
           
           <button 
             onClick={toggleVideo}
             className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isVideoOff ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
           >
             <span className="material-symbols-outlined">{isVideoOff ? 'videocam_off' : 'videocam'}</span>
           </button>

           <button 
             onClick={endCall}
             className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/30 hover:scale-110 active:scale-95 transition-all"
           >
             <span className="material-symbols-outlined text-3xl">call_end</span>
           </button>
           
           <button className="w-14 h-14 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center hover:bg-slate-700 transition-all">
             <span className="material-symbols-outlined">settings</span>
           </button>
        </div>
      </div>
    </div>
  );
}
