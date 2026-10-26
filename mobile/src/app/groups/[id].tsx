import { useState } from "react";
import { View } from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, MessageSquare, SlidersHorizontal, Video } from "lucide-react-native";
import { Avatar, Button, Divider, IconButton, Screen, Segmented, Surface, Text, goBack } from "../../components";
import { events, groups, person } from "../../data/sample";
import { notify } from "../../lib/dialog";
import { useApp } from "../../state/AppState";
import { palette } from "../../theme/tokens";

type Tab = "files" | "people" | "sessions";
const kindFill = { PDF: palette.alert, IMG: palette.career, CPP: palette.live, LINK: palette.focus } as const;

export default function GroupDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { state, toggle } = useApp();
  const [tab, setTab] = useState<Tab>("files");
  const g = groups.find((x) => x.id === id);
  if (!g) return <Redirect href="/groups" />;
  const joined = state.joinedGroups[g.id];
  const sessions = events.filter((e) => e.groupId === g.id);

  const rows =
    tab === "files"
      ? g.resources.map((r) => ({
          key: r.id,
          lead: (
            <View style={{ width: 44, height: 44, borderRadius: 10, borderWidth: 3, borderColor: palette.ink, backgroundColor: kindFill[r.kind], alignItems: "center", justifyContent: "center" }}>
              <Text variant="mono" style={{ fontSize: 10 }}>
                {r.kind}
              </Text>
            </View>
          ),
          title: r.title,
          meta: r.meta,
          side: r.size ?? "",
        }))
      : tab === "people"
        ? g.memberIds.map((m) => {
            const p = person(m);
            return { key: m, lead: <Avatar initials={p.initials} color={p.color} />, title: m === "me" ? `${p.name} (you)` : p.name, meta: `${p.major === "Computer Science" ? "CSE" : "EEE"} · Sem ${p.semester}`, side: g.roles[m]?.toUpperCase() ?? "" };
          })
        : sessions.map((e) => ({
            key: e.id,
            lead: (
              <View style={{ width: 44, height: 44, borderRadius: 10, borderWidth: 3, borderColor: palette.ink, backgroundColor: state.rsvp[e.id] ? palette.live : palette.white, alignItems: "center", justifyContent: "center" }}>
                <Text variant="mono" style={{ fontSize: 9, lineHeight: 11 }}>
                  OCT
                </Text>
                <Text variant="mono" style={{ fontSize: 14, lineHeight: 16 }}>
                  {e.day}
                </Text>
              </View>
            ),
            title: e.title,
            meta: `${e.start} · ${e.where} · ${e.goingIds.length} going`,
            side: state.rsvp[e.id] ? "GOING" : "RSVP",
          }));

  return (
    <Screen edges={["bottom"]} contentStyle={{ paddingHorizontal: 0, paddingTop: 0 }}>
      <View style={{ backgroundColor: palette.chat, borderBottomWidth: 3, borderColor: palette.ink, paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 20, gap: 14 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <IconButton icon={ChevronLeft} label="Back" onPress={() => goBack("/groups")} />
          <IconButton icon={SlidersHorizontal} label="Group settings" onPress={() => notify("Group settings", "Owners and admins manage members and visibility here.")} />
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <Surface shadow="sm" radius={14} style={{ width: 68, height: 68, alignItems: "center", justifyContent: "center" }}>
            <Text variant="title">{g.initials}</Text>
          </Surface>
          <View style={{ flex: 1 }}>
            <Text variant="title" style={{ fontSize: 24 }} accessibilityRole="header">
              {g.name}
            </Text>
            <Text variant="small">
              {g.course} · Public · {g.memberIds.length} members
            </Text>
          </View>
        </View>
        <Text variant="small" style={{ fontSize: 14, lineHeight: 20 }}>
          {g.description}
        </Text>
        {joined ? (
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Button label="Open chat" variant="secondary" icon={MessageSquare} onPress={() => router.push({ pathname: "/group-room/[id]", params: { id: g.id } })} containerStyle={{ flex: 1 }} />
            <Button label="Start call" variant="live" icon={Video} onPress={() => router.push({ pathname: "/call/active", params: { title: g.name } })} containerStyle={{ flex: 1 }} />
          </View>
        ) : (
          <Button label="Join group" variant="secondary" onPress={() => toggle("joinedGroups", g.id)} />
        )}
      </View>

      <View style={{ paddingHorizontal: 20, paddingTop: 16, gap: 14 }}>
        <Segmented<Tab>
          label="Group sections"
          tone="chat"
          value={tab}
          onChange={setTab}
          options={[
            { key: "files", label: "Resources" },
            { key: "people", label: "Members" },
            { key: "sessions", label: "Sessions" },
          ]}
        />
        <Surface>
          {rows.length === 0 ? (
            <View style={{ padding: 20 }}>
              <Text variant="small" muted style={{ textAlign: "center" }}>
                {tab === "files" ? "No files shared yet." : tab === "sessions" ? "No sessions scheduled." : "No members yet."}
              </Text>
            </View>
          ) : null}
          {rows.map((r, i) => (
            <View key={r.key}>
              {i > 0 ? <Divider /> : null}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 12, minHeight: 68 }}>
                {r.lead}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text variant="h3" numberOfLines={1}>
                    {r.title}
                  </Text>
                  <Text variant="small" muted style={{ fontSize: 12 }}>
                    {r.meta}
                  </Text>
                </View>
                {r.side ? (
                  <Text variant="mono" style={{ fontSize: 11 }}>
                    {r.side}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}
        </Surface>
        {tab === "sessions" && joined ? <Button label="Schedule a session" variant="live" href="/events/new" /> : null}
      </View>
    </Screen>
  );
}
