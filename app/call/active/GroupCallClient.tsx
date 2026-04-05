'use client';

import React, { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import { socket } from '@/lib/socket';
import Link from 'next/link';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'turn:relay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
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
  useEffect(() => {
    if (ref.current) {
      ref.current.srcObject = stream;
    }
  }, [stream]);
  return <video ref={ref} autoPlay playsInline className="w-full h-full object-cover rounded-2xl" />;
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
      } else if (signal.candidate) {
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
      } else if (signal.candidate) {
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
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white">
        <span className="material-symbols-outlined text-red-500 text-6xl mb-4">cancel</span>
        <h2 className="text-xl font-bold mb-2">Camera/Mic Access Denied</h2>
        <p className="text-slate-400 max-w-md mx-auto mb-6">You must allow camera and microphone access to join the group call.</p>
        <Link href={`/${type === 'group' ? 'groups' : 'channels'}/${roomId}`} className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold">Go Back</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 z-10 bg-slate-900/50 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-4">
          <Link href={`/${type === 'group' ? 'groups' : 'channels'}/${roomId}`} className="p-2 hover:bg-white/10 rounded-full transition-colors flex items-center justify-center -ml-2">
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </Link>
          <img src={roomAvatar} alt={roomName} className="w-10 h-10 rounded-xl object-cover border border-white/20"/>
          <div>
            <h1 className="font-bold text-lg leading-tight">{roomName}</h1>
            <p className="text-xs text-slate-400 font-medium tracking-wide">
              {totalParticipants} Participant{totalParticipants !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Live Call</span>
        </div>
      </div>

      {/* Grid Canvas */}
      <div className="flex-1 p-2 md:p-6 overflow-hidden flex items-center justify-center relative min-h-0 bg-slate-950">
        <div className={`w-full h-full grid gap-2 md:gap-4 place-items-center ${getGridClass()}`}>
          
          {/* User's Local Video Block */}
          <div className="relative w-full h-full max-h-full rounded-2xl overflow-hidden bg-slate-900 border border-white/5 shadow-2xl group flex items-center justify-center">
            <video 
              ref={localVideoRef} 
              autoPlay 
              playsInline 
              muted 
              className={`w-full h-full object-cover transition-opacity duration-300 ${isVideoOff ? 'opacity-0' : 'opacity-100'}`} 
            />
            {isVideoOff && (
               <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                 <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center">
                   <span className="material-symbols-outlined text-5xl text-slate-400">videocam_off</span>
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
            <div key={p.socketId} className="relative w-full h-full max-h-full rounded-2xl overflow-hidden bg-slate-900 border border-white/5 shadow-2xl flex items-center justify-center">
              <VideoElement stream={p.stream} />
              <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold flex items-center gap-2 z-10">
                <span className="tracking-wide text-white capitalize">{p.userId.substring(0, 6)}...</span>
              </div>
            </div>
          ))}
          
        </div>
      </div>

      {/* Footer Controls */}
      <div className="h-24 bg-slate-900/50 backdrop-blur-xl flex items-center justify-center gap-4 md:gap-8 px-6 border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] shrink-0 z-20">
        <button
          onClick={toggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 ${isMuted ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
        >
          <span className="material-symbols-outlined text-xl">{isMuted ? 'mic_off' : 'mic'}</span>
        </button>

        <button
          onClick={toggleVideo}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 ${isVideoOff ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
        >
          <span className="material-symbols-outlined text-xl">{isVideoOff ? 'videocam_off' : 'videocam'}</span>
        </button>

        <Link
          href={`/${type === 'group' ? 'groups' : 'channels'}/${roomId}`}
          className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl shadow-red-600/30 hover:scale-110 active:scale-95 transition-all mx-2"
          title="Leave Call"
        >
          <span className="material-symbols-outlined text-2xl">call_end</span>
        </Link>
      </div>
    </div>
  );
}
