import { useState } from "react";
import { ScrollView, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Bookmark, Plus } from "lucide-react-native";
import { Avatar, Badge, Button, Chip, IconButton, Screen, Segmented, Surface, Text, TopBar } from "../../components";
import { jobs } from "../../data/sample";
import { notify } from "../../lib/dialog";
import { useApp } from "../../state/AppState";
import { font, palette } from "../../theme/tokens";

type Tab = "browse" | "saved" | "applied";
const FILTERS = ["Internship", "Remote", "Part-time", "Dhaka"];

export default function Jobs() {
  const params = useLocalSearchParams<{ tab?: Tab }>();
  const { state, toggle } = useApp();
  const [tab, setTab] = useState<Tab>(params.tab ?? "browse");
  const [filters, setFilters] = useState<string[]>([]);
  const savedCount = jobs.filter((j) => state.savedJobs[j.id]).length;

  const list = jobs
    .filter((j) => (tab === "saved" ? state.savedJobs[j.id] : tab === "applied" ? state.appliedJobs[j.id] : true))
    .filter((j) => filters.every((f) => j.tags.includes(f) || j.place.includes(f)));

  return (
    <Screen header={<TopBar title="Jobs" fallback="/more" right={<Button label="Post" variant="career" size="sm" icon={Plus} onPress={() => notify("Post a job", "Verified employers and clubs can post roles from the web dashboard.")} />} />}>
      <Segmented<Tab>
        label="Job lists"
        tone="career"
        value={tab}
        onChange={setTab}
        options={[
          { key: "browse", label: "Browse" },
          { key: "saved", label: `Saved · ${savedCount}` },
          { key: "applied", label: "Applied" },
        ]}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 24 }} style={{ marginHorizontal: -20, paddingHorizontal: 20 }}>
        {FILTERS.map((f) => (
          <Chip key={f} label={f} tone="career" selected={filters.includes(f)} onPress={() => setFilters((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]))} />
        ))}
      </ScrollView>

      {list.length === 0 ? (
        <Surface dashed shadow="none" style={{ padding: 24, alignItems: "center", gap: 6 }}>
          <Text variant="h3">{tab === "saved" ? "No saved jobs" : tab === "applied" ? "No applications yet" : "No jobs match"}</Text>
          <Text variant="small" muted style={{ textAlign: "center" }}>
            {tab === "browse" ? "Try removing a filter." : "Jobs you save or apply to show up here."}
          </Text>
        </Surface>
      ) : null}

      {list.map((j) => {
        const saved = !!state.savedJobs[j.id];
        return (
          <Surface key={j.id} onPress={() => router.push({ pathname: "/jobs/[id]", params: { id: j.id } })} accessibilityLabel={`${j.title} at ${j.company}. ${j.place}. ${j.pay}. Closes ${j.deadline}`} style={{ padding: 14, gap: 10 }}>
            <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
              <Avatar initials={j.initials} color={j.color} size={48} square />
              <View style={{ flex: 1 }}>
                <Text variant="h3" style={{ fontSize: 16 }}>
                  {j.title}
                </Text>
                <Text variant="small" muted>
                  {j.company} · {j.place}
                </Text>
              </View>
              <IconButton icon={Bookmark} label={saved ? `Remove ${j.title} from saved` : `Save ${j.title}`} tone={saved ? "career" : "card"} selected={saved} onPress={() => toggle("savedJobs", j.id)} />
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {j.tags.map((t) => (
                <Badge key={t} label={t} />
              ))}
              {state.appliedJobs[j.id] ? <Badge label="Applied" tone="live" /> : null}
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text variant="mono" style={{ fontSize: 13 }}>
                {j.pay}
              </Text>
              {j.closesSoon ? <Badge label="Closes in 2 days" tone="alert" /> : <Text variant="small" muted style={{ fontFamily: font.medium }}>Closes {j.deadline}</Text>}
            </View>
          </Surface>
        );
      })}
    </Screen>
  );
}
