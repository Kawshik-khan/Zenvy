import { useState } from "react";
import { ActivityIndicator, Pressable, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Pencil, Search } from "lucide-react-native";
import { Avatar, Badge, CountBadge, Divider, IconButton, Screen, Segmented, Surface, Text } from "../../components";
import { conversations } from "../../data/sample";
import type { Conversation, ConversationKind } from "../../data/types";
import { useApp } from "../../state/AppState";
import { font, palette } from "../../theme/tokens";
import { isLive } from "../../api/config";
import { initialsOf } from "../../auth/AuthProvider";
import { useConversations } from "../../chat/useConversations";
import { formatTime } from "../../components/chat";
import { useSocket } from "../../realtime/SocketProvider";

type Row = { key: string; title: string; initials: string; color: string; last: string; time: string; unread: number; square: boolean; onPress: () => void };

const peerColors = [palette.chat, palette.match, palette.live, palette.focus, palette.career];
function colorFor(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return peerColors[h % peerColors.length];
}

function when(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return formatTime(iso);
  const days = Math.floor((today.getTime() - d.getTime()) / 86_400_000);
  if (days < 1) return "Yesterday";
  if (days < 7) return d.toLocaleDateString(undefined, { weekday: "short" });
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

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
  const live = useConversations(isLive);
  const { state: connection } = useSocket();

  const sampleRows: Row[] = conversations
    .filter((c) => c.kind === tab)
    .map((c) => {
      const sent = c.kind === "people" ? state.dms[c.refId]?.at(-1) : undefined;
      const last = sent && sent.authorId === "me" && sent.id.startsWith("local-") ? `You: ${sent.text}` : c.last;
      return { key: c.id, title: c.kind === "channels" ? `# ${c.title}` : c.title, initials: c.initials, color: c.color, last, time: c.time, unread: c.unread, square: c.kind !== "people", onPress: () => open(c) };
    });

  // Direct messages come from the server; group and channel rooms aren't in the conversation API yet.
  const liveRows: Row[] = live.conversations.map((c) => ({
    key: c.id,
    title: c.title,
    initials: initialsOf(c.title),
    color: colorFor(c.dmPeerId ?? c.id),
    last: c.lastMessage ? c.lastMessage.content || "Attachment" : "No messages yet",
    time: when(c.lastMessage?.timestamp ?? c.lastMessageAt),
    unread: c.unreadCount,
    square: c.type !== "DM",
    onPress: () => router.push({ pathname: "/chat/[id]", params: { id: c.id, title: c.title } }),
  }));

  const showingLive = isLive && tab === "people";
  const rows = (showingLive ? liveRows : sampleRows).filter((r) => !q || r.title.toLowerCase().includes(q));

  return (
    <Screen tabBar>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Text variant="title" accessibilityRole="header" style={{ flex: 1 }}>
          Messages
        </Text>
        {isLive ? <Badge label={connection === "live" ? "Live" : connection === "connecting" ? "Connecting" : "Offline"} tone={connection === "live" ? "live" : "card"} /> : <Badge label="Live" tone="live" />}
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

      {isLive && !showingLive ? (
        <Surface tone="focus" shadow="none" radius={12} style={{ padding: 12 }}>
          <Text variant="small">Group and channel chat isn't connected in the app yet. These are examples; use the website for group rooms.</Text>
        </Surface>
      ) : null}

      <Surface>
        {showingLive && live.loading ? (
          <View style={{ padding: 20, alignItems: "center" }}>
            <ActivityIndicator color={palette.ink} accessibilityLabel="Loading conversations" />
          </View>
        ) : null}
        {showingLive && live.error ? (
          <View style={{ padding: 16, gap: 8, alignItems: "center" }}>
            <Text variant="small" color={palette.alert} accessibilityRole="alert" style={{ textAlign: "center" }}>
              {live.error}
            </Text>
            <Pressable onPress={() => void live.reload()} accessibilityRole="button" style={{ minHeight: 44, justifyContent: "center" }}>
              <Text variant="strong" style={{ textDecorationLine: "underline" }}>
                Try again
              </Text>
            </Pressable>
          </View>
        ) : null}
        {rows.length === 0 && !(showingLive && (live.loading || live.error)) ? (
          <View style={{ padding: 20, alignItems: "center" }}>
            <Text variant="small" muted style={{ textAlign: "center" }}>
              {showingLive && !q ? "No conversations yet. Once a partner accepts your request you can message them here." : "No conversations found."}
            </Text>
          </View>
        ) : null}
        {rows.map((c, i) => (
          <View key={c.key}>
            {i > 0 ? <Divider /> : null}
            <Pressable
              onPress={c.onPress}
              accessibilityRole="button"
              accessibilityLabel={`${c.title}. ${c.last}. ${c.time}${c.unread ? `. ${c.unread} unread` : ""}`}
              style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, padding: 12, minHeight: 72, backgroundColor: pressed ? palette.paper : "transparent" })}
            >
              <Avatar initials={c.initials} color={c.color} size={52} square={c.square} />
              <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                  <Text variant="h3" numberOfLines={1} style={{ flexShrink: 1 }}>
                    {c.title}
                  </Text>
                  <Text variant="mono" muted style={{ fontSize: 11 }}>
                    {c.time}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text variant="small" muted numberOfLines={1} style={{ flex: 1 }}>
                    {c.last}
                  </Text>
                  {c.unread ? <CountBadge value={c.unread > 9 ? "9+" : String(c.unread)} tone="chat" /> : null}
                </View>
              </View>
            </Pressable>
          </View>
        ))}
      </Surface>
    </Screen>
  );
}
