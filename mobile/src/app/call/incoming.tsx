import { Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Phone, Video } from "lucide-react-native";
import { Screen, Text } from "../../components";
import { GridBackground } from "../../components/GridBackground";
import { partners, person } from "../../data/sample";
import { useApp } from "../../state/AppState";
import { font, palette } from "../../theme/tokens";

const QUICK = ["Can't talk, text me", "5 min", "In a session"];

function CallButton({ label, fill, onPress, children }: { label: string; fill: string; onPress: () => void; children: React.ReactNode }) {
  return (
    <View style={{ alignItems: "center", gap: 10 }}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => ({ transform: pressed ? [{ translateX: 4 }, { translateY: 4 }] : undefined })}>
        <View style={{ position: "absolute", top: 4, left: 4, width: 80, height: 80, borderRadius: 40, backgroundColor: palette.paper }} />
        <View style={{ width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: palette.paper, backgroundColor: fill, alignItems: "center", justifyContent: "center" }}>{children}</View>
      </Pressable>
      <Text variant="strong" color={palette.paper} importantForAccessibility="no">
        {label.split(" ")[0]}
      </Text>
    </View>
  );
}

export default function IncomingCall() {
  const { id = "tanvir" } = useLocalSearchParams<{ id?: string }>();
  const { sendDm } = useApp();
  const caller = person(id);
  const partner = partners.find((p) => p.id === id);

  return (
    <Screen background={palette.ink} scroll={false} statusBar="light">
      <GridBackground color={palette.paper} opacity={0.07} />
      <View style={{ flex: 1, alignItems: "center", paddingHorizontal: 28, paddingTop: 40, paddingBottom: 24 }}>
        <View style={{ borderWidth: 2, borderColor: palette.paper, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5 }}>
          <Text variant="label" color={palette.paper}>
            Incoming video call
          </Text>
        </View>

        <View style={{ width: 220, height: 220, marginTop: 44, alignItems: "center", justifyContent: "center" }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <View style={{ position: "absolute", width: 220, height: 220, borderRadius: 110, borderWidth: 2, borderStyle: "dashed", borderColor: "rgba(61,220,151,0.5)" }} />
          <View style={{ position: "absolute", width: 176, height: 176, borderRadius: 88, borderWidth: 3, borderColor: "rgba(61,220,151,0.8)" }} />
          <View style={{ position: "absolute", top: 48, left: 48, width: 136, height: 136, borderRadius: 68, backgroundColor: palette.live }} />
          <View style={{ width: 136, height: 136, borderRadius: 68, borderWidth: 3, borderColor: palette.paper, backgroundColor: caller.color, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontFamily: font.bold, fontSize: 46, lineHeight: 54 }} color={palette.ink}>
              {caller.initials}
            </Text>
          </View>
        </View>

        <Text variant="title" color={palette.paper} accessibilityRole="header" style={{ marginTop: 30, fontSize: 32, lineHeight: 36 }}>
          {caller.name}
        </Text>
        <Text variant="body" color={palette.quietShade}>
          {partner ? `Study partner · ${partner.inCommon}` : "Classmate"}
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 32 }}>
          {QUICK.map((q) => (
            <Pressable
              key={q}
              onPress={() => {
                sendDm(caller.id, q);
                router.replace({ pathname: "/dm/[id]", params: { id: caller.id } });
              }}
              accessibilityRole="button"
              accessibilityLabel={`Decline and reply: ${q}`}
              style={{ minHeight: 44, paddingHorizontal: 14, borderWidth: 2, borderColor: palette.paper, borderRadius: 99, justifyContent: "center" }}
            >
              <Text variant="strong" color={palette.paper} style={{ fontSize: 14 }}>
                {q}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={{ marginTop: "auto", width: "100%", flexDirection: "row", justifyContent: "space-around" }}>
          <CallButton label="Decline call" fill={palette.alert} onPress={() => router.back()}>
            <Phone size={32} color={palette.ink} strokeWidth={2.3} style={{ transform: [{ rotate: "135deg" }] }} />
          </CallButton>
          <CallButton label="Accept call" fill={palette.live} onPress={() => router.replace({ pathname: "/call/active", params: { title: caller.name } })}>
            <Video size={32} color={palette.ink} strokeWidth={2.3} />
          </CallButton>
        </View>
      </View>
    </Screen>
  );
}
