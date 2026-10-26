import { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { Clock } from "lucide-react-native";
import { Button, Chip, Field, Screen, Surface, Text, TopBar } from "../../components";
import { groups } from "../../data/sample";
import { notify } from "../../lib/dialog";
import { useApp } from "../../state/AppState";
import { palette } from "../../theme/tokens";

const LENGTHS = ["30m", "1h", "1h 30m", "2h"];
const DAYS = ["Tue 27", "Wed 28", "Thu 29", "Fri 30"];
const TIMES = ["6:00 PM", "7:00 PM", "8:30 PM", "9:30 PM"];

export default function NewEvent() {
  const { state } = useApp();
  const mine = groups.filter((g) => state.joinedGroups[g.id]);
  const [title, setTitle] = useState("");
  const [groupId, setGroupId] = useState(mine[0]?.id ?? "ac");
  const [day, setDay] = useState("Wed 28");
  const [time, setTime] = useState("8:30 PM");
  const [length, setLength] = useState("1h 30m");
  const [mode, setMode] = useState<"call" | "person">("person");
  const [place, setPlace] = useState("BRACU Library, room 3");
  const group = groups.find((g) => g.id === groupId);
  const free = Math.max(1, (group?.memberIds.length ?? 1) - (time === "9:30 PM" ? 2 : 1));
  const valid = title.trim().length >= 3 && (mode === "call" || place.trim().length > 0);

  return (
    <Screen
      header={<TopBar title="Schedule a session" close fallback="/events" />}
      footer={
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 }}>
          <Button
            label="Create & notify group"
            variant="live"
            size="lg"
            disabled={!valid}
            onPress={() => {
              router.back();
              notify("Session created", `${group?.name} members will get a reminder before ${day} at ${time}.`);
            }}
          />
        </View>
      }
    >
      <Field label="What are you working on?" value={title} onChangeText={setTitle} placeholder="Greedy vs DP drill" />

      <View style={{ gap: 8 }}>
        <Text variant="h3" style={{ fontSize: 14 }}>
          Who's it for
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {mine.map((g) => (
            <Chip key={g.id} label={g.name} tone="live" selected={groupId === g.id} onPress={() => setGroupId(g.id)} />
          ))}
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <Text variant="h3" style={{ fontSize: 14 }}>
          Day
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {DAYS.map((d) => (
            <Chip key={d} label={d} tone="live" selected={day === d} onPress={() => setDay(d)} style={{ flex: 1, paddingHorizontal: 4 }} />
          ))}
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <Text variant="h3" style={{ fontSize: 14 }}>
          Start
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {TIMES.map((t) => (
            <Chip key={t} label={t} tone="live" selected={time === t} onPress={() => setTime(t)} style={{ flex: 1, paddingHorizontal: 2 }} />
          ))}
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <Text variant="h3" style={{ fontSize: 14 }}>
          Length
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {LENGTHS.map((l) => (
            <Chip key={l} label={l} tone="live" selected={length === l} onPress={() => setLength(l)} style={{ flex: 1, paddingHorizontal: 4 }} />
          ))}
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <Text variant="h3" style={{ fontSize: 14 }}>
          Where
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Chip label="Zenvy call" tone="live" selected={mode === "call"} onPress={() => setMode("call")} style={{ flex: 1 }} />
          <Chip label="In person" tone="live" selected={mode === "person"} onPress={() => setMode("person")} style={{ flex: 1 }} />
        </View>
        {mode === "person" ? <Field label="Location" value={place} onChangeText={setPlace} /> : null}
      </View>

      <Surface tone="focus" shadow="sm" radius={12} style={{ padding: 12, flexDirection: "row", gap: 10 }}>
        <Clock size={20} color={palette.ink} />
        <Text variant="small" style={{ flex: 1, fontSize: 13 }}>
          <Text variant="h3" style={{ fontSize: 13 }}>
            {free} of {group?.memberIds.length} members are free
          </Text>{" "}
          at this time based on their availability.
        </Text>
      </Surface>
    </Screen>
  );
}
