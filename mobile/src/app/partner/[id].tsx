import { View } from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, Ellipsis, MessageSquare, UserPlus } from "lucide-react-native";
import { Avatar, Badge, Button, IconButton, Screen, Surface, Text, goBack } from "../../components";
import { partners } from "../../data/sample";
import { confirm, notify } from "../../lib/dialog";
import { useApp } from "../../state/AppState";
import { font, palette } from "../../theme/tokens";

export default function PartnerProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const p = partners.find((x) => x.id === id);
  const insets = useSafeAreaInsets();
  const { state, toggle, connect } = useApp();
  if (!p) return <Redirect href="/partners" />;
  const connected = state.connected[p.id];
  const requested = state.requested[p.id];

  return (
    <Screen
      edges={["bottom"]}
      contentStyle={{ paddingHorizontal: 0, paddingTop: 0 }}
      footer={
        <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8, borderTopWidth: 3, borderColor: palette.ink, backgroundColor: palette.paper }}>
          <Button label="Message" variant="chat" icon={MessageSquare} onPress={() => router.push({ pathname: "/dm/[id]", params: { id: p.id } })} containerStyle={{ flex: 1 }} />
          {connected ? (
            <Button label="Partners" variant="match" settled containerStyle={{ flex: 1 }} />
          ) : (
            <Button
              label={requested ? "Requested" : "Connect"}
              variant="match"
              icon={UserPlus}
              settled={requested}
              onPress={() => {
                // Prototype: Tanvir has already requested you, so connecting is an instant match.
                if (p.id === "tanvir") {
                  connect(p.id);
                  router.push({ pathname: "/matched/[id]", params: { id: p.id } });
                } else toggle("requested", p.id);
              }}
              containerStyle={{ flex: 1 }}
            />
          )}
        </View>
      }
    >
      <View style={{ backgroundColor: palette.match, borderBottomWidth: 3, borderColor: palette.ink, height: 140 + insets.top, paddingTop: insets.top + 8, paddingHorizontal: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <IconButton icon={ChevronLeft} label="Back" onPress={() => goBack("/partners")} />
        <IconButton icon={Ellipsis} label="Block or report" onPress={() =>
            confirm(`Block ${p.name}?`, "They won't be able to message you or see your profile. You can also report them from Settings.", "Block", () => {
              notify("Blocked", `${p.name} can no longer contact you.`);
              goBack("/partners");
            })
          }
        />
      </View>

      <View style={{ paddingHorizontal: 20, marginTop: -52, gap: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
          <Surface radius={999} shadow="md" borderWidth={0} fill="transparent">
            <Avatar initials={p.initials} color={p.color} size={104} />
          </Surface>
          <Surface tone="focus" shadow="sm" radius={12} style={{ paddingHorizontal: 12, paddingVertical: 8, alignItems: "center" }}>
            <Text style={{ fontFamily: font.monoBold, fontSize: 26, lineHeight: 30 }}>{p.score}%</Text>
            <Text style={{ fontFamily: font.mono, fontSize: 10, lineHeight: 12 }}>MATCH</Text>
          </Surface>
        </View>

        <View>
          <Text variant="title" accessibilityRole="header">
            {p.name}
          </Text>
          <Text variant="small" muted style={{ fontSize: 14 }}>
            {p.major} · Semester {p.semester} · {p.college}
          </Text>
        </View>

        {p.bio ? <Text variant="body">{p.bio}</Text> : null}

        <Surface style={{ padding: 16, gap: 10 }}>
          <Text variant="h3">Why you match</Text>
          {p.breakdown.map((b) => (
            <View key={b.label} style={{ flexDirection: "row", alignItems: "center", gap: 10 }} accessible accessibilityLabel={`${b.label}: ${b.note}`}>
              <Text variant="small" style={{ width: 86 }}>
                {b.label}
              </Text>
              <View style={{ flex: 1, height: 12, borderRadius: 6, borderWidth: 2, borderColor: palette.ink, backgroundColor: palette.white, overflow: "hidden" }}>
                <View style={{ width: `${b.value * 100}%`, height: "100%", backgroundColor: palette.match }} />
              </View>
              <Text variant="mono" style={{ fontSize: 12, width: 54, textAlign: "right" }}>
                {b.note}
              </Text>
            </View>
          ))}
        </Surface>

        <View style={{ gap: 8 }}>
          <Text variant="h3">Interests</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {p.interests.map((t) => (
              <Badge key={t} label={t} tone={state.profile.interests.includes(t) ? "chat" : "card"} />
            ))}
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <Surface shadow="none" radius={12} containerStyle={{ flex: 1 }} style={{ padding: 12 }}>
            <Text variant="small" muted style={{ fontSize: 12 }}>
              Available
            </Text>
            <Text variant="h3" style={{ fontSize: 14 }}>
              {p.availability}
            </Text>
          </Surface>
          <Surface shadow="none" radius={12} containerStyle={{ flex: 1 }} style={{ padding: 12 }}>
            <Text variant="small" muted style={{ fontSize: 12 }}>
              In common
            </Text>
            <Text variant="h3" style={{ fontSize: 14 }}>
              {p.inCommon}
            </Text>
          </Surface>
        </View>
      </View>
    </Screen>
  );
}
