import { useState } from "react";
import { Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check } from "lucide-react-native";
import { Button, Chip, Field, Screen, Surface, Text } from "../components";
import { stats } from "../data/sample";
import { formatMinutes, useApp } from "../state/AppState";
import { font, palette } from "../theme/tokens";

const RATINGS = ["Scattered", "Okay", "Locked in"];

export default function FocusDone() {
  const { minutes } = useLocalSearchParams<{ minutes?: string }>();
  const { state } = useApp();
  const insets = useSafeAreaInsets();
  const [note, setNote] = useState("");
  const [rating, setRating] = useState("Locked in");
  const [share, setShare] = useState(true);
  const banked = Number(minutes) || 25;
  const goal = Math.round(Math.min(1, state.focusMinutesToday / stats.goalMinutes) * 100);

  const tiles = [
    { value: formatMinutes(state.focusMinutesToday).replace(" ", ""), label: "Today" },
    { value: `${stats.streakDays + 1}d`, label: "Streak" },
    { value: `${goal}%`, label: "Goal" },
  ];

  return (
    <Screen edges={["bottom"]} contentStyle={{ paddingHorizontal: 0, paddingTop: 0 }}>
      <View style={{ backgroundColor: palette.focus, borderBottomWidth: 3, borderColor: palette.ink, paddingTop: insets.top + 32, paddingBottom: 26, alignItems: "center", paddingHorizontal: 24 }}>
        <Surface tone="live" radius={999} style={{ width: 92, height: 92, alignItems: "center", justifyContent: "center" }}>
          <Check size={50} color={palette.ink} strokeWidth={3} />
        </Surface>
        <Text variant="title" accessibilityRole="header" style={{ marginTop: 18, fontSize: 30, lineHeight: 34 }}>
          Session complete
        </Text>
        <Text variant="body" style={{ fontSize: 16 }}>
          <Text variant="mono" style={{ fontSize: 16 }}>
            {banked} min
          </Text>{" "}
          banked. That's {state.sessionsToday} today.
        </Text>
      </View>

      <View style={{ paddingHorizontal: 24, paddingTop: 22, gap: 18 }}>
        <View style={{ flexDirection: "row", gap: 10 }}>
          {tiles.map((t) => (
            <Surface key={t.label} shadow="sm" radius={12} containerStyle={{ flex: 1 }} style={{ padding: 10, alignItems: "center" }}>
              <Text style={{ fontFamily: font.monoBold, fontSize: 21, lineHeight: 28 }}>{t.value}</Text>
              <Text variant="small" muted style={{ fontSize: 12 }}>
                {t.label}
              </Text>
            </Surface>
          ))}
        </View>

        <Field label="What did you work on?" value={note} onChangeText={setNote} placeholder="Knapsack + LCS practice problems" />

        <View style={{ gap: 8 }}>
          <Text variant="h3" style={{ fontSize: 14 }}>
            How focused were you?
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {RATINGS.map((r) => (
              <Chip key={r} label={r} selected={rating === r} tone="focus" onPress={() => setRating(r)} style={{ flex: 1, paddingHorizontal: 4 }} />
            ))}
          </View>
        </View>

        <Pressable onPress={() => setShare(!share)} accessibilityRole="checkbox" accessibilityState={{ checked: share }} style={{ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 44 }}>
          <View style={{ width: 26, height: 26, borderRadius: 6, borderWidth: 3, borderColor: palette.ink, backgroundColor: share ? palette.ink : palette.white, alignItems: "center", justifyContent: "center" }}>
            {share ? <Check size={16} color={palette.paper} strokeWidth={3} /> : null}
          </View>
          <Text variant="strong" style={{ flex: 1 }}>
            Share progress with Algorithms Circle
          </Text>
        </Pressable>

        <View style={{ gap: 12 }}>
          <Button label="Take a 5 min break" variant="live" size="lg" onPress={() => router.back()} />
          <Button label="Done for now" variant="secondary" size="lg" onPress={() => router.replace("/home")} />
        </View>
      </View>
    </Screen>
  );
}
