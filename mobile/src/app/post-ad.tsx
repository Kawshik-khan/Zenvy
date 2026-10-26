import { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { Minus, Plus } from "lucide-react-native";
import { Button, Chip, Field, IconButton, Screen, Text, TopBar } from "../components";
import { notify } from "../lib/dialog";
import { font } from "../theme/tokens";

const PLACES = ["On campus", "Online", "Either"];
const MAX_BODY = 300;

export default function PostAd() {
  const [title, setTitle] = useState("");
  const [course, setCourse] = useState("");
  const [body, setBody] = useState("");
  const [place, setPlace] = useState("Online");
  const [size, setSize] = useState(2);
  const valid = title.trim().length >= 4 && course.trim().length > 0;

  return (
    <Screen
      header={<TopBar title="Post a study ad" close fallback="/partners" />}
      footer={
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 }}>
          <Button
            label="Publish ad"
            variant="match"
            size="lg"
            disabled={!valid}
            onPress={() => {
              router.back();
              notify("Ad published", "It shows at the top of Find partners for 7 days.");
            }}
          />
        </View>
      }
    >
      <Text variant="body" muted>
        Tell classmates what you're working on. Ads show at the top of Find partners for 7 days.
      </Text>
      <Field label="Headline" value={title} onChangeText={setTitle} placeholder="Need 2 people for CSE221 timed sets" />
      <Field label="Course or topic" value={course} onChangeText={setCourse} placeholder="CSE221 · Algorithms" />
      <Field
        label="Details"
        value={body}
        onChangeText={(t) => setBody(t.slice(0, MAX_BODY))}
        multiline
        placeholder="When, where, and what you'll work on."
        hint={`${body.length} / ${MAX_BODY}`}
      />
      <View style={{ gap: 8 }}>
        <Text variant="h3" style={{ fontSize: 14 }}>
          Where
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {PLACES.map((p) => (
            <Chip key={p} label={p} selected={place === p} onPress={() => setPlace(p)} style={{ flex: 1, paddingHorizontal: 6 }} />
          ))}
        </View>
      </View>
      <View style={{ gap: 8 }}>
        <Text variant="h3" style={{ fontSize: 14 }}>
          Group size
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <IconButton icon={Minus} label="Fewer people" onPress={() => setSize((s) => Math.max(1, s - 1))} />
          <Text accessibilityLiveRegion="polite" style={{ fontFamily: font.monoBold, fontSize: 22, minWidth: 40, textAlign: "center" }}>
            {size}
          </Text>
          <IconButton icon={Plus} label="More people" onPress={() => setSize((s) => Math.min(8, s + 1))} />
          <Text variant="small" muted>
            partners wanted
          </Text>
        </View>
      </View>
    </Screen>
  );
}
