import { Tabs } from "expo-router";
import type { BottomTabBarProps } from "expo-router/build/layouts/Tabs";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { House, Menu, MessageSquare, Timer, Users, type LucideIcon } from "lucide-react-native";
import { CountBadge, Text } from "../../components";
import { conversations } from "../../data/sample";
import { formatBadge } from "../../state/AppState";
import { font, palette, type Accent } from "../../theme/tokens";

// Mirrors components/shell/nav.ts on the web: Home, Partners, Messages and Focus, with the rest under More.
const items: Record<string, { label: string; icon: LucideIcon; tone: Accent }> = {
  home: { label: "Home", icon: House, tone: "focus" },
  partners: { label: "Partners", icon: Users, tone: "match" },
  messages: { label: "Messages", icon: MessageSquare, tone: "chat" },
  focus: { label: "Focus", icon: Timer, tone: "focus" },
  more: { label: "More", icon: Menu, tone: "live" },
};

function ZenvyTabBar({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const unread = formatBadge(conversations.reduce((n, c) => n + (c.kind === "people" ? c.unread : 0), 0));
  return (
    <View pointerEvents="box-none" style={{ position: "absolute", left: 12, right: 12, bottom: Math.max(insets.bottom, 12) }}>
      <View style={{ position: "absolute", top: 4, left: 4, right: -4, bottom: -4, borderRadius: 14, backgroundColor: palette.ink }} />
      <View accessibilityRole="tablist" style={{ height: 72, backgroundColor: palette.white, borderWidth: 3, borderColor: palette.ink, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-around", paddingHorizontal: 6 }}>
        {state.routes.map((route, index) => {
          const item = items[route.name];
          if (!item) return null;
          const focused = state.index === index;
          const Icon = item.icon;
          const badge = route.name === "messages" ? unread : null;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={badge ? `${item.label}, ${badge} unread` : item.label}
              onPress={() => {
                const event = emitter.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) navigateToTab(route.key);
              }}
              style={{
                width: 64,
                height: 56,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: focused ? palette.ink : "transparent",
                backgroundColor: focused ? palette[item.tone] : "transparent",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
              }}
            >
              <Icon size={20} color={palette.ink} strokeWidth={2.3} />
              <Text style={{ fontFamily: font.semibold, fontSize: 11, lineHeight: 13 }}>{item.label}</Text>
              {badge ? <CountBadge value={badge} tone="chat" style={{ position: "absolute", top: -2, right: 4 }} /> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <ZenvyTabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: palette.paper } }}>
      <Tabs.Screen name="home" />
      <Tabs.Screen name="partners" />
      <Tabs.Screen name="messages" />
      <Tabs.Screen name="focus" options={{ sceneStyle: { backgroundColor: palette.quietPaper } }} />
      <Tabs.Screen name="more" />
    </Tabs>
  );
}
