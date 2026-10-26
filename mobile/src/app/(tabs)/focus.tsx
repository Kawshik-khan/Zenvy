import { useState } from "react";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import Svg, { Circle } from "react-native-svg";
import { Headphones, Pause, Play, RotateCcw, SkipForward } from "lucide-react-native";
import { Chip, IconButton, Screen, Segmented, Surface, Text } from "../../components";
import { formatClock, useFocusTimer, type FocusMode } from "../../lib/useFocusTimer";
import { useApp } from "../../state/AppState";
import { font, palette } from "../../theme/tokens";

const R = 120;
const C = 2 * Math.PI * R;
const SOUNDS = ["Lofi focus", "Soft rain", "Deep night"];

export default function Focus() {
  const { state, completeSession } = useApp();
  const [sound, setSound] = useState("Lofi focus");
  const [round, setRound] = useState(1);
  const timer = useFocusTimer((mode) => {
    if (mode === "focus") {
      completeSession(25);
      setRound((r) => (r % 4) + 1);
      router.push({ pathname: "/focus-done", params: { minutes: "25" } });
    }
  });

  const progress = 1 - timer.remaining / timer.total;
  const ring = timer.mode === "focus" ? palette.focus : palette.live;
  const status = timer.running ? (timer.mode === "focus" ? "Deep work · in progress" : "Breathe. Stretch.") : "Paused · ready when you are";

  return (
    <Screen volume="quiet" tabBar contentStyle={{ gap: 20 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44 }}>
        <Text variant="title" accessibilityRole="header" style={{ fontSize: 22 }}>
          Focus
        </Text>
        <Text variant="label" style={{ letterSpacing: 1 }}>
          Round {round} of 4
        </Text>
      </View>

      <Segmented<FocusMode>
        label="Timer mode"
        value={timer.mode}
        onChange={timer.setMode}
        options={[
          { key: "focus", label: "Focus" },
          { key: "short", label: "Short break" },
          { key: "long", label: "Long break" },
        ]}
      />

      <View style={{ width: 300, height: 300, alignSelf: "center", alignItems: "center", justifyContent: "center" }}>
        <Svg width={300} height={300} style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }} accessibilityElementsHidden>
          <Circle cx={150} cy={150} r={R} fill={palette.quietCard} stroke={palette.quietInk} strokeWidth={2} />
          <Circle cx={150} cy={150} r={R} fill="none" stroke={palette.quietShade} strokeWidth={22} />
          <Circle cx={150} cy={150} r={R} fill="none" stroke={ring} strokeWidth={22} strokeLinecap="round" strokeDasharray={`${C}`} strokeDashoffset={C * (1 - progress)} />
        </Svg>
        <Text accessibilityRole="timer" accessibilityLabel={`Time remaining ${formatClock(timer.remaining)}`} style={{ fontFamily: font.monoBold, fontSize: 62, lineHeight: 70, letterSpacing: -1 }}>
          {formatClock(timer.remaining)}
        </Text>
        <Text variant="small" muted>
          {status}
        </Text>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 22 }}>
        <IconButton icon={RotateCcw} label="Reset timer" onPress={timer.reset} size={48} />
        <Pressable
          onPress={timer.running ? timer.pause : timer.start}
          accessibilityRole="button"
          accessibilityLabel={timer.running ? "Pause timer" : "Start timer"}
          style={({ pressed }) => ({ transform: pressed ? [{ translateX: 3 }, { translateY: 3 }] : undefined })}
        >
          <View style={{ position: "absolute", top: 4, left: 4, width: 88, height: 88, borderRadius: 44, backgroundColor: palette.quietInk }} />
          <View style={{ width: 88, height: 88, borderRadius: 44, borderWidth: 2, borderColor: palette.quietInk, backgroundColor: palette.focus, alignItems: "center", justifyContent: "center" }}>
            {timer.running ? <Pause size={34} color={palette.quietInk} fill={palette.quietInk} /> : <Play size={34} color={palette.quietInk} fill={palette.quietInk} style={{ marginLeft: 4 }} />}
          </View>
        </Pressable>
        <IconButton
          icon={SkipForward}
          label="Finish session"
          size={48}
          onPress={() => {
            if (timer.mode !== "focus") return timer.setMode("focus");
            const minutes = timer.finish();
            completeSession(minutes);
            router.push({ pathname: "/focus-done", params: { minutes: String(minutes) } });
          }}
        />
      </View>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <Surface shadow="none" containerStyle={{ flex: 1 }} style={{ padding: 12 }}>
          <Text style={{ fontFamily: font.monoBold, fontSize: 22, lineHeight: 28 }}>{state.sessionsToday}</Text>
          <Text variant="small" muted style={{ fontSize: 12 }}>
            Sessions done
          </Text>
        </Surface>
        <Surface shadow="none" containerStyle={{ flex: 1 }} style={{ padding: 12 }}>
          <Text style={{ fontFamily: font.monoBold, fontSize: 22, lineHeight: 28 }}>{state.focusMinutesToday}</Text>
          <Text variant="small" muted style={{ fontSize: 12 }}>
            Minutes focused
          </Text>
        </Surface>
      </View>

      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Headphones size={18} color={palette.quietInk} />
          <Text variant="h3">Background sound</Text>
        </View>
        {/* Playback needs expo-audio and the tracks from public/audio in the web app. */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          {SOUNDS.map((s) => (
            <Chip key={s} label={s} selected={sound === s} tone="focus" onPress={() => setSound(s)} style={{ flex: 1, paddingHorizontal: 6 }} />
          ))}
        </View>
      </View>
    </Screen>
  );
}
