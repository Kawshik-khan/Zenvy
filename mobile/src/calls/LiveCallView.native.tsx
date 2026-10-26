import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { AudioSession, LiveKitRoom, VideoTrack, isTrackReference, useConnectionState, useLocalParticipant, useSpeakingParticipants, useTracks, type TrackReferenceOrPlaceholder } from "@livekit/react-native";
import { ConnectionState, Track } from "livekit-client";
import { Mic, MicOff, Phone, SwitchCamera, Video, VideoOff, type LucideIcon } from "lucide-react-native";
import { Avatar, Text } from "../components";
import { initialsOf } from "../auth/AuthProvider";
import { palette } from "../theme/tokens";
import type { LiveCallViewProps } from "./LiveCallView.types";

const tileColors = [palette.chat, palette.focus, palette.match, palette.career, palette.live];

function Control({ icon: Icon, label, onPress, active, danger }: { icon: LucideIcon; label: string; onPress: () => void; active?: boolean; danger?: boolean }) {
  const bg = danger ? palette.alert : active ? palette.quietInk : palette.quietCard;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} accessibilityState={active === undefined ? undefined : { selected: active }} style={({ pressed }) => ({ transform: pressed ? [{ translateX: 3 }, { translateY: 3 }] : undefined })}>
      <View style={{ position: "absolute", top: 3, left: 3, right: -3, bottom: -3, borderRadius: 14, backgroundColor: palette.quietInk }} />
      <View style={{ width: danger ? 72 : 56, height: 56, borderRadius: 14, borderWidth: 2, borderColor: palette.quietInk, backgroundColor: bg, alignItems: "center", justifyContent: "center" }}>
        <Icon size={22} color={active && !danger ? palette.quietCard : palette.quietInk} strokeWidth={2} style={danger ? { transform: [{ rotate: "135deg" }] } : undefined} />
      </View>
    </Pressable>
  );
}

function Tile({ trackRef, index, speaking, count }: { trackRef: TrackReferenceOrPlaceholder; index: number; speaking: boolean; count: number }) {
  const p = trackRef.participant;
  const name = p.isLocal ? "You" : p.name || p.identity;
  const showVideo = isTrackReference(trackRef) && !trackRef.publication.isMuted;
  const micOff = !p.isMicrophoneEnabled;
  return (
    <View
      accessible
      accessibilityLabel={`${name}${speaking ? ", speaking" : ""}${micOff ? ", muted" : ""}${showVideo ? "" : ", camera off"}`}
      style={{ width: count <= 2 ? "100%" : "48.5%", height: count === 1 ? "100%" : "49%", borderRadius: 14, overflow: "hidden", borderWidth: speaking ? 3 : 2, borderColor: speaking ? palette.live : palette.quietInk, backgroundColor: tileColors[index % tileColors.length], alignItems: "center", justifyContent: "center" }}
    >
      {showVideo ? <VideoTrack trackRef={trackRef} style={{ width: "100%", height: "100%" }} objectFit="cover" mirror={p.isLocal} /> : <Avatar initials={initialsOf(p.name || p.identity)} color={palette.quietCard} size={72} />}
      <View style={{ position: "absolute", left: 8, bottom: 8, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: palette.quietCard, borderWidth: 2, borderColor: palette.quietInk, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
        {micOff ? <MicOff size={13} color={palette.quietInk} /> : null}
        <Text variant="h3" style={{ fontSize: 12 }}>
          {name}
          {speaking ? " · speaking" : ""}
        </Text>
      </View>
    </View>
  );
}

function Room({ video, onLeave }: { video: boolean; onLeave: () => void }) {
  const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }], { onlySubscribed: false });
  const speaking = new Set(useSpeakingParticipants().map((p) => p.identity));
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant();
  const connection = useConnectionState();
  const [facing, setFacing] = useState<"user" | "environment">("user");

  return (
    <View style={{ flex: 1, gap: 14 }}>
      {connection !== ConnectionState.Connected ? (
        <Text variant="small" muted accessibilityLiveRegion="polite" style={{ textAlign: "center" }}>
          {connection === ConnectionState.Reconnecting ? "Reconnecting…" : "Connecting…"}
        </Text>
      ) : null}
      <View style={{ flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 10, alignContent: "flex-start" }}>
        {tracks.map((t, i) => (
          <Tile key={`${t.participant.identity}-${t.source}`} trackRef={t} index={i} speaking={speaking.has(t.participant.identity)} count={tracks.length} />
        ))}
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Control icon={isMicrophoneEnabled ? Mic : MicOff} label={isMicrophoneEnabled ? "Mute microphone" : "Unmute microphone"} active={!isMicrophoneEnabled} onPress={() => void localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)} />
        <Control icon={isCameraEnabled ? Video : VideoOff} label={isCameraEnabled ? "Turn camera off" : "Turn camera on"} active={!isCameraEnabled} onPress={() => void localParticipant.setCameraEnabled(!isCameraEnabled)} />
        {video || isCameraEnabled ? (
          <Control
            icon={SwitchCamera}
            label="Switch camera"
            onPress={() => {
              const next = facing === "user" ? "environment" : "user";
              setFacing(next);
              const cam = localParticipant.getTrackPublication(Track.Source.Camera)?.videoTrack;
              void cam?.restartTrack({ facingMode: next });
            }}
          />
        ) : null}
        <Control icon={Phone} label="Leave call" danger onPress={onLeave} />
      </View>
    </View>
  );
}

/** Real call media through LiveKit. Needs a development build or APK (not Expo Go). */
export function LiveCallView({ credentials, video, onLeave }: LiveCallViewProps) {
  const [audioReady, setAudioReady] = useState(false);

  useEffect(() => {
    let stopped = false;
    void AudioSession.startAudioSession().then(() => !stopped && setAudioReady(true));
    return () => {
      stopped = true;
      void AudioSession.stopAudioSession();
    };
  }, []);

  if (!audioReady) {
    return (
      <Text variant="small" muted style={{ textAlign: "center", marginTop: 40 }}>
        Starting audio…
      </Text>
    );
  }

  return (
    <LiveKitRoom serverUrl={credentials.serverUrl} token={credentials.token} connect audio video={video} options={{ adaptiveStream: { pixelDensity: "screen" } }}>
      <Room video={video} onLeave={onLeave} />
    </LiveKitRoom>
  );
}
