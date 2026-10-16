// Mirror of the Layer 1 palette in app/globals.css, for tests and docs.
// tokens.test.ts fails if the two drift apart.

export const palette = {
  paper: "#fff8ec",
  ink: "#111111",
  match: "#ff6b9d",
  chat: "#4d96ff",
  focus: "#ffd23f",
  live: "#3ddc97",
  alert: "#ff5a36",
  career: "#b794f6",
  "quiet-paper": "#f4eee2",
  "quiet-card": "#fbf8f1",
  "quiet-ink": "#2b2b2b",
  "quiet-shade": "#e8dfcc",
  muted: "#4a4a4a",
} as const;

export type PaletteName = keyof typeof palette;

/** Accent fills that carry meaning. Text on them is always ink. */
export const accents = ["match", "chat", "focus", "live", "alert", "career"] as const;
export type Accent = (typeof accents)[number];

/** Tailwind background class per tone. Written out in full so Tailwind can see them. */
export const toneBg = {
  card: "bg-card",
  paper: "bg-canvas",
  ink: "bg-ink",
  match: "bg-match",
  chat: "bg-chat",
  focus: "bg-focus",
  live: "bg-live",
  alert: "bg-alert",
  career: "bg-career",
} as const;

export type Tone = keyof typeof toneBg;

/** The one text colour that is readable on a tone. Never combine with another text-* class. */
export function textOn(tone: Tone) {
  if (tone === "ink") return "text-paper";
  if (tone === "card" || tone === "paper") return "text-fg";
  return "text-ink";
}
