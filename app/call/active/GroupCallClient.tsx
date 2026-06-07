'use client';

import React, { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import { socket } from '@/lib/socket';
import Link from 'next/link';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    ...(process.env.NEXT_PUBLIC_TURN_URL
      ? [
          {
            urls: process.env.NEXT_PUBLIC_TURN_URL,
            username: process.env.NEXT_PUBLIC_TURN_USERNAME,
            credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
          },
        ]
      : []),
  ],
};

interface GroupCallClientProps {
  currentUser: { id: string; name: string; image: string };
  roomId: string; // group_123 or channel_456
  roomName: string;
  roomAvatar: string;
  type: string;
}

// A sub-component cleanly handles the video ref and avoids rerenders breaking it
const VideoElement = ({ stream }: { stream: MediaStream }) => {
  const ref = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.srcObject = stream;
    }
    if (audioRef.current) {
      audioRef.current.srcObject = stream;
    }
  }, [stream]);
  return (
    <>
      <audio ref={audioRef} autoPlay playsInline />
      <video ref={ref} autoPlay playsInline muted className="w-full h-full object-cover rounded-2xl" />
    </>
  );
};

export default function GroupCallClient({ currentUser, roomId, roomName, roomAvatar, type }: GroupCallClientProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [hasPermissions, setHasPermissions] = useState<boolean | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  
  // Track `simple-peer` instances per socket ID
  const peersRef = useRef<Map<string, { peer: Peer.Instance, userId: string }>>(new Map());
  
  // Track actual media streams received per socket ID
  const [remoteStreams, setRemoteStreams] = useState<Map<string, { stream: MediaStream, userId: string }>>(new Map());

  // Safe wrapper to add/remove remote streams in state
  const addRemoteStream = (socketId: string, remoteStream: MediaStream, targetUserId: string) => {
    setRemoteStreams(prev => {
      const newMap = new Map(prev);
      newMap.set(socketId, { stream: remoteStream, userId: targetUserId });
      return newMap;
    });
  };

  const removeRemoteStream = (socketId: string) => {
    setRemoteStreams(prev => {
      const newMap = new Map(prev);
      newMap.delete(socketId);
      return newMap;
    });
  };

  // Setup WebRTC and Sockets
  useEffect(() => {
    let localStream: MediaStream | null = null;

    const initializeMedia = async () => {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(localStream);
        setHasPermissions(true);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }

        // Connect Socket
        socket.connect();
        socket.emit('authenticate', { userId: currentUser.id });
        socket.emit('join_group_call', roomId);

        // -- Event Listeners --
        
        socket.on('user_joined_call', (data: { userId: string, socketId: string }) => {
          if (!socket.id) return;
          // Send an offer to the newly joined peer!
          const peer = createPeer(data.socketId, socket.id, localStream!, data.userId);
          peersRef.current.set(data.socketId, { peer, userId: data.userId });
        });

        socket.on('receive_webrtc_offer', (data: { from: string, userId: string, offer: any }) => {
          // Receive an offer, create answering peer!
          const peer = addPeer(data.offer, data.from, localStream!, data.userId);
          peersRef.current.set(data.from, { peer, userId: data.userId });
        });

        socket.on('receive_webrtc_answer', (data: { from: string, userId: string, answer: any }) => {
          const item = peersRef.current.get(data.from);
          if (item) {
            item.peer.signal(data.answer);
          }
        });

        socket.on('receive_ice_candidate', (data: { from: string, candidate: any }) => {
          const item = peersRef.current.get(data.from);
          if (item) {
            item.peer.signal(data.candidate);
          }
        });

        socket.on('user_left_call', (data: { socketId: string }) => {
          console.log('User left the call', data.socketId);
          const item = peersRef.current.get(data.socketId);
          if (item) {
            item.peer.destroy();
            peersRef.current.delete(data.socketId);
          }
          removeRemoteStream(data.socketId);
        });

      } catch (err) {
        console.error("Failed to access media devices:", err);
        setHasPermissions(false);
      }
    };

    initializeMedia();

    // -- Component Cleanup --
    return () => {
      socket.emit('leave_group_call', roomId);
      socket.off('user_joined_call');
      socket.off('receive_webrtc_offer');
      socket.off('receive_webrtc_answer');
      socket.off('receive_ice_candidate');
      socket.off('user_left_call');
      
      peersRef.current.forEach(item => item.peer.destroy());
      peersRef.current.clear();
      setRemoteStreams(new Map());

      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [roomId, currentUser.id]);

  // -- Peer Management Methods --

  const createPeer = (userToSignal: string, callerId: string, currentStream: MediaStream, targetUserId: string) => {
    const peer = new Peer({
      initiator: true,
      trickle: true,
      stream: currentStream,
      config: ICE_SERVERS
    });

    peer.on('signal', signal => {
      if (signal.type === 'offer') {
        socket.emit('webrtc_offer', { to: userToSignal, roomId, offer: signal });
      } else if ((signal as any).candidate) {
        socket.emit('ice_candidate', { to: userToSignal, roomId, candidate: signal });
      }
    });

    peer.on('stream', remoteStream => {
      addRemoteStream(userToSignal, remoteStream, targetUserId);
    });

    peer.on('error', err => console.log('Peer error (caller):', err));

    return peer;
  };

  const addPeer = (incomingSignal: any, callerSocketId: string, currentStream: MediaStream, callerUserId: string) => {
    const peer = new Peer({
      initiator: false,
      trickle: true,
      stream: currentStream,
      config: ICE_SERVERS
    });

    peer.on('signal', signal => {
      if (signal.type === 'answer') {
        socket.emit('webrtc_answer', { to: callerSocketId, roomId, answer: signal });
      } else if ((signal as any).candidate) {
        socket.emit('ice_candidate', { to: callerSocketId, roomId, candidate: signal });
      }
    });

    peer.on('stream', remoteStream => {
      addRemoteStream(callerSocketId, remoteStream, callerUserId);
    });

    peer.on('error', err => console.log('Peer error (receiver):', err));

    peer.signal(incomingSignal);

    return peer;
  };

  // -- Controls --

  const toggleMute = () => {
    if (stream) {
      const track = stream.getAudioTracks()[0];
      if (track) {
        track.enabled = isMuted;
        setIsMuted(!isMuted);
      }
    }
  };

  const toggleVideo = () => {
    if (stream) {
      const track = stream.getVideoTracks()[0];
      if (track) {
        track.enabled = isVideoOff;
        setIsVideoOff(!isVideoOff);
      }
    }
  };

  // Extract participants for dynamic grids
  const remoteParticipants = Array.from(remoteStreams.entries()).map(([socketId, data]) => ({
    socketId,
    stream: data.stream,
    userId: data.userId
  }));

  const totalParticipants = remoteParticipants.length + 1;

  // Render Grid styling dynamically based on number of active peers
  const getGridClass = () => {
    if (totalParticipants === 1) return 'grid-cols-1';
    if (totalParticipants === 2) return 'grid-cols-1 md:grid-cols-2';
    if (totalParticipants <= 4) return 'grid-cols-2';
    if (totalParticipants <= 6) return 'grid-cols-2 md:grid-cols-3';
    return 'grid-cols-3 md:grid-cols-4';
  };

  if (hasPermissions === false) {
    return (
      <div className="app-aurora h-dvh flex flex-col items-center justify-center p-6 text-center">
        <span className="material-symbols-outlined text-error text-6xl mb-4">cancel</span>
        <h2 className="text-xl font-bold mb-2">Camera/Mic Access Denied</h2>
        <p className="text-on-surface-variant max-w-md mx-auto mb-6">You must allow camera and microphone access to join the group call.</p>
        <Link href={`/${type === 'group' ? 'groups' : 'channels'}/${roomId}`} className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold">Go Back</Link>
      </div>
    );
  }

  return (
    <div className="app-aurora flex h-dvh flex-col overflow-hidden">
      {/* Header */}
      <div className="app-topbar shrink-0">
        <div className="flex items-center gap-4">
          <Link href={`/${type === 'group' ? 'groups' : 'channels'}/${roomId}`} className="p-2 hover:bg-surface-container rounded-full transition-colors flex items-center justify-center -ml-2">
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </Link>
          <img src={roomAvatar} alt={roomName} className="w-10 h-10 rounded-xl object-cover border border-outline-variant/30"/>
          <div>
            <h1 className="font-bold text-lg leading-tight">{roomName}</h1>
            <p className="text-xs text-on-surface-variant font-medium tracking-wide">
              {totalParticipants} Participant{totalParticipants !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-accent-green/20 text-accent-green px-3 py-1.5 rounded-full border border-accent-green/30">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse"></span>
          <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Live Call</span>
        </div>
      </div>

      {/* Grid Canvas */}
      <div className="flex-1 p-2 md:p-6 overflow-hidden flex items-center justify-center relative min-h-0">
        <div className={`w-full h-full grid gap-2 md:gap-4 place-items-center ${getGridClass()}`}>
          
          {/* User's Local Video Block */}
          <div className="relative w-full h-full max-h-full rounded-2xl overflow-hidden glass-panel-subtle group flex items-center justify-center">
            <video 
              ref={localVideoRef} 
              autoPlay 
              playsInline 
              muted 
              className={`w-full h-full object-cover transition-opacity duration-300 ${isVideoOff ? 'opacity-0' : 'opacity-100'}`} 
            />
            {isVideoOff && (
               <div className="absolute inset-0 flex items-center justify-center bg-surface-container">
                 <div className="w-24 h-24 rounded-full bg-surface-container-high flex items-center justify-center">
                   <span className="material-symbols-outlined text-5xl text-on-surface-variant">videocam_off</span>
                 </div>
               </div>
            )}
            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold flex items-center gap-2 z-10">
               <span className="text-primary tracking-wider">You</span>
               {isMuted && <span className="material-symbols-outlined text-red-500 text-xs md:text-sm">mic_off</span>}
            </div>
          </div>

          {/* Remote Participants */}
          {remoteParticipants.map((p) => (
            <div key={p.socketId} className="relative w-full h-full max-h-full rounded-2xl overflow-hidden glass-panel-subtle flex items-center justify-center">
              <VideoElement stream={p.stream} />
              <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold flex items-center gap-2 z-10">
                <span className="tracking-wide text-white capitalize">{p.userId.substring(0, 6)}...</span>
              </div>
            </div>
          ))}
          
        </div>
      </div>

      {/* Footer Controls */}
      <div className="min-h-24 glass-panel-subtle flex items-center justify-center gap-3 md:gap-8 px-3 md:px-6 border-t glass-divider shrink-0 z-20 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3 md:pb-3">
        <button
          onClick={toggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 ${isMuted ? 'bg-error text-on-error shadow-error/20' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}
        >
          <span className="material-symbols-outlined text-xl">{isMuted ? 'mic_off' : 'mic'}</span>
        </button>

        <button
          onClick={toggleVideo}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 ${isVideoOff ? 'bg-error text-on-error shadow-error/20' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}
        >
          <span className="material-symbols-outlined text-xl">{isVideoOff ? 'videocam_off' : 'videocam'}</span>
        </button>

        <Link
          href={`/${type === 'group' ? 'groups' : 'channels'}/${roomId}`}
          className="w-16 h-16 rounded-full bg-error text-on-error flex items-center justify-center shadow-xl shadow-error/30 hover:scale-110 active:scale-95 transition-all mx-2"
          title="Leave Call"
        >
          <span className="material-symbols-outlined text-2xl">call_end</span>
        </Link>
      </div>
    </div>
  );
}
