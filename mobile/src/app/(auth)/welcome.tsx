import { View } from "react-native";
import { ArrowRight } from "lucide-react-native";
import { Avatar, Badge, Button, Screen, Surface, Text } from "../../components";
import { GridBackground } from "../../components/GridBackground";
import { Logo } from "../../components/Logo";
import { font, palette } from "../../theme/tokens";

export default function Welcome() {
  return (
    <Screen scroll={false}>
      <GridBackground />
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }}>
        <Logo />

        <View style={{ height: 300, marginTop: 24 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Surface containerStyle={{ position: "absolute", left: 0, top: 6, width: 220, transform: [{ rotate: "-4deg" }] }} style={{ padding: 14, gap: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Avatar initials="NR" color={palette.match} />
              <View>
                <Text variant="h3">Nadia R.</Text>
                <Text variant="small" muted>
                  CSE · Semester 5
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Badge label="92% match" tone="match" />
              <Text variant="mono" muted style={{ fontSize: 11 }}>
                Algorithms
              </Text>
            </View>
          </Surface>

          <Surface tone="focus" containerStyle={{ position: "absolute", right: 0, top: 112, width: 170, transform: [{ rotate: "3deg" }] }} style={{ padding: 14, alignItems: "center" }}>
            <Text variant="label" color={palette.ink}>
              Focus
            </Text>
            <Text style={{ fontFamily: font.monoBold, fontSize: 38, lineHeight: 44 }}>24:59</Text>
            <Text variant="small">Deep work · round 2</Text>
          </Surface>

          <Surface tone="chat" containerStyle={{ position: "absolute", left: 20, top: 206, width: 230, transform: [{ rotate: "-1.5deg" }] }} style={{ padding: 12 }}>
            <Text variant="h3">Tanvir A.</Text>
            <Text variant="small" style={{ fontSize: 14, lineHeight: 19 }}>
              Library room 3 at 7? Bringing the DP notes.
            </Text>
          </Surface>
        </View>

        <View style={{ flex: 1, justifyContent: "center" }}>
          <Text variant="display" accessibilityRole="header" style={{ fontSize: 38, lineHeight: 40 }}>
            Find your people.{"\n"}Do the work.
          </Text>
          <Text variant="body" muted style={{ marginTop: 12, fontSize: 16, lineHeight: 24 }}>
            Match with classmates who study like you, focus together, and talk it through in one place.
          </Text>
        </View>

        <View style={{ gap: 14 }}>
          <Button label="Create free account" size="lg" iconRight={ArrowRight} href="/sign-up" />
          <Button label="I already have an account" variant="secondary" size="lg" href="/log-in" />
        </View>
      </View>
    </Screen>
  );
}
