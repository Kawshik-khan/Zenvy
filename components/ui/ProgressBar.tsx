import { cx } from "./cx";
import { toneBg, type Tone } from "./tokens";

type ProgressBarProps = {
  value: number;
  max?: number;
  /** Accessible name, e.g. "Weekly focus goal". */
  label: string;
  tone?: Tone;
  className?: string;
};

export function ProgressBar({ value, max = 100, label, tone = "focus", className }: ProgressBarProps) {
  const safeMax = max > 0 ? max : 100;
  const clamped = Math.min(Math.max(value, 0), safeMax);
  const percent = Math.round((clamped / safeMax) * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuenow={clamped}
      className={cx("h-4 w-full overflow-hidden rounded-full border-nb bg-canvas", className)}
    >
      <div
        className={cx("h-full", toneBg[tone], percent > 0 && percent < 100 && "border-r-[length:var(--nb-border-width)] border-line")}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
