import { useState } from "react";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { ArrowRight, Upload } from "lucide-react-native";
import { Button, Chip, Field, Screen, Text, TopBar } from "../../components";
import { StepProgress } from "../../components/auth";
import { palette } from "../../theme/tokens";

const SEMESTERS = ["1", "2", "3", "4", "5", "6", "7", "8"];

export default function OnboardingAbout() {
  const [college, setCollege] = useState("BRAC University");
  const [major, setMajor] = useState("");
  const [semester, setSemester] = useState("5");

  return (
    <Screen
      header={<TopBar fallback="/verify" center={<StepProgress step={1} total={2} />} />}
      footer={
        <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 20, paddingBottom: 12, paddingTop: 8 }}>
          <Button label="Skip" variant="secondary" size="lg" href="/home" containerStyle={{ flex: 1 }} />
          <Button label="Next" size="lg" iconRight={ArrowRight} href="/onboarding-style" containerStyle={{ flex: 2 }} />
        </View>
      }
    >
      <View style={{ gap: 6 }}>
        <Text variant="title" accessibilityRole="header" style={{ fontSize: 30, lineHeight: 34 }}>
          Tell classmates who you are
        </Text>
        <Text variant="body" muted>
          This is what partners see before they connect.
        </Text>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
        {/* Photo picking needs expo-image-picker; wire it when uploads go to Supabase Storage. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add profile photo"
          style={{ width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderStyle: "dashed", borderColor: palette.ink, backgroundColor: palette.white, alignItems: "center", justifyContent: "center", gap: 2 }}
        >
          <Upload size={26} color={palette.ink} strokeWidth={2.2} />
          <Text variant="small" style={{ fontSize: 12 }}>
            Add photo
          </Text>
        </Pressable>
        <Text variant="small" muted style={{ flex: 1 }}>
          Optional. JPG or PNG up to 5 MB. Without one we show your initials.
        </Text>
      </View>

      <Field label="College" value={college} onChangeText={setCollege} placeholder="Your university" />
      <Field label="Major" value={major} onChangeText={setMajor} placeholder="Computer Science" />
      <View style={{ gap: 8 }}>
        <Text variant="h3" style={{ fontSize: 14 }}>
          Semester
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }} accessibilityRole="radiogroup">
          {SEMESTERS.map((s) => (
            <Chip key={s} label={s} selected={semester === s} tone="focus" onPress={() => setSemester(s)} style={{ width: 52 }} />
          ))}
        </View>
      </View>
    </Screen>
  );
}
