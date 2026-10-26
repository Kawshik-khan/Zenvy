import { View } from "react-native";
import { router } from "expo-router";
import { Button, Chip, Screen, Surface, Text, Toggle, TopBar } from "../../components";
import { StepProgress } from "../../components/auth";
import { useApp } from "../../state/AppState";

const STYLES = ["Focused solo work", "Pair programming", "Group discussion", "Exam prep", "Project collaboration"];
const TOPICS = ["Algorithms", "React", "Data structures", "Physics", "Calculus", "Machine learning", "Databases", "UI design"];
const TIMES = ["Morning", "Day", "Evening", "Late"];

export default function OnboardingStyle() {
  const { state, updateProfile } = useApp();
  const p = state.profile;
  const toggleIn = (list: string[], item: string) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

  return (
    <Screen
      header={<TopBar fallback="/onboarding-about" center={<StepProgress step={2} total={2} />} />}
      footer={
        <View style={{ paddingHorizontal: 20, paddingBottom: 12, paddingTop: 8 }}>
          <Button label="Finish setup" size="lg" disabled={p.interests.length === 0} onPress={() => router.replace("/home")} />
        </View>
      }
    >
      <View style={{ gap: 6 }}>
        <Text variant="title" accessibilityRole="header" style={{ fontSize: 30, lineHeight: 34 }}>
          How do you like to study?
        </Text>
        <Text variant="body" muted>
          We use this to score matches. Change it anytime.
        </Text>
      </View>

      <View style={{ gap: 10 }}>
        <Text variant="h3">Study style</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {STYLES.map((s) => (
            <Chip key={s} label={s} selected={p.studyStyle === s} tone="match" onPress={() => updateProfile({ studyStyle: s })} />
          ))}
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <Text variant="h3">
          Interests{" "}
          <Text variant="small" muted>
            · pick a few
          </Text>
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {TOPICS.map((t) => (
            <Chip key={t} label={t} selected={p.interests.includes(t)} tone="chat" onPress={() => updateProfile({ interests: toggleIn(p.interests, t) })} />
          ))}
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <Text variant="h3">Best times</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {TIMES.map((t) => (
            <Chip key={t} label={t} selected={p.times.includes(t)} tone="focus" onPress={() => updateProfile({ times: toggleIn(p.times, t) })} style={{ flex: 1, paddingHorizontal: 4 }} />
          ))}
        </View>
      </View>

      <Surface shadow="sm" style={{ padding: 14, flexDirection: "row", alignItems: "center", gap: 14 }}>
        <View style={{ flex: 1 }}>
          <Text variant="h3">Available for matching</Text>
          <Text variant="small" muted>
            Classmates can find you and send requests.
          </Text>
        </View>
        <Toggle value={p.available} onValueChange={(available) => updateProfile({ available })} label="Available for matching" />
      </Surface>
    </Screen>
  );
}
