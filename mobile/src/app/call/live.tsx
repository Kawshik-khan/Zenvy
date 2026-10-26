import { useEffect, useState } from "react";
import { View } from "react-native";
import { Redirect } from "expo-router";
import { Screen, Text } from "../../components";
import { useAuth } from "../../auth/AuthProvider";
import { useCalls } from "../../calls/CallProvider";
import { LiveCallView } from "../../calls/LiveCallView";
import { formatClock } from "../../lib/useFocusTimer";
import { palette } from "../../theme/tokens";

/** The call in progress (live mode). The demo call screen is /call/active. */
export default function LiveCall() {
  const { active, leaveCall } = useCalls();
  const { user } = useAuth();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const others = active?.call.participants.filter((p) => p.userId !== user?.id) ?? [];
  const answered = others.some((p) => p.status === "JOINED");

  // The clock counts from when the other person picks up, not from dialling.
  useEffect(() => {
    if (answered) setElapsed(0);
  }, [answered]);

  if (!active) return <Redirect href="/messages" />;
  const ringing = active.call.type === "DM" && !answered;

  return (
    <Screen volume="quiet" scroll={false}>
      <View style={{ flex: 1, padding: 16, gap: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 2, borderColor: palette.quietInk, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: ringing ? palette.focus : palette.live }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: palette.quietInk }} />
            <Text variant="mono" style={{ fontSize: 12 }}>
              {ringing ? "Ringing" : formatClock(elapsed)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="h3" style={{ fontSize: 16 }} numberOfLines={1} accessibilityRole="header">
              {active.title}
            </Text>
            <Text variant="small" muted style={{ fontSize: 12 }} accessibilityLiveRegion="polite">
              {ringing ? `Calling ${active.title.split(" ")[0]}…` : `${others.filter((p) => p.status === "JOINED").length + 1} in call`} · {active.call.mediaType === "VIDEO" ? "Video" : "Voice"}
            </Text>
          </View>
        </View>
        <LiveCallView credentials={active.liveKit} video={active.call.mediaType === "VIDEO"} onLeave={() => void leaveCall()} />
      </View>
    </Screen>
  );
}
