import { View } from "react-native";
import { router } from "expo-router";
import { Bell, Flame, Play, Search } from "lucide-react-native";
import { Avatar, Badge, Button, IconButton, ProgressBar, Screen, SectionHeader, Surface, Text } from "../../components";
import { events, groups, partners, stats } from "../../data/sample";
import { formatBadge, formatMinutes, unreadCount, useApp } from "../../state/AppState";
import { font, palette } from "../../theme/tokens";
import { initialsOf, useAuth } from "../../auth/AuthProvider";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default function Home() {
  const { state } = useApp();
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] ?? "Nadia";
  const next = events.find((e) => state.rsvp[e.id]);
  const nextGroup = groups.find((g) => g.id === next?.groupId);
  const myGroups = groups.filter((g) => state.joinedGroups[g.id]);
  const goal = Math.min(1, state.focusMinutesToday / stats.goalMinutes);

  return (
    <Screen tabBar>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Surface shadow="none" radius={999} borderWidth={0} href="/profile" accessibilityLabel="Your profile" fill="transparent">
          <Avatar initials={user ? initialsOf(user.name) : "NR"} color={palette.match} size={48} />
        </Surface>
        <View style={{ flex: 1 }}>
          <Text variant="small" muted>
            {greeting()}
          </Text>
          <Text variant="title" style={{ fontSize: 22, lineHeight: 26 }} accessibilityRole="header">
            {firstName}
          </Text>
        </View>
        <IconButton icon={Search} label="Search people" href="/partners" />
        <IconButton icon={Bell} label="Notifications" href="/notifications" badge={formatBadge(unreadCount(state.notifications))} />
      </View>

      <Surface tone="focus" style={{ padding: 18, gap: 14 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View>
            <Text variant="label" color={palette.ink}>
              Today's focus
            </Text>
            <Text style={{ fontFamily: font.monoBold, fontSize: 38, lineHeight: 44, marginTop: 2 }}>{formatMinutes(state.focusMinutesToday)}</Text>
            <Text variant="small">
              of {formatMinutes(stats.goalMinutes)} goal · {state.sessionsToday} sessions
            </Text>
          </View>
          <Badge label={`${stats.streakDays} days`} icon={Flame} tone="card" />
        </View>
        <ProgressBar value={goal} label="Daily focus goal" tone="ink" />
        <Button label="Start a 25 min session" icon={Play} href="/focus" />
      </Surface>

      {next && nextGroup ? (
        <Surface>
          <View style={{ backgroundColor: palette.live, borderBottomWidth: 3, borderColor: palette.ink, paddingHorizontal: 16, paddingVertical: 4, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text variant="h3">Next up</Text>
            <Button label="All sessions" variant="ghost" size="sm" href="/events" />
          </View>
          <View style={{ padding: 14, flexDirection: "row", gap: 14, alignItems: "center" }}>
            <View style={{ width: 56, borderWidth: 3, borderColor: palette.ink, borderRadius: 10, overflow: "hidden", alignItems: "center" }}>
              <Text style={{ fontFamily: font.monoBold, fontSize: 10, lineHeight: 16, color: palette.paper, backgroundColor: palette.ink, width: "100%", textAlign: "center" }}>OCT</Text>
              <Text style={{ fontFamily: font.monoBold, fontSize: 22, lineHeight: 30 }}>{next.day}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="h3">{next.title}</Text>
              <Text variant="small" muted>
                {next.start} · {nextGroup.name} · {next.goingIds.length} going
              </Text>
            </View>
            <Button label="Join" variant="live" size="sm" href="/call/active" />
          </View>
        </Surface>
      ) : null}

      <View>
        <SectionHeader title="Partners for you" action={<Button label="See all" variant="ghost" size="sm" href="/partners" />} />
        <View style={{ flexDirection: "row", gap: 12, marginTop: 6 }}>
          {partners.map((p) => (
            <Surface
              key={p.id}
              containerStyle={{ flex: 1 }}
              onPress={() => router.push({ pathname: "/partner/[id]", params: { id: p.id } })}
              accessibilityLabel={`${p.name}, ${p.score}% match`}
              style={{ padding: 12, alignItems: "center", gap: 6 }}
            >
              <Avatar initials={p.initials} color={p.color} size={48} />
              <Text variant="h3" numberOfLines={1}>
                {p.name.split(" ")[0]} {p.name.split(" ")[1]?.[0]}.
              </Text>
              <Badge label={`${p.score}%`} tone="match" style={{ alignSelf: "center" }} />
            </Surface>
          ))}
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <SectionHeader title="Your groups" action={<Button label="All groups" variant="ghost" size="sm" href="/groups" />} />
        {myGroups.slice(0, 2).map((g) => (
          <Surface key={g.id} shadow="sm" onPress={() => router.push({ pathname: "/group-room/[id]", params: { id: g.id } })} accessibilityLabel={`Open ${g.name}`} style={{ padding: 12, flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Avatar initials={g.initials} color={g.color} square />
            <View style={{ flex: 1 }}>
              <Text variant="h3">{g.name}</Text>
              <Text variant="small" muted numberOfLines={1}>
                {g.status ?? `${g.memberIds.length} members`}
              </Text>
            </View>
          </Surface>
        ))}
      </View>
    </Screen>
  );
}
