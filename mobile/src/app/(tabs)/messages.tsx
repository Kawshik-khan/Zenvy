import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Pencil, Search } from "lucide-react-native";
import { Avatar, Badge, CountBadge, Divider, IconButton, Screen, Segmented, Surface, Text } from "../../components";
import { conversations } from "../../data/sample";
import type { Conversation, ConversationKind } from "../../data/types";
import { useApp } from "../../state/AppState";
import { font, palette } from "../../theme/tokens";

function open(c: Conversation) {
  if (c.kind === "people") router.push({ pathname: "/dm/[id]", params: { id: c.refId } });
  else if (c.title === "internships") router.push("/jobs");
  else router.push({ pathname: "/group-room/[id]", params: { id: c.refId } });
}

export default function Messages() {
  const { state } = useApp();
  const [tab, setTab] = useState<ConversationKind>("people");
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const rows = conversations.filter((c) => c.kind === tab && (!q || c.title.toLowerCase().includes(q)));

  return (
    <Screen tabBar>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Text variant="title" accessibilityRole="header" style={{ flex: 1 }}>
          Messages
        </Text>
        <Badge label="Live" tone="live" />
        <IconButton icon={Pencil} label="New message" tone="chat" href="/partners" />
      </View>

      <Segmented
        label="Conversation type"
        tone="chat"
        value={tab}
        onChange={setTab}
        options={[
          { key: "people", label: "People" },
          { key: "groups", label: "Groups" },
          { key: "channels", label: "Channels" },
        ]}
      />

      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 3, borderColor: palette.ink, borderRadius: 10, backgroundColor: palette.white, paddingHorizontal: 14 }}>
        <Search size={20} color={palette.ink} />
        <TextInput value={query} onChangeText={setQuery} placeholder="Search" placeholderTextColor={palette.muted} accessibilityLabel="Search conversations" style={{ flex: 1, minHeight: 46, fontFamily: font.medium, fontSize: 16, color: palette.ink }} />
      </View>

      <Surface>
        {rows.length === 0 ? (
          <View style={{ padding: 20, alignItems: "center" }}>
            <Text variant="small" muted>
              No conversations found.
            </Text>
          </View>
        ) : null}
        {rows.map((c, i) => {
          const sent = c.kind === "people" ? state.dms[c.refId]?.at(-1) : undefined;
          const last = sent && sent.authorId === "me" && sent.id.startsWith("local-") ? `You: ${sent.text}` : c.last;
          return (
            <View key={c.id}>
              {i > 0 ? <Divider /> : null}
              <Pressable
                onPress={() => open(c)}
                accessibilityRole="button"
                accessibilityLabel={`${c.title}. ${last}. ${c.time}${c.unread ? `. ${c.unread} unread` : ""}`}
                style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, padding: 12, minHeight: 72, backgroundColor: pressed ? palette.paper : "transparent" })}
              >
                <Avatar initials={c.initials} color={c.color} size={52} square={c.kind !== "people"} />
                <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                    <Text variant="h3" numberOfLines={1} style={{ flexShrink: 1 }}>
                      {c.kind === "channels" ? `# ${c.title}` : c.title}
                    </Text>
                    <Text variant="mono" muted style={{ fontSize: 11 }}>
                      {c.time}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text variant="small" muted numberOfLines={1} style={{ flex: 1 }}>
                      {last}
                    </Text>
                    {c.unread ? <CountBadge value={c.unread > 9 ? "9+" : String(c.unread)} tone="chat" /> : null}
                  </View>
                </View>
              </Pressable>
            </View>
          );
        })}
      </Surface>
    </Screen>
  );
}
