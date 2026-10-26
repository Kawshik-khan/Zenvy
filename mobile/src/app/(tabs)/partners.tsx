import { useMemo, useState } from "react";
import { ScrollView, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Plus, Search } from "lucide-react-native";
import { Avatar, Badge, Button, Chip, Screen, SectionLabel, Surface, Text } from "../../components";
import { partners } from "../../data/sample";
import { useApp } from "../../state/AppState";
import { font, palette } from "../../theme/tokens";

const FILTERS = ["Same major", "Evenings", "Exam prep", "Pair programming"] as const;
type Filter = (typeof FILTERS)[number];

export default function Partners() {
  const { state, toggle } = useApp();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filter[]>([]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return partners
      .filter((p) => !q || [p.name, p.major, ...p.interests].some((s) => s.toLowerCase().includes(q)))
      .filter((p) =>
        filters.every((f) => {
          if (f === "Same major") return p.major === "Computer Science";
          if (f === "Evenings") return /night|eve|PM/i.test(p.availability ?? "");
          if (f === "Exam prep") return p.studyStyle === "Exam prep" || p.interests.includes("Exam prep");
          return p.studyStyle === f;
        }),
      )
      .sort((a, b) => b.score - a.score);
  }, [query, filters]);

  return (
    <Screen tabBar>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Text variant="title" accessibilityRole="header" style={{ flex: 1 }}>
          Find partners
        </Text>
        <Button label="Post ad" variant="match" size="sm" icon={Plus} href="/post-ad" />
      </View>

      <Surface shadow="sm" radius={10} style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 14, gap: 10, minHeight: 52 }}>
        <Search size={20} color={palette.ink} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name, course or skill"
          placeholderTextColor={palette.muted}
          accessibilityLabel="Search people"
          returnKeyType="search"
          style={{ flex: 1, fontFamily: font.medium, fontSize: 16, color: palette.ink, minHeight: 46 }}
        />
      </Surface>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 20 }} style={{ marginHorizontal: -20, paddingHorizontal: 20 }}>
        {FILTERS.map((f) => (
          <Chip key={f} label={f} selected={filters.includes(f)} onPress={() => setFilters((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]))} />
        ))}
      </ScrollView>

      <SectionLabel>{list.length} classmates · best match first</SectionLabel>

      {list.length === 0 ? (
        <Surface dashed shadow="none" style={{ padding: 24, alignItems: "center", gap: 6 }}>
          <Text variant="h3">No one matches those filters</Text>
          <Text variant="small" muted style={{ textAlign: "center" }}>
            Try removing a filter or posting a study ad so people can find you.
          </Text>
        </Surface>
      ) : null}

      {list.map((p) => {
        const connected = state.connected[p.id];
        const requested = state.requested[p.id];
        return (
          <Surface key={p.id} style={{ padding: 14, gap: 10 }}>
            <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
              <Avatar initials={p.initials} color={p.color} size={52} />
              <View style={{ flex: 1 }}>
                <Text variant="h3" style={{ fontSize: 16 }}>
                  {p.name}
                </Text>
                <Text variant="small" muted>
                  {p.major === "Computer Science" ? "CSE" : "EEE"} · Semester {p.semester} · {p.college}
                </Text>
              </View>
              <View style={{ borderWidth: 3, borderColor: palette.ink, borderRadius: 10, backgroundColor: palette.match, paddingHorizontal: 8, paddingVertical: 5, alignItems: "center" }}>
                <Text variant="mono">{p.score}%</Text>
                <Text style={{ fontFamily: font.mono, fontSize: 9, lineHeight: 11 }}>MATCH</Text>
              </View>
            </View>
            <Text variant="small" style={{ fontSize: 13 }}>
              <Text variant="small" style={{ fontFamily: font.bold, fontSize: 13 }}>
                Why you match:{" "}
              </Text>
              {p.why}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {p.interests.slice(0, 3).map((t) => (
                <Badge key={t} label={t} />
              ))}
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {connected ? (
                <Button label="Message" variant="chat" size="sm" href={{ pathname: "/dm/[id]", params: { id: p.id } }} containerStyle={{ flex: 1 }} />
              ) : (
                <Button label={requested ? "Requested" : "Connect"} variant="match" size="sm" settled={requested} onPress={() => toggle("requested", p.id)} accessibilityLabel={requested ? `Cancel request to ${p.name}` : `Connect with ${p.name}`} containerStyle={{ flex: 1 }} />
              )}
              <Button label="View profile" variant="secondary" size="sm" onPress={() => router.push({ pathname: "/partner/[id]", params: { id: p.id } })} containerStyle={{ flex: 1 }} />
            </View>
          </Surface>
        );
      })}
    </Screen>
  );
}
