import { View } from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { Calendar, Check, ChevronRight, Timer, type LucideIcon } from "lucide-react-native";
import { Avatar, Badge, Button, IconTile, Screen, Surface, Text } from "../../components";
import { GridBackground } from "../../components/GridBackground";
import { me, partners } from "../../data/sample";
import { palette } from "../../theme/tokens";

function Step({ icon, fill, title, detail, onPress }: { icon: LucideIcon; fill: string; title: string; detail: string; onPress: () => void }) {
  return (
    <Surface shadow="sm" radius={12} onPress={onPress} accessibilityLabel={`${title}. ${detail}`} style={{ padding: 12, flexDirection: "row", alignItems: "center", gap: 12, minHeight: 64 }}>
      <IconTile icon={icon} fill={fill} size={40} />
      <View style={{ flex: 1 }}>
        <Text variant="h3">{title}</Text>
        <Text variant="small" muted>
          {detail}
        </Text>
      </View>
      <ChevronRight size={20} color={palette.ink} />
    </Surface>
  );
}

export default function Matched() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const p = partners.find((x) => x.id === id);
  if (!p) return <Redirect href="/partners" />;
  const first = p.name.split(" ")[0];

  return (
    <Screen background={palette.match} scroll={false}>
      <GridBackground opacity={0.12} />
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 40, paddingBottom: 16, gap: 22 }}>
        <View style={{ height: 160 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Surface radius={999} borderWidth={0} fill="transparent" containerStyle={{ position: "absolute", left: 40, top: 10, transform: [{ rotate: "-6deg" }] }}>
            <Avatar initials={me.initials} color={palette.focus} size={128} />
          </Surface>
          <Surface radius={999} borderWidth={0} fill="transparent" containerStyle={{ position: "absolute", right: 40, top: 10, transform: [{ rotate: "6deg" }] }}>
            <Avatar initials={p.initials} color={p.color} size={128} />
          </Surface>
          <View style={{ position: "absolute", left: "50%", top: 46, marginLeft: -28, width: 56, height: 56, borderRadius: 28, borderWidth: 3, borderColor: palette.ink, backgroundColor: palette.white, alignItems: "center", justifyContent: "center" }}>
            <Check size={30} color={palette.ink} strokeWidth={3} />
          </View>
        </View>

        <View style={{ alignItems: "center", gap: 10 }}>
          <Badge label={`${p.score}% match`} tone="card" style={{ alignSelf: "center" }} />
          <Text variant="display" accessibilityRole="header" style={{ textAlign: "center" }}>
            You and {first} are study partners
          </Text>
          <Text variant="body" style={{ textAlign: "center", fontSize: 16 }}>
            You can now message, call and plan sessions together.
          </Text>
        </View>

        <View style={{ gap: 10 }}>
          <Step icon={Calendar} fill={palette.live} title="Plan your first session" detail="Both free Tue & Thu after 8 PM" onPress={() => router.push("/events/new")} />
          <Step icon={Timer} fill={palette.focus} title="Focus together" detail="Start a shared 25 min timer" onPress={() => router.replace("/focus")} />
        </View>

        <View style={{ marginTop: "auto", gap: 12 }}>
          <Button label={`Say hi to ${first}`} size="lg" onPress={() => router.replace({ pathname: "/dm/[id]", params: { id: p.id } })} />
          <Button label="Keep browsing" variant="secondary" size="lg" onPress={() => router.replace("/partners")} />
        </View>
      </View>
    </Screen>
  );
}
