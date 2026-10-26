import { Text as RNText, type TextProps, type TextStyle } from "react-native";
import { font } from "../theme/tokens";
import { useVolume } from "../theme/volume";

const variants = {
  display: { fontFamily: font.bold, fontSize: 34, lineHeight: 36, letterSpacing: -0.8 },
  title: { fontFamily: font.bold, fontSize: 26, lineHeight: 30, letterSpacing: -0.4 },
  h2: { fontFamily: font.bold, fontSize: 18, lineHeight: 23 },
  h3: { fontFamily: font.bold, fontSize: 15, lineHeight: 20 },
  body: { fontFamily: font.regular, fontSize: 15, lineHeight: 22 },
  small: { fontFamily: font.regular, fontSize: 13, lineHeight: 18 },
  strong: { fontFamily: font.semibold, fontSize: 15, lineHeight: 20 },
  label: { fontFamily: font.monoBold, fontSize: 11, lineHeight: 14, letterSpacing: 0.9, textTransform: "uppercase" },
  mono: { fontFamily: font.monoBold, fontSize: 14, lineHeight: 18 },
  monoLg: { fontFamily: font.monoBold, fontSize: 24, lineHeight: 28 },
} satisfies Record<string, TextStyle>;

export type TextVariant = keyof typeof variants;

type Props = TextProps & {
  variant?: TextVariant;
  /** Secondary text colour for the current volume. */
  muted?: boolean;
  color?: string;
};

export function Text({ variant = "body", muted, color, style, ...props }: Props) {
  const v = useVolume();
  const tone = color ?? (muted || variant === "label" ? v.fgMuted : v.fg);
  return <RNText style={[variants[variant], { color: tone }, style]} {...props} />;
}
