import { View } from "react-native";
import { router } from "expo-router";
import { Briefcase, Calendar, FileText, MessageSquare, Phone, UserPlus, type LucideIcon } from "lucide-react-native";
import { Button, IconTile, Screen, SectionLabel, Surface, Text, TopBar } from "../components";
import type { AppNotification, NotificationKind } from "../data/types";
import { unreadCount, useApp } from "../state/AppState";
import { font, palette } from "../theme/tokens";

const kinds: Record<NotificationKind, { icon: LucideIcon; fill: string }> = {
  match: { icon: UserPlus, fill: palette.match },
  message: { icon: MessageSquare, fill: palette.chat },
  event: { icon: Calendar, fill: palette.live },
  job: { icon: Briefcase, fill: palette.career },
  resource: { icon: FileText, fill: palette.white },
  call: { icon: Phone, fill: palette.white },
};

function destination(n: AppNotification) {
  if (n.kind === "message" || n.kind === "call") return () => router.push({ pathname: "/dm/[id]", params: { id: n.refId ?? "tanvir" } });
  if (n.kind === "event") return () => router.push("/events");
  if (n.kind === "job") return () => router.push({ pathname: "/jobs/[id]", params: { id: n.refId ?? "kl-frontend" } });
  if (n.kind === "resource") return () => router.push({ pathname: "/groups/[id]", params: { id: "ac" } });
  if (n.kind === "match" && n.refId) return () => router.push({ pathname: "/partner/[id]", params: { id: n.refId } });
  return undefined;
}

export default function Notifications() {
  const { state, markAllRead, resolveRequest } = useApp();
  const unread = unreadCount(state.notifications);
  const today = state.notifications.filter((n) => !n.time.startsWith("Yesterday"));
  const earlier = state.notifications.filter((n) => n.time.startsWith("Yesterday"));

  const item = (n: AppNotification) => {
    const k = kinds[n.kind];
    const pending = n.kind === "match" && n.unread;
    return (
      <Surface key={n.id} shadow={n.unread ? "md" : "none"} fill={n.unread ? palette.white : "#fffdf8"} onPress={pending ? undefined : destination(n)} style={{ padding: 14, gap: 10 }}>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <IconTile icon={k.icon} fill={k.fill} />
          <View style={{ flex: 1 }}>
            <Text variant="small" style={{ fontSize: 14, lineHeight: 20 }}>
              {n.actor ? <Text variant="small" style={{ fontFamily: font.bold, fontSize: 14 }}>{n.actor} </Text> : null}
              {n.body}
            </Text>
            <Text variant="mono" muted style={{ fontSize: 11, marginTop: 4, fontFamily: font.mono }}>
              {n.time}
            </Text>
          </View>
          {n.unread ? <View accessibilityLabel="Unread" style={{ width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: palette.ink, backgroundColor: palette.alert, marginTop: 4 }} /> : null}
        </View>
        {pending ? (
          <View style={{ flexDirection: "row", gap: 10, paddingLeft: 56 }}>
            <Button label="Accept" variant="match" size="sm" onPress={() => resolveRequest(n.id, true)} accessibilityLabel={`Accept ${n.actor}`} />
            <Button label="Decline" variant="secondary" size="sm" onPress={() => resolveRequest(n.id, false)} accessibilityLabel={`Decline ${n.actor}`} />
          </View>
        ) : null}
      </Surface>
    );
  };

  return (
    <Screen header={<TopBar title="Notifications" right={unread ? <Button label="Mark all read" variant="ghost" size="sm" onPress={markAllRead} /> : null} />}>
      <SectionLabel>Today{unread ? ` · ${unread} new` : ""}</SectionLabel>
      {today.map(item)}
      {earlier.length ? <SectionLabel style={{ marginTop: 6 }}>Earlier</SectionLabel> : null}
      {earlier.map(item)}
    </Screen>
  );
}
