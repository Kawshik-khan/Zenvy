"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { socket } from '@/lib/socket';

type PeerConnectionMap = {
  [socketId: string]: RTCPeerConnection;
};

type RemoteStreamMap = {
  [socketId: string]: {
    stream: MediaStream;
    userId: string;
  };
};

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' }
  ],
};

export const useWebRTC = (roomId: string, currentUserId: string | undefined) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStreamMap>({});
  const [isVideoEnabled, setIsVideoEnabled] = useState(false); // start off by default
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const peersRef = useRef<PeerConnectionMap>({});
  const streamRef = useRef<MediaStream | null>(null);

  // Toggle Video
  const toggleVideo = useCallback(() => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  }, []);

  // Toggle Audio
  const toggleAudio = useCallback(() => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  }, []);

  const createPeerConnection = useCallback((peerSocketId: string, peerUserId: string) => {
    const peer = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks to the connection
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        if (streamRef.current) {
           peer.addTrack(track, streamRef.current);
        }
      });
    }

    // Handle remote tracks
    peer.ontrack = (event) => {
      setRemoteStreams((prev) => ({
        ...prev,
        [peerSocketId]: { stream: event.streams[0], userId: peerUserId },
      }));
    };

    // Handle ICE candidates
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice_candidate', {
          to: peerSocketId,
          roomId,
          candidate: event.candidate,
        });
      }
    };

    return peer;
  }, [roomId]);

  useEffect(() => {
    if (!currentUserId || !roomId) return;

    let isMounted = true;

    const initMediaAndSocket = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true, // We capture it but disable it instantly so we can toggle it later
          audio: true,
        });

        // Start with video off
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.enabled = false;
        }

        if (isMounted) {
          setLocalStream(stream);
          streamRef.current = stream;

          // Connect Socket if not already
          if (!socket.connected) {
            socket.connect();
          }

          // Tell the server we're in
          socket.emit('join_group_call', roomId);
        }
      } catch (err: any) {
        console.error('Error accessing media devices:', err);
        setError('Permissions for audio/video denied.');
      }
    };

    initMediaAndSocket();

    // Socket Event Listeners

    const handleUserJoined = async ({ userId, socketId }: { userId: string; socketId: string }) => {
      if (userId === currentUserId || socketId === socket.id) return; // ignore self
      // We are the caller, we initialize WebRTC offer
      const peer = createPeerConnection(socketId, userId);
      peersRef.current[socketId] = peer;

      try {
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit('webrtc_offer', { to: socketId, roomId, offer });
      } catch (e) {
        console.error('Error creating offer', e);
      }
    };

    const handleReceiveOffer = async ({ from, userId, offer }: { from: string; userId: string; offer: RTCSessionDescriptionInit }) => {
      const peer = createPeerConnection(from, userId);
      peersRef.current[from] = peer;

      try {
        await peer.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket.emit('webrtc_answer', { to: from, roomId, answer });
      } catch (e) {
        console.error('Error handling offer and creating answer', e);
      }
    };

    const handleReceiveAnswer = async ({ from, answer }: { from: string; answer: RTCSessionDescriptionInit }) => {
      const peer = peersRef.current[from];
      if (peer) {
        try {
          await peer.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (e) {
          console.error('Error setting remote description for answer', e);
        }
      }
    };

    const handleReceiveIceCandidate = async ({ from, candidate }: { from: string; candidate: RTCIceCandidateInit }) => {
      const peer = peersRef.current[from];
      if (peer) {
        try {
          await peer.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('Error adding ICE candidate', e);
        }
      }
    };

    const handleUserLeft = ({ socketId }: { socketId: string }) => {
      if (peersRef.current[socketId]) {
        peersRef.current[socketId].close();
        delete peersRef.current[socketId];
      }
      setRemoteStreams((prev) => {
        const newStreams = { ...prev };
        delete newStreams[socketId];
        return newStreams;
      });
    };

    socket.on('user_joined_call', handleUserJoined);
    socket.on('receive_webrtc_offer', handleReceiveOffer);
    socket.on('receive_webrtc_answer', handleReceiveAnswer);
    socket.on('receive_ice_candidate', handleReceiveIceCandidate);
    socket.on('user_left_call', handleUserLeft);

    return () => {
      isMounted = false;
      socket.emit('leave_group_call', roomId);
      socket.off('user_joined_call', handleUserJoined);
      socket.off('receive_webrtc_offer', handleReceiveOffer);
      socket.off('receive_webrtc_answer', handleReceiveAnswer);
      socket.off('receive_ice_candidate', handleReceiveIceCandidate);
      socket.off('user_left_call', handleUserLeft);

      // Cleanup peers
      Object.keys(peersRef.current).forEach((key) => {
        peersRef.current[key].close();
      });
      peersRef.current = {};

      // Cleanup local tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [roomId, currentUserId, createPeerConnection]);

  return {
    localStream,
    remoteStreams,
    isVideoEnabled,
    isAudioEnabled,
    toggleVideo,
    toggleAudio,
    error,
  };
};
