import Link from "next/link";
import { cx } from "@/components/ui";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cx("nb-focus flex items-center gap-2.5 rounded-nb no-underline", className)}>
      <span aria-hidden="true" className="inline-flex size-10 items-center justify-center rounded-nb border-nb bg-focus text-xl font-bold text-ink shadow-nb-sm">
        Z
      </span>
      <span className="font-grotesk text-2xl font-bold tracking-tight text-fg">zenvy</span>
    </Link>
  );
}
