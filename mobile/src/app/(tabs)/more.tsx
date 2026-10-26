import { Pressable, View } from "react-native";
import { router, type Href } from "expo-router";
import { Bell, Bookmark, Briefcase, Calendar, ChartColumn, ChevronRight, LogOut, Users, type LucideIcon } from "lucide-react-native";
import { Avatar, Button, Divider, IconTile, Screen, SectionLabel, Surface, Text, Toggle } from "../../components";
import { me } from "../../data/sample";
import { useApp } from "../../state/AppState";
import { palette } from "../../theme/tokens";

const links: { label: string; href: Href; icon: LucideIcon; fill: string }[] = [
  { label: "Jobs", href: "/jobs", icon: Briefcase, fill: palette.career },
  { label: "Study groups", href: "/groups", icon: Users, fill: palette.chat },
  { label: "Sessions & events", href: "/events", icon: Calendar, fill: palette.live },
  { label: "Study stats", href: "/stats", icon: ChartColumn, fill: palette.focus },
  { label: "Notifications", href: "/notifications", icon: Bell, fill: palette.white },
  { label: "Saved jobs", href: "/jobs?tab=saved", icon: Bookmark, fill: palette.white },
];

function LinkRow({ label, onPress, icon, fill, right }: { label: string; onPress?: () => void; icon?: LucideIcon; fill?: string; right?: React.ReactNode }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? "link" : undefined} style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 56, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: pressed ? palette.paper : "transparent" })}>
      {icon && fill ? <IconTile icon={icon} fill={fill} size={36} /> : null}
      <Text variant="strong" style={{ flex: 1 }}>
        {label}
      </Text>
      {right ?? (onPress ? <ChevronRight size={18} color={palette.ink} /> : null)}
    </Pressable>
  );
}

export default function More() {
  const { state, updateProfile } = useApp();
  return (
    <Screen tabBar>
      <Text variant="title" accessibilityRole="header">
        More
      </Text>

      <Surface href="/profile" accessibilityLabel="View and edit your profile" style={{ padding: 12, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Avatar initials={me.initials} color={me.color} size={52} />
        <View style={{ flex: 1 }}>
          <Text variant="h3" style={{ fontSize: 16 }}>
            {me.name}
          </Text>
          <Text variant="small" muted>
            View and edit profile
          </Text>
        </View>
        <ChevronRight size={18} color={palette.ink} />
      </Surface>

      <View style={{ gap: 8 }}>
        <SectionLabel>Go to</SectionLabel>
        <Surface>
          {links.map((l, i) => (
            <View key={l.label}>
              {i > 0 ? <Divider /> : null}
              <LinkRow label={l.label} icon={l.icon} fill={l.fill} onPress={() => router.push(l.href)} />
            </View>
          ))}
        </Surface>
      </View>

      <View style={{ gap: 8 }}>
        <SectionLabel>Settings</SectionLabel>
        <Surface>
          <LinkRow label="Push notifications" right={<Toggle value={state.profile.push} onValueChange={(push) => updateProfile({ push })} label="Push notifications" />} />
          <Divider />
          <LinkRow label="Available for matching" right={<Toggle value={state.profile.available} onValueChange={(available) => updateProfile({ available })} label="Available for matching" />} />
          <Divider />
          <LinkRow label="Privacy & blocked users" right={<Text variant="small" muted>Soon</Text>} />
          <Divider />
          <LinkRow label="Help & feedback" right={<Text variant="small" muted>Soon</Text>} />
        </Surface>
      </View>

      <Button label="Log out" variant="danger" icon={LogOut} size="lg" onPress={() => router.replace("/welcome")} />
    </Screen>
  );
}
