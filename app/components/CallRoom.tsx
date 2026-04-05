"use client";

import { useEffect, useRef, useState } from 'react';
import { useWebRTC } from '@/app/hooks/useWebRTC';
import { useRouter } from 'next/navigation';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Volume2, Volume1 } from 'lucide-react';

interface CallRoomProps {
  roomId: string;
  roomType: 'lobby' | 'group' | 'channel';
  currentUserId: string;
  onLeaveCall?: () => void;
}

const VideoPlayer = ({ stream, isLocal, audioDeviceId }: { stream: MediaStream | null, isLocal?: boolean, audioDeviceId?: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Attempt to set SinkId for loudspeaker control if supported
  useEffect(() => {
    const videoElem = videoRef.current as any;
    if (videoElem && typeof videoElem.setSinkId === 'function' && audioDeviceId) {
      videoElem.setSinkId(audioDeviceId).catch((e: any) => {
        console.error("Error setting audio output device:", e);
      });
    }
  }, [audioDeviceId]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={isLocal} // Always mute local video to avoid echo
      className="w-full h-full object-cover rounded-xl bg-gray-900"
    />
  );
};

export const CallRoom = ({ roomId, roomType, currentUserId, onLeaveCall }: CallRoomProps) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [outputDevices, setOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [loudspeakerDeviceId, setLoudspeakerDeviceId] = useState<string | undefined>();
  const [isLoudspeakerOn, setIsLoudspeakerOn] = useState(false);
  const router = useRouter();

  // Validate User and Join Call logically in backend
  useEffect(() => {
    const checkJoin = async () => {
      try {
        const res = await fetch('/api/calls/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId, roomType })
        });
        if (res.ok) {
          setHasPermission(true);
        } else {
          setHasPermission(false);
        }
      } catch (err) {
        setHasPermission(false);
      }
    };
    checkJoin();

    // Fetch Audio Output Devices for Loudspeaker switch
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const audioOutputs = devices.filter(device => device.kind === 'audiooutput');
      setOutputDevices(audioOutputs);
      
      // If there are multiple audio outputs, try to find one that might be 'speaker' vs 'default'
      // This is highly device dependent, but we enable the basic toggle.
      if (audioOutputs.length > 1) {
         setIsLoudspeakerOn(true); 
      }
    });
  }, [roomId, roomType]);

  const {
    localStream,
    remoteStreams,
    isVideoEnabled,
    isAudioEnabled,
    toggleVideo,
    toggleAudio,
    error
  } = useWebRTC(hasPermission ? roomId : '', currentUserId);

  const toggleLoudspeaker = () => {
    if (outputDevices.length < 2) return; // Cannot toggle if only 1 device
    setIsLoudspeakerOn(prev => !prev);
    // Ideally we cycle between default (earpiece) and speaker.
    // For a generic web approach, we just switch between available devices.
    if (!isLoudspeakerOn) {
       // Turn ON
       const target = outputDevices.find(d => d.label.toLowerCase().includes('speaker')) || outputDevices[outputDevices.length - 1];
       setLoudspeakerDeviceId(target.deviceId);
    } else {
       // Turn OFF (Earpiece/Default)
       const target = outputDevices[0];
       setLoudspeakerDeviceId(target?.deviceId);
    }
  };

  const leaveCall = async () => {
    await fetch('/api/calls/leave', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId })
    });
    if (onLeaveCall) {
      onLeaveCall();
    } else {
      router.back();
    }
  };

  if (hasPermission === false) {
    return <div className="p-8 text-center text-red-500">You do not have permission to join this call.</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  }

  const peers = Object.values(remoteStreams);

  return (
    <div className="flex flex-col h-full w-full bg-black text-white rounded-xl shadow-lg relative">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex justify-between items-center">
        <h2 className="text-xl font-bold">{roomType === 'lobby' ? 'Lobby Call' : 'Group Call'}</h2>
        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded animate-pulse">LIVE</span>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-4 grid gap-4 overflow-y-auto" style={{
        gridTemplateColumns: peers.length === 0 ? '1fr' : peers.length === 1 ? '1fr 1fr' : 'repeat(auto-fit, minmax(250px, 1fr))'
      }}>
        {/* Local Video */}
        <div className="relative rounded-xl overflow-hidden bg-gray-900 border border-gray-800">
          <VideoPlayer stream={localStream} isLocal={true} />
          <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-sm text-gray-200">
            You {!isVideoEnabled && '(Video Off)'}
          </div>
        </div>

        {/* Remote Videos */}
        {peers.map((peer, i) => (
          <div key={i} className="relative rounded-xl overflow-hidden bg-gray-900 border border-gray-800">
            <VideoPlayer stream={peer.stream} audioDeviceId={loudspeakerDeviceId} />
            <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-sm text-gray-200">
               User {peer.userId.slice(-4)}
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="p-6 bg-gray-950 flex justify-center items-center space-x-6 border-t border-gray-800">
        
        {/* Audio Toggle */}
        <button
          onClick={toggleAudio}
          className={`p-4 rounded-full transition-colors ${isAudioEnabled ? 'bg-gray-800 hover:bg-gray-700' : 'bg-red-500 hover:bg-red-600'}`}
          title={isAudioEnabled ? "Mute" : "Unmute"}
        >
          {isAudioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
        </button>

        {/* Video Toggle */}
        <button
          onClick={toggleVideo}
          className={`p-4 rounded-full transition-colors ${isVideoEnabled ? 'bg-gray-800 hover:bg-gray-700' : 'bg-red-500 hover:bg-red-600'}`}
          title={isVideoEnabled ? "Stop Video" : "Start Video"}
        >
          {isVideoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
        </button>

        {/* Loudspeaker Toggle (Only if supported by the device context) */}
        {outputDevices.length > 1 && (
            <button
                onClick={toggleLoudspeaker}
                className={`p-4 rounded-full transition-colors ${isLoudspeakerOn ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-800 hover:bg-gray-700'}`}
                title={isLoudspeakerOn ? "Speaker ON" : "Speaker OFF"}
            >
            {isLoudspeakerOn ? <Volume2 size={24} /> : <Volume1 size={24} />}
            </button>
        )}

        {/* End Call */}
        <button
          onClick={leaveCall}
          className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
          title="Leave Call"
        >
          <PhoneOff size={24} />
        </button>
      </div>
    </div>
  );
};
