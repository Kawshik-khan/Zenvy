import { useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Camera, ChevronLeft, Pencil } from "lucide-react-native";
import { Avatar, Badge, Button, Field, IconButton, Screen, Surface, Text, Toggle, goBack } from "../components";
import { me, stats } from "../data/sample";
import { notify } from "../lib/dialog";
import { useApp } from "../state/AppState";
import { font, palette } from "../theme/tokens";

export default function Profile() {
  const insets = useSafeAreaInsets();
  const { state, updateProfile } = useApp();
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(me.bio ?? "");
  const [draft, setDraft] = useState(bio);

  const tiles = [
    { value: String(stats.profile.partners), label: "Partners" },
    { value: String(Object.values(state.joinedGroups).filter(Boolean).length), label: "Groups" },
    { value: `${stats.profile.focusedHours}h`, label: "Focused" },
    { value: `${stats.streakDays + 1}d`, label: "Streak", fill: palette.focus },
  ];

  return (
    <Screen edges={["bottom"]} contentStyle={{ paddingHorizontal: 0, paddingTop: 0 }}>
      <View style={{ backgroundColor: palette.live, borderBottomWidth: 3, borderColor: palette.ink, height: 120 + insets.top, paddingTop: insets.top + 8, paddingHorizontal: 20 }}>
        <IconButton icon={ChevronLeft} label="Back" onPress={() => goBack("/more")} containerStyle={{ alignSelf: "flex-start" }} />
      </View>

      <View style={{ paddingHorizontal: 20, marginTop: -50, gap: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
          <View>
            <Surface radius={999} borderWidth={0} fill="transparent">
              <Avatar initials={me.initials} color={me.color} size={100} />
            </Surface>
            <IconButton icon={Camera} label="Change profile photo" tone="focus" round containerStyle={{ position: "absolute", right: -6, bottom: -6 }} shadow={false} onPress={() => notify("Profile photo", "Photo upload uses Supabase Storage, as on the web.")} />
          </View>
          {editing ? (
            <Button
              label="Save"
              variant="live"
              size="sm"
              onPress={() => {
                setBio(draft.trim());
                setEditing(false);
              }}
            />
          ) : (
            <Button label="Edit profile" variant="secondary" size="sm" icon={Pencil} onPress={() => setEditing(true)} />
          )}
        </View>

        <View>
          <Text variant="title" accessibilityRole="header">
            {me.name}
          </Text>
          <Text variant="small" muted style={{ fontSize: 14 }}>
            {me.major} · Semester {me.semester} · {me.college}
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: 8 }}>
          {tiles.map((t) => (
            <Surface key={t.label} shadow="none" radius={12} fill={t.fill} containerStyle={{ flex: 1 }} style={{ paddingVertical: 8, alignItems: "center" }}>
              <Text style={{ fontFamily: font.monoBold, fontSize: 18, lineHeight: 24 }}>{t.value}</Text>
              <Text variant="small" muted={!t.fill} style={{ fontSize: 11 }}>
                {t.label}
              </Text>
            </Surface>
          ))}
        </View>

        <View style={{ gap: 6 }}>
          <Text variant="h3">About</Text>
          {editing ? <Field label="Short bio" value={draft} onChangeText={setDraft} multiline /> : <Text variant="body">{bio || "Add a short bio so classmates know what you're working on."}</Text>}
        </View>

        <View style={{ gap: 8 }}>
          <Text variant="h3">Interests</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {state.profile.interests.map((t) => (
              <Badge key={t} label={t} tone="chat" />
            ))}
            <Badge label={state.profile.studyStyle} tone="match" />
          </View>
        </View>

        <Surface shadow="sm" style={{ padding: 14, flexDirection: "row", alignItems: "center", gap: 14 }}>
          <View style={{ flex: 1 }}>
            <Text variant="h3">Available for matching</Text>
            <Text variant="small" muted>
              {state.profile.times.length ? state.profile.times.join(" & ") : "No times set"}
            </Text>
          </View>
          <Toggle value={state.profile.available} onValueChange={(available) => updateProfile({ available })} label="Available for matching" />
        </Surface>
      </View>
    </Screen>
  );
}
