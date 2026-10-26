// Zenvy Brutal tokens for React Native. Mirrors app/globals.css and components/ui/tokens.ts
// in the web app: each accent carries one meaning, text on every accent is ink.

export const palette = {
  paper: "#fff8ec",
  ink: "#111111",
  white: "#ffffff",
  match: "#ff6b9d",
  chat: "#4d96ff",
  focus: "#ffd23f",
  live: "#3ddc97",
  alert: "#ff5a36",
  career: "#b794f6",
  muted: "#4a4a4a",
  quietPaper: "#f4eee2",
  quietCard: "#fbf8f1",
  quietInk: "#2b2b2b",
  quietMuted: "#4f4a42",
  quietShade: "#e8dfcc",
  heat0: "#efe8d8",
  heat1: "#ffe9a3",
  heat2: "#ffd23f",
  heat3: "#e0a800",
  heat4: "#111111",
} as const;

export type Accent = "match" | "chat" | "focus" | "live" | "alert" | "career";
export type Tone = Accent | "card" | "paper" | "ink";

/** Loud volume for connecting with people; quiet for doing the work (focus, calls, threads). */
export type Volume = "loud" | "quiet";

export type VolumeTokens = {
  canvas: string;
  card: string;
  line: string;
  fg: string;
  fgMuted: string;
  border: number;
  offset: number;
};

export const volumes: Record<Volume, VolumeTokens> = {
  loud: { canvas: palette.paper, card: palette.white, line: palette.ink, fg: palette.ink, fgMuted: palette.muted, border: 3, offset: 4 },
  quiet: { canvas: palette.quietPaper, card: palette.quietCard, line: palette.quietInk, fg: palette.quietInk, fgMuted: palette.quietMuted, border: 2, offset: 3 },
};

export function toneColor(tone: Tone, v: VolumeTokens = volumes.loud) {
  if (tone === "card") return v.card;
  if (tone === "paper") return v.canvas;
  if (tone === "ink") return v.line;
  return palette[tone];
}

/** The one text colour readable on a tone. */
export function textOn(tone: Tone, v: VolumeTokens = volumes.loud) {
  return tone === "ink" ? palette.paper : v.fg;
}

export const radius = { sm: 8, md: 10, lg: 14, pill: 999 } as const;

export const font = {
  regular: "SpaceGrotesk_400Regular",
  medium: "SpaceGrotesk_500Medium",
  semibold: "SpaceGrotesk_600SemiBold",
  bold: "SpaceGrotesk_700Bold",
  mono: "JetBrainsMono_500Medium",
  monoBold: "JetBrainsMono_700Bold",
} as const;

/** Minimum touch target, per the design system. */
export const TOUCH = 44;
