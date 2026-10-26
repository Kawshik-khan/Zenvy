import { useState } from "react";
import { ScrollView, View } from "react-native";
import { router } from "expo-router";
import { Plus } from "lucide-react-native";
import { Avatar, Button, Chip, Divider, Screen, SectionLabel, Surface, Text, TopBar } from "../../components";
import { groups } from "../../data/sample";
import { useApp } from "../../state/AppState";
import { notify } from "../../lib/dialog";

const FILTERS = ["For you", "CSE", "Exam prep", "Projects"];

export default function Groups() {
  const { state, toggle } = useApp();
  const [filter, setFilter] = useState("For you");
  const mine = groups.filter((g) => state.joinedGroups[g.id]);
  const discover = groups.filter((g) => !g.joined).filter((g) => filter === "For you" || (filter === "CSE" ? g.course.startsWith("CSE") : filter === "Exam prep" ? /help|question/i.test(g.description) : /review|portfolio/i.test(g.description + g.course)));

  return (
    <Screen header={<TopBar title="Study groups" fallback="/more" right={<Button label="New" variant="chat" size="sm" icon={Plus} onPress={() => notify("Create a group", "Group creation opens here once it's connected to the server.")} />} />}>
      <SectionLabel>Your groups · {mine.length}</SectionLabel>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 24, paddingBottom: 8 }} style={{ marginHorizontal: -20, paddingHorizontal: 20 }}>
        {mine.map((g) => (
          <Surface key={g.id} containerStyle={{ width: 152 }} onPress={() => router.push({ pathname: "/groups/[id]", params: { id: g.id } })} accessibilityLabel={`${g.name}, ${g.memberIds.length} members`} style={{ padding: 12, gap: 8 }}>
            <Avatar initials={g.initials} color={g.color} size={52} square />
            <Text variant="h3" numberOfLines={2}>
              {g.name}
            </Text>
            <Text variant="small" muted style={{ fontSize: 12 }}>
              {g.memberIds.length} members{g.status ? ` · ${g.status}` : ""}
            </Text>
          </Surface>
        ))}
      </ScrollView>

      <SectionLabel style={{ marginTop: 4 }}>Discover</SectionLabel>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 24 }} style={{ marginHorizontal: -20, paddingHorizontal: 20 }}>
        {FILTERS.map((f) => (
          <Chip key={f} label={f} tone="chat" selected={filter === f} onPress={() => setFilter(f)} />
        ))}
      </ScrollView>

      <Surface>
        {discover.length === 0 ? (
          <View style={{ padding: 20 }}>
            <Text variant="small" muted style={{ textAlign: "center" }}>
              No groups in this category yet.
            </Text>
          </View>
        ) : null}
        {discover.map((g, i) => {
          const joined = state.joinedGroups[g.id];
          return (
            <View key={g.id}>
              {i > 0 ? <Divider /> : null}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 12 }}>
                <Avatar initials={g.initials} color={g.color} size={52} square />
                <View style={{ flex: 1 }}>
                  <Text variant="h3">{g.name}</Text>
                  <Text variant="small" muted style={{ fontSize: 12 }}>
                    {g.memberIds.length + (joined ? 1 : 0)} members · {g.course}
                  </Text>
                </View>
                <Button label={joined ? "Joined" : "Join"} variant="chat" size="sm" settled={joined} onPress={() => toggle("joinedGroups", g.id)} accessibilityLabel={joined ? `Leave ${g.name}` : `Join ${g.name}`} />
              </View>
            </View>
          );
        })}
      </Surface>
    </Screen>
  );
}
