import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { accents, palette } from "./tokens";

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const linear = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("palette", () => {
  const css = readFileSync(path.resolve(__dirname, "../../app/globals.css"), "utf8");

  it.each(Object.entries(palette))("globals.css defines --color-%s as %s", (name, value) => {
    expect(css).toContain(`--color-${name}: ${value};`);
  });

  it.each(accents)("ink text on %s meets WCAG AA (4.5:1)", (accent) => {
    expect(contrast(palette.ink, palette[accent])).toBeGreaterThanOrEqual(4.5);
  });

  it.each([
    ["ink", "paper"],
    ["muted", "paper"],
    ["quiet-ink", "quiet-paper"],
    ["quiet-ink", "quiet-card"],
    ["paper", "ink"],
  ] as const)("%s on %s meets WCAG AA", (fg, bg) => {
    expect(contrast(palette[fg], palette[bg])).toBeGreaterThanOrEqual(4.5);
  });
});
