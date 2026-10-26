import { View } from "react-native";
import { font, palette } from "../theme/tokens";
import { Surface } from "./Surface";
import { Text } from "./Text";

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }} accessible accessibilityLabel="Zenvy">
      <Surface tone="focus" shadow="sm" radius={10} style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontFamily: font.bold, fontSize: size * 0.5, lineHeight: size * 0.62 }} color={palette.ink}>
          Z
        </Text>
      </Surface>
      <Text style={{ fontFamily: font.bold, fontSize: size * 0.6, lineHeight: size * 0.75, letterSpacing: -0.5 }}>zenvy</Text>
    </View>
  );
}
