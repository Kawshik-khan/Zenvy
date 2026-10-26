import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ellipsis, FileText, Mic, MicOff, MonitorUp, Phone, Timer, Video, VideoOff, type LucideIcon } from "lucide-react-native";
import { Avatar, ProgressBar, Screen, Surface, Text } from "../../components";
import { formatClock } from "../../lib/useFocusTimer";
import { confirm, notify } from "../../lib/dialog";
import { palette } from "../../theme/tokens";

const tiles = [
  { id: "tanvir", initials: "TA", name: "Tanvir", fill: palette.chat, speaking: true },
  { id: "farhan", initials: "FJ", name: "Farhan", fill: palette.focus },
  { id: "rafia", initials: "RI", name: "Rafia", fill: palette.match, muted: true },
];

function Control({ icon: Icon, label, onPress, active, danger, wide }: { icon: LucideIcon; label: string; onPress: () => void; active?: boolean; danger?: boolean; wide?: boolean }) {
  const bg = danger ? palette.alert : active ? palette.quietInk : palette.quietCard;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} accessibilityState={active === undefined ? undefined : { selected: active }} style={({ pressed }) => ({ transform: pressed ? [{ translateX: 3 }, { translateY: 3 }] : undefined })}>
      <View style={{ position: "absolute", top: 3, left: 3, right: -3, bottom: -3, borderRadius: 14, backgroundColor: palette.quietInk }} />
      <View style={{ width: wide ? 72 : 56, height: 56, borderRadius: 14, borderWidth: 2, borderColor: palette.quietInk, backgroundColor: bg, alignItems: "center", justifyContent: "center" }}>
        <Icon size={22} color={active && !danger ? palette.quietCard : palette.quietInk} strokeWidth={2} style={danger ? { transform: [{ rotate: "135deg" }] } : undefined} />
      </View>
    </Pressable>
  );
}

export default function ActiveCall() {
  const { title = "Algorithms Circle" } = useLocalSearchParams<{ title?: string }>();
  const [elapsed, setElapsed] = useState(0);
  const [mic, setMic] = useState(true);
  const [cam, setCam] = useState(true);
  const [focusLeft, setFocusLeft] = useState(25 * 60);

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed((s) => s + 1);
      setFocusLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const leave = () => confirm("Leave this call?", "The call keeps going for everyone else.", "Leave", () => router.back());

  return (
    <Screen volume="quiet" scroll={false}>
      {/* Video tiles are placeholders: real media comes from LiveKit (app/api/livekit-token on the web). */}
      <View style={{ flex: 1, padding: 16, gap: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 2, borderColor: palette.quietInk, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: palette.live }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: palette.quietInk }} />
            <Text variant="mono" style={{ fontSize: 12 }} accessibilityLabel={`Call time ${formatClock(elapsed)}`}>
              {formatClock(elapsed)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="h3" style={{ fontSize: 16 }} numberOfLines={1}>
              {title}
            </Text>
            <Text variant="small" muted style={{ fontSize: 12 }}>
              {tiles.length + 1} in call
            </Text>
          </View>
          <Surface tone="focus" shadow="sm" radius={10} onPress={() => notify("Call notes", "Shared notes save to the group chat when the call ends.")} style={{ minHeight: 44, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 6 }}>
            <FileText size={18} color={palette.quietInk} />
            <Text variant="h3" style={{ fontSize: 13 }}>
              Notes
            </Text>
          </Surface>
        </View>

        <View style={{ flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {[...tiles, { id: "me", initials: "NR", name: "You", fill: palette.quietCard, speaking: false, muted: !mic }].map((t) => {
            const isMe = t.id === "me";
            return (
              <View
                key={t.id}
                accessible
                accessibilityLabel={`${t.name}${t.speaking ? ", speaking" : ""}${t.muted ? ", muted" : ""}${isMe && !cam ? ", camera off" : ""}`}
                style={{ width: "48.5%", height: "49%", borderRadius: 14, borderWidth: t.speaking ? 3 : 2, borderColor: t.speaking ? palette.live : palette.quietInk, backgroundColor: t.fill, alignItems: "center", justifyContent: "center" }}
              >
                {isMe && !cam ? (
                  <Text variant="small" muted style={{ fontSize: 13 }}>
                    Camera off
                  </Text>
                ) : (
                  <Avatar initials={t.initials} color={isMe ? palette.career : palette.quietCard} size={72} />
                )}
                <View style={{ position: "absolute", left: 8, bottom: 8, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: palette.quietCard, borderWidth: 2, borderColor: palette.quietInk, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                  {t.muted ? <MicOff size={13} color={palette.quietInk} /> : null}
                  <Text variant="h3" style={{ fontSize: 12 }}>
                    {t.name}
                    {t.speaking ? " · speaking" : ""}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <Surface shadow="none" radius={12} style={{ padding: 10, flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Timer size={18} color={palette.quietInk} />
          <Text variant="small" style={{ flex: 1, fontSize: 13 }}>
            <Text variant="h3" style={{ fontSize: 13 }}>
              Shared focus
            </Text>{" "}
            · {formatClock(focusLeft)} left in round 1
          </Text>
          <View style={{ width: 80 }}>
            <ProgressBar value={1 - focusLeft / (25 * 60)} label="Shared focus round" tone="focus" height={10} />
          </View>
        </Surface>

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Control icon={mic ? Mic : MicOff} label={mic ? "Mute microphone" : "Unmute microphone"} active={!mic} onPress={() => setMic(!mic)} />
          <Control icon={cam ? Video : VideoOff} label={cam ? "Turn camera off" : "Turn camera on"} active={!cam} onPress={() => setCam(!cam)} />
          <Control icon={MonitorUp} label="Share screen" onPress={() => notify("Share screen", "Screen sharing needs a development build with LiveKit.")} />
          <Control icon={Ellipsis} label="Call tools" onPress={() => notify("Call tools", "Notes, shared timer and whiteboard live here.")} />
          <Control icon={Phone} label="Leave call" danger wide onPress={leave} />
        </View>
      </View>
    </Screen>
  );
}
