import { useState, type ReactNode } from "react";
import { Pressable, StyleSheet, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from "react-native";
import type { Href } from "expo-router";
import type { LucideIcon } from "lucide-react-native";
import { font, palette, radius, textOn, toneColor, TOUCH, type Tone } from "../theme/tokens";
import { useVolume } from "../theme/volume";
import { Surface } from "./Surface";
import { Text } from "./Text";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "match" | "chat" | "focus" | "live" | "career";
type Size = "sm" | "md" | "lg";
const heights: Record<Size, number> = { sm: TOUCH, md: 48, lg: 56 };
const variantTone: Record<ButtonVariant, Tone> = {
  primary: "ink",
  secondary: "card",
  ghost: "paper",
  danger: "alert",
  match: "match",
  chat: "chat",
  focus: "focus",
  live: "live",
  career: "career",
};

type ButtonProps = {
  label: string;
  onPress?: () => void;
  href?: Href;
  variant?: ButtonVariant;
  size?: Size;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  disabled?: boolean;
  /** Dashed, shadowless "done" state (Requested, Joined). */
  settled?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

export function Button({ label, onPress, href, variant = "primary", size = "md", icon: Icon, iconRight: IconRight, disabled, settled, containerStyle, accessibilityLabel }: ButtonProps) {
  const v = useVolume();
  const quietDone = disabled || settled;
  const tone: Tone = quietDone ? "paper" : variantTone[variant];
  const fg = disabled ? v.fgMuted : textOn(tone, v);
  const ghost = variant === "ghost";
  return (
    <Surface
      tone={tone}
      fill={quietDone ? palette.quietPaper : undefined}
      shadow={ghost || quietDone ? "none" : "sm"}
      radius={radius.md}
      dashed={quietDone}
      borderWidth={ghost ? 0 : undefined}
      onPress={disabled ? undefined : onPress}
      href={disabled ? undefined : href}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={href ? "link" : "button"}
      accessibilityState={{ disabled: !!disabled }}
      containerStyle={containerStyle}
      style={[styles.button, { minHeight: heights[size], paddingHorizontal: size === "lg" ? 22 : 16 }]}
    >
      {Icon ? <Icon size={size === "lg" ? 20 : 18} color={fg} strokeWidth={2.4} /> : null}
      <Text variant="strong" color={fg} style={{ fontFamily: font.bold, fontSize: size === "lg" ? 17 : 15 }} numberOfLines={1}>
        {label}
      </Text>
      {IconRight ? <IconRight size={18} color={fg} strokeWidth={2.4} /> : null}
    </Surface>
  );
}

type IconButtonProps = {
  icon: LucideIcon;
  /** Required: icon-only buttons need a spoken name. */
  label: string;
  onPress?: () => void;
  href?: Href;
  tone?: Tone;
  size?: number;
  badge?: string | null;
  badgeTone?: Tone;
  selected?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  round?: boolean;
  iconColor?: string;
  shadow?: boolean;
};

export function IconButton({ icon: Icon, label, onPress, href, tone = "card", size = TOUCH, badge, badgeTone = "alert", selected, containerStyle, round, iconColor, shadow = true }: IconButtonProps) {
  const v = useVolume();
  return (
    <View style={containerStyle}>
      <Surface
        tone={tone}
        shadow={shadow ? "sm" : "none"}
        radius={round ? radius.pill : radius.md}
        onPress={onPress}
        href={href}
        accessibilityLabel={badge ? `${label}, ${badge} new` : label}
        accessibilityState={selected === undefined ? undefined : { selected }}
        style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}
      >
        <Icon size={Math.round(size * 0.45)} color={iconColor ?? textOn(tone, v)} strokeWidth={2.3} />
      </Surface>
      {badge ? <CountBadge value={badge} tone={badgeTone} style={{ position: "absolute", top: -8, right: -8 }} /> : null}
    </View>
  );
}

export function CountBadge({ value, tone = "alert", style }: { value: string; tone?: Tone; style?: StyleProp<ViewStyle> }) {
  const v = useVolume();
  return (
    <View
      pointerEvents="none"
      importantForAccessibility="no-hide-descendants"
      style={[{ minWidth: 22, height: 22, paddingHorizontal: 5, borderRadius: 11, borderWidth: 2, borderColor: v.line, backgroundColor: toneColor(tone, v), alignItems: "center", justifyContent: "center" }, style]}
    >
      <Text variant="mono" style={{ fontSize: 11, lineHeight: 14 }} color={v.fg}>
        {value}
      </Text>
    </View>
  );
}

export function Chip({ label, selected, onPress, tone = "match", style }: { label: string; selected?: boolean; onPress?: () => void; tone?: Tone; style?: StyleProp<ViewStyle> }) {
  const v = useVolume();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      style={({ pressed }) => [
        styles.chip,
        {
          borderColor: v.line,
          borderWidth: selected ? v.border : v.border - 1,
          backgroundColor: selected ? toneColor(tone, v) : v.card,
          transform: pressed ? [{ scale: 0.96 }] : undefined,
        },
        style,
      ]}
    >
      <Text variant="strong" style={{ fontSize: 14 }} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Badge({ label, tone = "paper", icon: Icon, style }: { label: string; tone?: Tone; icon?: LucideIcon; style?: StyleProp<ViewStyle> }) {
  const v = useVolume();
  return (
    <View style={[styles.badge, { borderColor: v.line, backgroundColor: toneColor(tone, v) }, style]}>
      {Icon ? <Icon size={13} color={textOn(tone, v)} strokeWidth={2.6} /> : null}
      <Text variant="small" color={textOn(tone, v)} style={{ fontFamily: font.semibold, fontSize: 12, lineHeight: 16 }}>
        {label}
      </Text>
    </View>
  );
}

export function Avatar({ initials, color, size = 44, square, style }: { initials: string; color: string; size?: number; square?: boolean; style?: StyleProp<ViewStyle> }) {
  const v = useVolume();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          width: size,
          height: size,
          borderRadius: square ? Math.round(size * 0.24) : size / 2,
          borderWidth: size > 40 ? v.border : v.border - 1,
          borderColor: v.line,
          backgroundColor: color,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      <Text style={{ fontFamily: font.bold, fontSize: Math.round(size * 0.34), lineHeight: Math.round(size * 0.42) }} color={v.fg}>
        {initials}
      </Text>
    </View>
  );
}

export function ProgressBar({ value, label, tone = "ink", height = 16, track }: { value: number; label: string; tone?: Tone; height?: number; track?: string }) {
  const v = useVolume();
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }}
      style={{ height, borderRadius: height, borderWidth: v.border, borderColor: v.line, backgroundColor: track ?? v.card, overflow: "hidden" }}
    >
      <View style={{ width: `${pct * 100}%`, height: "100%", backgroundColor: toneColor(tone, v) }} />
    </View>
  );
}

type FieldProps = TextInputProps & {
  label: string;
  hint?: string;
  error?: string;
  right?: ReactNode;
  mono?: boolean;
};

export function Field({ label, hint, error, right, mono, style, multiline, onFocus, onBlur, ...props }: FieldProps) {
  const v = useVolume();
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Text variant="h3" style={{ fontSize: 14 }}>
        {label}
      </Text>
      <View>
        <TextInput
          {...props}
          accessibilityLabel={label}
          placeholderTextColor={v.fgMuted}
          multiline={multiline}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[
            styles.input,
            {
              borderColor: error ? palette.alert : focused ? palette.chat : v.line,
              borderWidth: v.border,
              color: v.fg,
              fontFamily: mono ? font.mono : font.medium,
              minHeight: multiline ? 104 : 52,
              paddingTop: multiline ? 12 : 0,
              textAlignVertical: multiline ? "top" : "center",
              paddingRight: right ? 52 : 14,
            },
            style,
          ]}
        />
        {right ? <View style={{ position: "absolute", right: 4, top: 4 }}>{right}</View> : null}
      </View>
      {error ? (
        <Text variant="small" color={palette.alert} style={{ fontFamily: font.semibold }}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="small" muted style={{ fontSize: 12 }}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

export function Segmented<K extends string>({ options, value, onChange, tone = "ink", label }: { options: { key: K; label: string }[]; value: K; onChange: (k: K) => void; tone?: Tone; label: string }) {
  const v = useVolume();
  return (
    <View accessibilityRole="tablist" accessibilityLabel={label} style={[styles.segment, { borderColor: v.line, borderWidth: v.border, backgroundColor: v.card }]}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={[styles.segmentItem, on && { backgroundColor: toneColor(tone, v), borderColor: v.line, borderWidth: 2 }]}
          >
            <Text variant="strong" color={on ? textOn(tone, v) : v.fg} style={{ fontFamily: font.bold, fontSize: 14 }} numberOfLines={1}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Toggle({ value, onValueChange, label }: { value: boolean; onValueChange: (next: boolean) => void; label: string }) {
  const v = useVolume();
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      hitSlop={8}
      style={{ minHeight: TOUCH, justifyContent: "center" }}
    >
      <View style={{ width: 56, height: 32, borderRadius: 16, borderWidth: v.border, borderColor: v.line, backgroundColor: value ? palette.live : palette.heat0, justifyContent: "center" }}>
        <View
          style={{
            position: "absolute",
            left: value ? 26 : 2,
            width: 22,
            height: 22,
            borderRadius: 11,
            borderWidth: v.border,
            borderColor: v.line,
            backgroundColor: palette.white,
          }}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  chip: { minHeight: TOUCH, paddingHorizontal: 14, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", borderWidth: 2, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 2 },
  input: { borderRadius: radius.md, backgroundColor: palette.white, paddingHorizontal: 14, fontSize: 16 },
  segment: { flexDirection: "row", gap: 4, padding: 4, borderRadius: 12 },
  segmentItem: { flex: 1, minHeight: TOUCH, borderRadius: radius.sm, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "transparent", paddingHorizontal: 4 },
});
