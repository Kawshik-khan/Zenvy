import { useRef } from "react";
import { ActivityIndicator, ScrollView, View, type ScrollViewInstance } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Phone, Video } from "lucide-react-native";
import { Avatar, IconButton, Screen, Text, TopBar } from "../../components";
import { Composer, LiveBubble, TypingIndicator } from "../../components/chat";
import { initialsOf, useAuth } from "../../auth/AuthProvider";
import { useCalls } from "../../calls/CallProvider";
import { useConversation } from "../../chat/useConversation";
import { palette } from "../../theme/tokens";

const peerColors = [palette.chat, palette.match, palette.live, palette.focus, palette.career];

function colorFor(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return peerColors[h % peerColors.length];
}

/** A real conversation from the server (live mode). Demo DMs use /dm/[id]. */
export default function Conversation() {
  const { id, title = "Conversation" } = useLocalSearchParams<{ id: string; title?: string }>();
  const { user } = useAuth();
  const { startCall, busy } = useCalls();
  const scroll = useRef<ScrollViewInstance>(null);
  const chat = useConversation(id, user ? { id: user.id, name: user.name } : null);
  const first = title.split(" ")[0];
  const status = chat.connection === "live" ? "Live" : chat.connection === "connecting" ? "Connecting…" : "Offline";

  return (
    <Screen
      volume="quiet"
      scroll={false}
      header={
        <View style={{ backgroundColor: palette.quietCard, borderBottomWidth: 2, borderColor: palette.quietInk, paddingBottom: 10 }}>
          <TopBar
            fallback="/messages"
            center={
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Avatar initials={initialsOf(title)} color={colorFor(id)} size={42} />
                <View style={{ flex: 1 }}>
                  <Text variant="h3" style={{ fontSize: 16 }} numberOfLines={1}>
                    {title}
                  </Text>
                  <Text variant="small" muted style={{ fontSize: 12 }} accessibilityLiveRegion="polite">
                    {status}
                  </Text>
                </View>
              </View>
            }
            right={
              <View style={{ flexDirection: "row", gap: 8 }}>
                <IconButton icon={Phone} label={`Voice call ${first}`} onPress={() => !busy && void startCall({ conversationId: id, mediaType: "AUDIO", title })} />
                <IconButton icon={Video} label={`Video call ${first}`} onPress={() => !busy && void startCall({ conversationId: id, mediaType: "VIDEO", title })} />
              </View>
            }
          />
        </View>
      }
      footer={<Composer placeholder={`Message ${first}`} onSend={(t) => void chat.send(t)} onTyping={chat.notifyTyping} />}
    >
      <ScrollView ref={scroll} contentContainerStyle={{ padding: 16, gap: 12, flexGrow: 1, justifyContent: "flex-end" }} onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}>
        {chat.loading ? <ActivityIndicator color={palette.quietInk} accessibilityLabel="Loading messages" /> : null}
        {chat.error ? (
          <Text variant="small" color={palette.alert} style={{ alignSelf: "center", textAlign: "center" }} accessibilityRole="alert">
            {chat.error}
          </Text>
        ) : null}
        {!chat.loading && chat.messages.length === 0 && !chat.error ? (
          <Text variant="small" muted style={{ alignSelf: "center", textAlign: "center" }}>
            Say hi to {first}. Messages are only visible to the two of you.
          </Text>
        ) : null}
        {chat.messages.map((m) => (
          <LiveBubble key={m.id} message={m} mine={m.senderId === user?.id} onRetry={() => chat.retry(m.id)} />
        ))}
        {chat.typing ? <TypingIndicator name={chat.typing.split(" ")[0]} /> : null}
      </ScrollView>
    </Screen>
  );
}
