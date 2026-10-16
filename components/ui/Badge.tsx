import type { ComponentProps, ReactNode } from "react";
import { cx } from "./cx";
import { textOn, toneBg, type Tone } from "./tokens";

type BadgeProps = {
  tone?: Tone;
  size?: "sm" | "md";
  /** Square corners read as a label ("Internship"); round reads as a tag ("React"). */
  shape?: "pill" | "label";
  className?: string;
  children: ReactNode;
};

export function Badge({ tone = "card", size = "md", shape = "pill", className, children }: BadgeProps) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 border-2 border-line font-grotesk font-bold whitespace-nowrap",
        shape === "pill" ? "rounded-full" : "rounded-md",
        size === "sm" ? "px-2 py-0 text-xs" : "px-3 py-1 text-sm",
        toneBg[tone],
        textOn(tone),
        className,
      )}
    >
      {children}
    </span>
  );
}

type ChipProps = Omit<ComponentProps<"button">, "aria-pressed"> & {
  selected?: boolean;
  /** Fill used when selected. */
  tone?: Tone;
};

/** Toggle chip for filters. Exposes its state with aria-pressed. */
export function Chip({ selected = false, tone = "focus", className, type = "button", children, ...props }: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cx(
        "nb-focus inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border-nb px-4 font-grotesk text-[15px] font-bold transition-[box-shadow] duration-75",
        selected ? cx(toneBg[tone], textOn(tone), "shadow-nb-sm") : "bg-card text-fg",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
