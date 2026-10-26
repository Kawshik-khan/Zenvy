import { useState } from "react";
import { View } from "react-native";
import { ProgressBar, Screen, Segmented, Surface, Text, TopBar } from "../components";
import { stats } from "../data/sample";
import { font, palette } from "../theme/tokens";

const HEAT = [palette.heat0, palette.heat1, palette.heat2, palette.heat3, palette.heat4];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const BAR_MAX = 120;

type Period = "week" | "month" | "all";

export default function Stats() {
  const [period, setPeriod] = useState<Period>("week");
  const max = 3;
  const tiles = [
    { value: stats.periods[period].hours, label: "Study hours", fill: palette.focus },
    { value: String(stats.periods[period].sessions), label: "Sessions finished", fill: palette.white },
    { value: stats.periods[period].streak, label: period === "all" ? "Longest streak" : "Current streak", fill: palette.white },
    { value: stats.periods[period].attendance, label: "RSVP follow-through", fill: palette.live },
  ];
  const active = stats.heat.filter((h) => h > 0).length;

  return (
    <Screen header={<TopBar title="Study stats" fallback="/more" />}>
      <Segmented<Period>
        label="Period"
        value={period}
        onChange={setPeriod}
        options={[
          { key: "week", label: "This week" },
          { key: "month", label: "Month" },
          { key: "all", label: "All time" },
        ]}
      />

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {tiles.map((t) => (
          <Surface key={t.label} shadow="sm" radius={12} fill={t.fill} containerStyle={{ width: "48%", flexGrow: 1 }} style={{ padding: 12 }}>
            <Text style={{ fontFamily: font.monoBold, fontSize: 22, lineHeight: 28 }}>{t.value}</Text>
            <Text variant="small" style={{ fontSize: 12 }}>
              {t.label}
            </Text>
          </Surface>
        ))}
      </View>

      <Surface style={{ padding: 16, gap: 10 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
          <Text variant="h3">Hours per day</Text>
          <Text variant="label">Goal 2h</Text>
        </View>
        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel={`Hours per day this week: ${DAYS.map((d, i) => `${d} ${stats.dailyHours[i]}`).join(", ")}`}
          style={{ height: BAR_MAX, flexDirection: "row", alignItems: "flex-end", gap: 10, borderBottomWidth: 3, borderColor: palette.ink }}
        >
          <View style={{ position: "absolute", left: 0, right: 0, bottom: (2 / max) * BAR_MAX, borderTopWidth: 2, borderStyle: "dashed", borderColor: palette.muted }} />
          {stats.dailyHours.map((h, i) => (
            <View
              key={i}
              style={{ flex: 1, height: (h / max) * BAR_MAX, borderWidth: 3, borderBottomWidth: 0, borderColor: palette.ink, borderTopLeftRadius: 6, borderTopRightRadius: 6, backgroundColor: h >= 2 ? palette.focus : palette.white }}
            />
          ))}
        </View>
        <View style={{ flexDirection: "row", gap: 10 }} importantForAccessibility="no-hide-descendants">
          {DAYS.map((d, i) => (
            <Text key={i} variant="mono" muted style={{ flex: 1, textAlign: "center", fontSize: 11 }}>
              {d[0]}
            </Text>
          ))}
        </View>
      </Surface>

      <Surface style={{ padding: 16, gap: 10 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
          <Text variant="h3">28-day activity</Text>
          <Text variant="label">Last 4 weeks</Text>
        </View>
        <View accessible accessibilityRole="image" accessibilityLabel={`Activity for the last 28 days, ${active} active days`} style={{ gap: 5 }}>
          {[0, 14].map((start) => (
            <View key={start} style={{ flexDirection: "row", gap: 5 }}>
              {stats.heat.slice(start, start + 14).map((h, i) => (
                <View key={i} style={{ flex: 1, aspectRatio: 1, borderRadius: 4, borderWidth: 2, borderColor: palette.ink, backgroundColor: HEAT[h] }} />
              ))}
            </View>
          ))}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }} importantForAccessibility="no-hide-descendants">
          <Text variant="small" muted style={{ fontSize: 11 }}>
            Less
          </Text>
          {HEAT.map((c) => (
            <View key={c} style={{ width: 14, height: 14, borderRadius: 4, borderWidth: 2, borderColor: palette.ink, backgroundColor: c }} />
          ))}
          <Text variant="small" muted style={{ fontSize: 11 }}>
            More
          </Text>
        </View>
      </Surface>

      <Surface style={{ padding: 16, flexDirection: "row", alignItems: "center", gap: 14 }}>
        <View style={{ width: 52, height: 52, borderRadius: 12, borderWidth: 3, borderColor: palette.ink, backgroundColor: palette.career, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontFamily: font.monoBold, fontSize: 22, lineHeight: 28 }}>{stats.level}</Text>
        </View>
        <View style={{ flex: 1, gap: 6 }}>
          <Text variant="h3">
            Level {stats.level} · {stats.levelTitle}
          </Text>
          <ProgressBar value={stats.levelProgress} label="Level progress" tone="career" height={14} />
          <Text variant="small" muted style={{ fontSize: 12 }}>
            {stats.toNextLevel} to level {stats.level + 1}
          </Text>
        </View>
      </Surface>
    </Screen>
  );
}
