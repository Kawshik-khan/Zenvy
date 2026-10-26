import { type ReactNode } from "react";
import { Pressable, View, type AccessibilityRole, type StyleProp, type ViewStyle } from "react-native";
import { router, type Href } from "expo-router";
import { radius as radii, toneColor, type Tone } from "../theme/tokens";
import { useVolume } from "../theme/volume";

export type ShadowSize = "none" | "sm" | "md" | "lg";
const shadowScale: Record<ShadowSize, number> = { none: 0, sm: 0.75, md: 1.25, lg: 2 };

export type SurfaceProps = {
  tone?: Tone;
  /** Override the fill (for one-off colours such as avatars). */
  fill?: string;
  shadow?: ShadowSize;
  radius?: number;
  borderWidth?: number;
  dashed?: boolean;
  /** Outer box: size and position (flex, width, margins). */
  containerStyle?: StyleProp<ViewStyle>;
  /** Inner box: padding, layout of children. */
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  href?: Href;
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: { selected?: boolean; checked?: boolean; disabled?: boolean };
  disabled?: boolean;
  children?: ReactNode;
};

/**
 * The Zenvy Brutal surface: flat fill, ink edge and a hard offset shadow drawn as a second box.
 * Pressable surfaces sink into their shadow while pressed, like the web `nb-press` utility.
 */
export function Surface({
  tone = "card",
  fill,
  shadow = "md",
  radius = radii.lg,
  borderWidth,
  dashed,
  containerStyle,
  style,
  onPress,
  href,
  accessibilityLabel,
  accessibilityRole,
  accessibilityState,
  disabled,
  children,
}: SurfaceProps) {
  const v = useVolume();
  const offset = Math.round(v.offset * shadowScale[shadow]);
  const bg = fill ?? toneColor(tone, v);
  const interactive = !!(onPress || href) && !disabled;

  const body = (pressed: boolean) => (
    <>
      {offset > 0 && !pressed ? (
        <View
          pointerEvents="none"
          style={{ position: "absolute", top: offset, left: offset, right: -offset, bottom: -offset, borderRadius: radius, backgroundColor: v.line }}
        />
      ) : null}
      <View
        style={[
          {
            backgroundColor: bg,
            borderColor: v.line,
            borderWidth: borderWidth ?? v.border,
            borderStyle: dashed ? "dashed" : "solid",
            borderRadius: radius,
            overflow: "hidden",
          },
          pressed && { transform: [{ translateX: offset }, { translateY: offset }] },
          style,
        ]}
      >
        {children}
      </View>
    </>
  );

  if (!interactive) {
    return (
      <View style={containerStyle} accessibilityLabel={accessibilityLabel} accessibilityRole={accessibilityRole}>
        {body(false)}
      </View>
    );
  }

  return (
    <Pressable
      style={containerStyle}
      onPress={() => {
        onPress?.();
        if (href) router.push(href);
      }}
      accessibilityRole={accessibilityRole ?? (href ? "link" : "button")}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      hitSlop={4}
    >
      {({ pressed }) => body(pressed)}
    </Pressable>
  );
}
