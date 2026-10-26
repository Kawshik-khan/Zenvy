import { Pressable, View } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import { font, palette } from "../theme/tokens";
import { Surface } from "./Surface";
import { Text } from "./Text";

export function GoogleButton({ onPress }: { onPress: () => void }) {
  return (
    <Surface shadow="sm" radius={10} onPress={onPress} accessibilityLabel="Continue with Google" style={{ minHeight: 56, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 }}>
      <View style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: palette.ink, backgroundColor: palette.focus, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontFamily: font.bold, fontSize: 14, lineHeight: 17 }}>G</Text>
      </View>
      <Text variant="strong" style={{ fontFamily: font.bold, fontSize: 17 }}>
        Continue with Google
      </Text>
    </Surface>
  );
}

export function OrDivider({ label = "or with email" }: { label?: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <View style={{ flex: 1, height: 2, backgroundColor: palette.ink, opacity: 0.2 }} />
      <Text variant="small" muted style={{ fontFamily: font.semibold }}>
        {label}
      </Text>
      <View style={{ flex: 1, height: 2, backgroundColor: palette.ink, opacity: 0.2 }} />
    </View>
  );
}

export function StepProgress({ step, total }: { step: number; total: number }) {
  return (
    <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 12 }}>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel="Profile setup"
        accessibilityValue={{ min: 0, max: total, now: step }}
        style={{ flex: 1, height: 16, borderRadius: 8, borderWidth: 3, borderColor: palette.ink, backgroundColor: palette.white, overflow: "hidden" }}
      >
        <View style={{ width: `${(step / total) * 100}%`, height: "100%", backgroundColor: palette.focus }} />
      </View>
      <Text variant="mono" style={{ fontSize: 12 }}>
        {step}/{total}
      </Text>
    </View>
  );
}

export function RevealButton({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  const Icon = shown ? EyeOff : Eye;
  return (
    <Pressable onPress={onToggle} accessibilityRole="button" accessibilityLabel={shown ? "Hide password" : "Show password"} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
      <Icon size={20} color={palette.ink} strokeWidth={2.3} />
    </Pressable>
  );
}
