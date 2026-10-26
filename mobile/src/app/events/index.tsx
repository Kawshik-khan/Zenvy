import { useState } from "react";
import { Pressable, View } from "react-native";
import { Plus } from "lucide-react-native";
import { Avatar, Button, Screen, Surface, Text, TopBar } from "../../components";
import { events, groups, person } from "../../data/sample";
import { useApp } from "../../state/AppState";
import { font, palette } from "../../theme/tokens";

const WEEK = [
  { day: 26, label: "Mon" },
  { day: 27, label: "Tue" },
  { day: 28, label: "Wed" },
  { day: 29, label: "Thu" },
  { day: 30, label: "Fri" },
  { day: 31, label: "Sat" },
  { day: 1, label: "Sun" },
];

export default function Events() {
  const { state, toggle } = useApp();
  const [day, setDay] = useState(26);
  const list = events.filter((e) => e.day === day);

  return (
    <Screen header={<TopBar title="Sessions" fallback="/home" right={<Button label="Schedule" variant="live" size="sm" icon={Plus} href="/events/new" />} />}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text variant="h3" style={{ fontSize: 16 }}>
          October 2026
        </Text>
        <Text variant="label">Week 44</Text>
      </View>

      <View accessibilityRole="tablist" accessibilityLabel="Day" style={{ flexDirection: "row", gap: 6 }}>
        {WEEK.map((d) => {
          const on = d.day === day;
          const has = events.some((e) => e.day === d.day);
          return (
            <Pressable
              key={d.day}
              onPress={() => setDay(d.day)}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${d.label} ${d.day}${has ? ", has sessions" : ""}`}
              style={{ flex: 1, minHeight: 64, borderRadius: 10, borderWidth: on ? 3 : 2, borderColor: palette.ink, backgroundColor: on ? palette.ink : palette.white, alignItems: "center", justifyContent: "center", gap: 2 }}
            >
              <Text style={{ fontFamily: font.semibold, fontSize: 11, lineHeight: 14 }} color={on ? palette.paper : palette.ink}>
                {d.label}
              </Text>
              <Text style={{ fontFamily: font.monoBold, fontSize: 18, lineHeight: 22 }} color={on ? palette.paper : palette.ink}>
                {d.day}
              </Text>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: has ? (on ? palette.live : palette.ink) : "transparent" }} />
            </Pressable>
          );
        })}
      </View>

      {list.length === 0 ? (
        <Surface dashed shadow="none" style={{ padding: 24, alignItems: "center", gap: 6 }}>
          <Text variant="h3" style={{ fontSize: 17 }}>
            Nothing scheduled
          </Text>
          <Text variant="small" muted style={{ textAlign: "center", marginBottom: 8 }}>
            Sessions you create or RSVP to will show up here.
          </Text>
          <Button label="Schedule a session" variant="live" href="/events/new" />
        </Surface>
      ) : null}

      {list.map((e) => {
        const g = groups.find((x) => x.id === e.groupId);
        const going = !!state.rsvp[e.id];
        const ids = going ? Array.from(new Set([...e.goingIds, "me"])) : e.goingIds.filter((x) => x !== "me");
        return (
          <Surface key={e.id}>
            <View style={{ backgroundColor: g?.color ?? palette.live, borderBottomWidth: 3, borderColor: palette.ink, paddingHorizontal: 14, paddingVertical: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text variant="mono" style={{ fontSize: 12 }}>
                {e.start} – {e.end}
              </Text>
              <View style={{ borderWidth: 2, borderColor: palette.ink, borderRadius: 99, paddingHorizontal: 8, backgroundColor: palette.white }}>
                <Text variant="h3" style={{ fontSize: 12 }}>
                  {e.where}
                </Text>
              </View>
            </View>
            <View style={{ padding: 14, gap: 10 }}>
              <View>
                <Text variant="h3" style={{ fontSize: 16 }}>
                  {e.title}
                </Text>
                <Text variant="small" muted>
                  {g?.name}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }} accessible accessibilityLabel={`${ids.length} going`}>
                  {ids.slice(0, 3).map((pid, i) => {
                    const p = person(pid);
                    return <Avatar key={pid} initials={p.initials} color={p.color} size={32} style={i ? { marginLeft: -8 } : undefined} />;
                  })}
                  <Text variant="small" muted style={{ marginLeft: 8, fontSize: 12 }}>
                    {ids.length} going
                  </Text>
                </View>
                <Button label={going ? "Going" : "RSVP"} variant={going ? "live" : "secondary"} size="sm" onPress={() => toggle("rsvp", e.id)} accessibilityLabel={going ? `Cancel RSVP for ${e.title}` : `RSVP to ${e.title}`} />
              </View>
            </View>
          </Surface>
        );
      })}
    </Screen>
  );
}
