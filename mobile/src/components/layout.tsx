import { type ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router, type Href } from "expo-router";
import { ChevronLeft, X, type LucideIcon } from "lucide-react-native";
import type { Volume } from "../theme/tokens";
import { VolumeProvider, useVolume } from "../theme/volume";
import { IconButton } from "./controls";
import { Text } from "./Text";

/** Height the floating tab bar takes, so tab screens can pad their content above it. */
export const TAB_BAR_SPACE = 104;

type ScreenProps = {
  children: ReactNode;
  volume?: Volume;
  /** Wrap content in a ScrollView (default). Use false for chat and full-height screens. */
  scroll?: boolean;
  /** Fixed content above the scroll area (headers). */
  header?: ReactNode;
  /** Fixed content below the scroll area (action bars, composers). */
  footer?: ReactNode;
  /** Leave room for the floating tab bar. */
  tabBar?: boolean;
  background?: string;
  edges?: Edge[];
  contentStyle?: StyleProp<ViewStyle>;
  statusBar?: "dark" | "light";
};

export function Screen({ volume = "loud", ...props }: ScreenProps) {
  return (
    <VolumeProvider volume={volume}>
      <ScreenBody {...props} />
    </VolumeProvider>
  );
}

function ScreenBody({ children, scroll = true, header, footer, tabBar, background, edges = ["top", "bottom"], contentStyle, statusBar = "dark" }: Omit<ScreenProps, "volume">) {
  const v = useVolume();
  const pad: ViewStyle = { paddingHorizontal: 20, paddingTop: 12, paddingBottom: tabBar ? TAB_BAR_SPACE : 28, gap: 16 };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: background ?? v.canvas }} edges={tabBar ? ["top"] : edges}>
      <StatusBar style={statusBar} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {header}
        {scroll ? (
          <ScrollView contentContainerStyle={[pad, contentStyle]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        ) : (
          <View style={[{ flex: 1 }, contentStyle]}>{children}</View>
        )}
        {footer}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Go back when there is history (deep links, web refresh), otherwise land on a sensible screen. */
export function goBack(fallback: Href = "/home") {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}

type TopBarProps = {
  title?: string;
  /** Show a close (X) instead of a back chevron. */
  close?: boolean;
  fallback?: Href;
  right?: ReactNode;
  center?: ReactNode;
  back?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function TopBar({ title, close, fallback, right, center, back = true, style }: TopBarProps) {
  return (
    <View style={[{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 }, style]}>
      {back ? <IconButton icon={close ? X : ChevronLeft} label={close ? "Close" : "Back"} onPress={() => goBack(fallback)} /> : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        {center ?? (title ? (
          <Text variant="title" style={{ fontSize: 22, lineHeight: 26 }} accessibilityRole="header" numberOfLines={1}>
            {title}
          </Text>
        ) : null)}
      </View>
      {right}
    </View>
  );
}

export function SectionLabel({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={style}>
      <Text variant="label">{children}</Text>
    </View>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44 }}>
      <Text variant="h2" accessibilityRole="header">
        {title}
      </Text>
      {action}
    </View>
  );
}

export function IconTile({ icon: Icon, fill, size = 44 }: { icon: LucideIcon; fill: string; size?: number }) {
  const v = useVolume();
  return (
    <View style={{ width: size, height: size, borderRadius: 10, borderWidth: v.border, borderColor: v.line, backgroundColor: fill, alignItems: "center", justifyContent: "center" }}>
      <Icon size={Math.round(size * 0.45)} color={v.fg} strokeWidth={2.3} />
    </View>
  );
}

export function Row({ children, gap = 12, style }: { children: ReactNode; gap?: number; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: "row", alignItems: "center", gap }, style]}>{children}</View>;
}

export function Divider() {
  const v = useVolume();
  return <View style={{ height: 2, backgroundColor: v.line, opacity: 0.12 }} />;
}
