import { View } from "react-native";
import { Redirect, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Bookmark, Check, ChevronLeft, Flag } from "lucide-react-native";
import { Avatar, Badge, Button, IconButton, Screen, Surface, Text, goBack } from "../../components";
import { jobs, me } from "../../data/sample";
import { confirm, notify } from "../../lib/dialog";
import { useApp } from "../../state/AppState";
import { palette } from "../../theme/tokens";

// Skills the student lists across their profile; the web app derives these from Profile.interests.
const MY_SKILLS = new Set([...me.interests, "JavaScript", "Git", "Python", "SQL"]);

export default function JobDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { state, toggle } = useApp();
  const j = jobs.find((x) => x.id === id);
  if (!j) return <Redirect href="/jobs" />;
  const saved = !!state.savedJobs[j.id];
  const applied = !!state.appliedJobs[j.id];
  const matched = j.skills.filter((s) => MY_SKILLS.has(s));

  const facts = [
    { label: "Location", value: j.place },
    { label: "Duration", value: j.duration },
    { label: "Stipend", value: j.pay },
    { label: "Deadline", value: j.closesSoon ? `${j.deadline} · 2 days` : j.deadline, alert: j.closesSoon },
  ];

  return (
    <Screen
      edges={["bottom"]}
      contentStyle={{ paddingHorizontal: 0, paddingTop: 0 }}
      footer={
        <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8, borderTopWidth: 3, borderColor: palette.ink, backgroundColor: palette.paper }}>
          <IconButton icon={Bookmark} label={saved ? "Remove from saved" : "Save job"} tone={saved ? "career" : "card"} selected={saved} size={52} onPress={() => toggle("savedJobs", j.id)} />
          <Button
            label={applied ? `Applied · ${j.company} notified` : "Apply with Zenvy profile"}
            variant={applied ? "live" : "career"}
            size="lg"
            containerStyle={{ flex: 1 }}
            onPress={() =>
              applied
                ? confirm("Withdraw application?", `${j.company} will no longer see your application.`, "Withdraw", () => toggle("appliedJobs", j.id))
                : confirm("Apply with your profile?", `${j.company} will see your name, major, interests and bio.`, "Apply", () => toggle("appliedJobs", j.id), false)
            }
          />
        </View>
      }
    >
      <View style={{ backgroundColor: palette.career, borderBottomWidth: 3, borderColor: palette.ink, paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 20, gap: 14 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <IconButton icon={ChevronLeft} label="Back to jobs" onPress={() => goBack("/jobs")} />
          <IconButton
            icon={Flag}
            label="Report this listing"
            onPress={() => confirm("Report this listing?", "Tell us if it looks fake, unpaid when it says paid, or unsafe.", "Report", () => notify("Report sent", "Thanks. Our team reviews every report."))}
          />
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <Surface shadow="sm" radius={14} borderWidth={0} fill="transparent">
            <Avatar initials={j.initials} color={j.color} size={60} square />
          </Surface>
          <View style={{ flex: 1 }}>
            <Text variant="title" style={{ fontSize: 22, lineHeight: 26 }} accessibilityRole="header">
              {j.title}
            </Text>
            <Text variant="small" style={{ fontSize: 14 }}>
              {j.company} · Posted {j.posted}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, paddingTop: 18, gap: 18 }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {facts.map((f) => (
            <Surface key={f.label} shadow="none" radius={12} tone={f.alert ? "alert" : "card"} containerStyle={{ width: "48%", flexGrow: 1 }} style={{ padding: 12 }}>
              <Text variant="small" muted={!f.alert} style={{ fontSize: 12 }}>
                {f.label}
              </Text>
              <Text variant="h3" style={{ fontSize: 14 }}>
                {f.value}
              </Text>
            </Surface>
          ))}
        </View>

        <Surface style={{ padding: 16, gap: 10 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text variant="h3">Your skills match</Text>
            <Text variant="mono">
              {matched.length} / {j.skills.length}
            </Text>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {j.skills.map((s) => (MY_SKILLS.has(s) ? <Badge key={s} label={s} tone="live" icon={Check} /> : <Badge key={s} label={s} tone="card" style={{ borderStyle: "dashed" }} />))}
          </View>
        </Surface>

        <View style={{ gap: 6 }}>
          <Text variant="h2" style={{ fontSize: 16 }}>
            About the role
          </Text>
          <Text variant="body">{j.about}</Text>
        </View>

        <View style={{ gap: 6 }}>
          <Text variant="h2" style={{ fontSize: 16 }}>
            You'll need
          </Text>
          {j.needs.map((n) => (
            <Text key={n} variant="body">
              • {n}
            </Text>
          ))}
        </View>
      </View>
    </Screen>
  );
}
