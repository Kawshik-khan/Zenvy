import type { CSSProperties } from "react";
import { cx } from "@/components/ui";

/** Four-point sparkle that twinkles. Decorative. */
export function Sparkle({ size = 32, className = "fill-focus", delay = "0s" }: { size?: number; className?: string; delay?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="animate-nb-twinkle" style={{ animationDelay: delay }}>
      <path d="M12 1 C13 8 16 11 23 12 C16 13 13 16 12 23 C11 16 8 13 1 12 C8 11 11 8 12 1 Z" className={cx(className, "stroke-ink")} strokeWidth={1.6} strokeLinejoin="round" />
    </svg>
  );
}

/** Emoji in a round sticker with a hard shadow. Decorative. */
export function EmojiSticker({ emoji, rotate = 0, motion = "float", delay = "0s" }: { emoji: string; rotate?: number; motion?: "float" | "sway"; delay?: string }) {
  return (
    <span aria-hidden="true" className={cx("inline-block", motion === "float" ? "animate-nb-float" : "animate-nb-sway")} style={{ animationDelay: delay }}>
      <span className="inline-flex size-14 items-center justify-center rounded-full border-nb bg-card text-[28px] leading-none shadow-nb" style={{ rotate: `${rotate}deg` }}>
        {emoji}
      </span>
    </span>
  );
}

type Placed = { style: CSSProperties; wide?: boolean; node: React.ReactNode };

const HERO_DECOR: Placed[] = [
  { style: { left: "3%", top: "7%" }, node: <Sparkle size={44} /> },
  { style: { left: "45%", top: "5%" }, wide: true, node: <Sparkle size={30} className="fill-match" delay="-0.9s" /> },
  { style: { left: "48%", bottom: "12%" }, wide: true, node: <Sparkle size={22} className="fill-chat" delay="-1.6s" /> },
  { style: { right: "3%", top: "44%" }, wide: true, node: <Sparkle size={34} className="fill-live" delay="-0.4s" /> },
  { style: { left: "7%", bottom: "7%" }, wide: true, node: <Sparkle size={26} className="fill-career" delay="-2.1s" /> },
  { style: { right: "30%", top: "4%" }, node: <Sparkle size={20} delay="-1.2s" /> },
  { style: { left: "38%", bottom: "4%" }, wide: true, node: <EmojiSticker emoji="📚" rotate={-8} /> },
  { style: { left: "30%", top: "3%" }, wide: true, node: <EmojiSticker emoji="✏️" rotate={10} motion="sway" delay="-0.5s" /> },
  { style: { right: "2%", top: "7%" }, wide: true, node: <EmojiSticker emoji="🎧" rotate={8} delay="-1.1s" /> },
  { style: { right: "2%", bottom: "20%" }, wide: true, node: <EmojiSticker emoji="☕" rotate={-6} motion="sway" delay="-0.8s" /> },
  { style: { left: "1.5%", top: "44%" }, wide: true, node: <EmojiSticker emoji="⏰" rotate={-10} delay="-1.7s" /> },
  { style: { left: "50%", top: "14%" }, wide: true, node: <EmojiSticker emoji="💡" rotate={6} delay="-0.3s" /> },
];

/** Sparkles and emoji stickers behind the hero. They drift with the pointer. */
export function HeroDecorations() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
      {HERO_DECOR.map((item, index) => (
        <div key={index} className={cx("absolute max-lg:hidden", item.wide && "max-xl:hidden")} style={item.style}>
          {item.node}
        </div>
      ))}
    </div>
  );
}
