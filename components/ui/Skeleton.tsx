import { cx } from "./cx";

type SkeletonBlockProps = {
  className?: string;
};

/** Shimmering placeholder. Hidden from assistive tech; pair a loading region with aria-busy. */
export function SkeletonBlock({ className }: SkeletonBlockProps) {
  return (
    <div
      aria-hidden="true"
      className={cx(
        "rounded-nb bg-[linear-gradient(100deg,var(--color-quiet-paper)_30%,var(--color-quiet-shade)_50%,var(--color-quiet-paper)_70%)] bg-[length:200%_100%] animate-nb-shimmer",
        className,
      )}
    />
  );
}

export function SkeletonText({ className }: SkeletonBlockProps) {
  return <SkeletonBlock className={cx("h-3 rounded-full", className)} />;
}

export function SkeletonAvatar({ className }: SkeletonBlockProps) {
  return <SkeletonBlock className={cx("rounded-full", className)} />;
}

export function SkeletonCard({ className }: SkeletonBlockProps) {
  return (
    <div className={cx("rounded-nb-lg border-nb bg-card p-5 shadow-nb", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-3">
          <SkeletonText className="w-24" />
          <SkeletonBlock className="h-8 w-32" />
          <SkeletonText className="w-40" />
        </div>
        <SkeletonAvatar className="size-11" />
      </div>
    </div>
  );
}
