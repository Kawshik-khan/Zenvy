import { useRef } from "react";
import { ScrollView, View, type ScrollViewInstance } from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { Users, Video } from "lucide-react-native";
import { Avatar, IconButton, Screen, Surface, Text, TopBar } from "../../components";
import { Bubble, Composer } from "../../components/chat";
import { groups, person } from "../../data/sample";
import { useApp } from "../../state/AppState";
import { palette } from "../../theme/tokens";

export default function GroupRoom() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, sendGroup } = useApp();
  const scroll = useRef<ScrollViewInstance>(null);
  const g = groups.find((x) => x.id === id);
  if (!g) return <Redirect href="/messages" />;
  const messages = state.groupChats[g.id] ?? [];
  const call = g.liveCall;
  const callNames = call ? call.participants.map((p) => person(p).name.split(" ")[0]) : [];

  return (
    <Screen
      volume="quiet"
      scroll={false}
      header={
        <View style={{ backgroundColor: palette.quietCard, borderBottomWidth: 2, borderColor: palette.quietInk, paddingBottom: 10 }}>
          <TopBar
            fallback="/messages"
            center={
              <Surface shadow="none" borderWidth={0} fill="transparent" onPress={() => router.push({ pathname: "/groups/[id]", params: { id: g.id } })} accessibilityLabel={`${g.name} details`} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Avatar initials={g.initials} color={g.color} size={42} square />
                <View style={{ flex: 1 }}>
                  <Text variant="h3" style={{ fontSize: 16 }} numberOfLines={1}>
                    {g.name}
                  </Text>
                  <Text variant="small" muted style={{ fontSize: 12 }}>
                    {g.memberIds.length} members
                  </Text>
                </View>
              </Surface>
            }
            right={<IconButton icon={Users} label="Members and files" onPress={() => router.push({ pathname: "/groups/[id]", params: { id: g.id } })} />}
          />
        </View>
      }
      footer={<Composer placeholder={`Message ${g.name}`} onSend={(t) => sendGroup(g.id, t)} />}
    >
      {call ? (
        <Surface
          tone="live"
          shadow="sm"
          radius={12}
          containerStyle={{ marginHorizontal: 16, marginTop: 12 }}
          onPress={() => router.push({ pathname: "/call/active", params: { title: g.name } })}
          accessibilityLabel={`Study call in progress with ${callNames.join(", ")}. Join`}
          style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingVertical: 10, minHeight: 56 }}
        >
          <Video size={20} color={palette.quietInk} />
          <View style={{ flex: 1 }}>
            <Text variant="h3" style={{ fontSize: 14 }}>
              Study call in progress
            </Text>
            <Text variant="small" style={{ fontSize: 12 }}>
              {callNames.slice(0, 2).join(", ")} and {callNames.length - 2} more · {call.startedMinutesAgo} min
            </Text>
          </View>
          <View style={{ borderWidth: 2, borderColor: palette.quietInk, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: palette.quietCard }}>
            <Text variant="h3" style={{ fontSize: 14 }}>
              Join
            </Text>
          </View>
        </Surface>
      ) : null}
      <ScrollView ref={scroll} contentContainerStyle={{ padding: 16, gap: 14, flexGrow: 1, justifyContent: "flex-end" }} onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}>
        {messages.length === 0 ? (
          <Text variant="small" muted style={{ alignSelf: "center" }}>
            No messages yet. Start the conversation.
          </Text>
        ) : null}
        {messages.map((m) => (
          <Bubble key={m.id} message={m} showAuthor />
        ))}
      </ScrollView>
    </Screen>
  );
}
