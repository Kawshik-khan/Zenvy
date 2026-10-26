import { useRef } from "react";
import { ScrollView, View, type ScrollViewInstance } from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { Phone, Video } from "lucide-react-native";
import { Avatar, IconButton, Screen, Surface, Text, TopBar } from "../../components";
import { Bubble, Composer, TypingIndicator } from "../../components/chat";
import { partners, people } from "../../data/sample";
import { useApp } from "../../state/AppState";
import { palette } from "../../theme/tokens";

export default function DirectMessage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, sendDm } = useApp();
  const scroll = useRef<ScrollViewInstance>(null);
  const other = people.find((p) => p.id === id && p.id !== "me");
  if (!other) return <Redirect href="/messages" />;
  const partner = partners.find((p) => p.id === other.id);
  const messages = state.dms[other.id] ?? [];
  const first = other.name.split(" ")[0];

  return (
    <Screen
      volume="quiet"
      scroll={false}
      header={
        <View style={{ backgroundColor: palette.quietCard, borderBottomWidth: 2, borderColor: palette.quietInk, paddingBottom: 10 }}>
          <TopBar
            fallback="/messages"
            center={
              <Surface
                shadow="none"
                borderWidth={0}
                fill="transparent"
                onPress={partner ? () => router.push({ pathname: "/partner/[id]", params: { id: other.id } }) : undefined}
                accessibilityLabel={`View ${other.name}'s profile`}
                style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
              >
                <Avatar initials={other.initials} color={other.color} size={42} />
                <View style={{ flex: 1 }}>
                  <Text variant="h3" style={{ fontSize: 16 }} numberOfLines={1}>
                    {other.name}
                  </Text>
                  <Text variant="small" muted style={{ fontSize: 12 }}>
                    {partner ? `Partner · ${partner.score}% match` : "Classmate"}
                  </Text>
                </View>
              </Surface>
            }
            right={
              <View style={{ flexDirection: "row", gap: 8 }}>
                <IconButton icon={Phone} label={`Voice call ${first}`} onPress={() => router.push({ pathname: "/call/incoming", params: { id: other.id } })} />
                <IconButton icon={Video} label={`Video call ${first}`} onPress={() => router.push({ pathname: "/call/active", params: { title: other.name } })} />
              </View>
            }
          />
        </View>
      }
      footer={<Composer placeholder={`Message ${first}`} onSend={(t) => sendDm(other.id, t)} />}
    >
      <ScrollView ref={scroll} contentContainerStyle={{ padding: 16, gap: 12, flexGrow: 1, justifyContent: "flex-end" }} onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}>
        <View style={{ alignSelf: "center", borderWidth: 2, borderColor: palette.quietInk, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3, backgroundColor: palette.quietCard }}>
          <Text variant="label">Today</Text>
        </View>
        {messages.length === 0 ? (
          <Text variant="small" muted style={{ alignSelf: "center", textAlign: "center" }}>
            Say hi to {first}. Messages are only visible to the two of you.
          </Text>
        ) : null}
        {messages.map((m) => (
          <Bubble key={m.id} message={m} />
        ))}
        {other.id === "tanvir" ? <TypingIndicator name={first} /> : null}
      </ScrollView>
    </Screen>
  );
}
