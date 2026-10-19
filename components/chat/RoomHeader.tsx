import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { buttonClasses, cx } from "@/components/ui";

type RoomHeaderProps = {
  backHref: string;
  backLabel: string;
  title: ReactNode;
  /** Heading level; the inbox owns the page h1, so its room header is an h2. */
  level?: 1 | 2;
  /** The inbox already has the list on screen at desktop width, so its back button is phone-only. */
  backOnDesktop?: boolean;
  subtitle?: ReactNode;
  leading?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

/** Top bar of a conversation, group or channel: back, who it is, and the actions that apply. */
export function RoomHeader({ backHref, backLabel, title, level = 1, backOnDesktop = false, subtitle, leading, actions, className }: RoomHeaderProps) {
  const Heading = `h${level}` as const;
  return (
    <header
      className={cx(
        "flex shrink-0 items-center justify-between gap-3 border-b-[length:var(--nb-border-width)] border-line bg-canvas px-3 py-3 md:px-6",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Link href={backHref} aria-label={backLabel} title={backLabel} className={buttonClasses({ variant: "secondary", size: "sm", square: true, className: backOnDesktop ? undefined : "md:hidden" })}>
          <ArrowLeft aria-hidden="true" size={20} />
        </Link>
        {leading}
        <div className="min-w-0">
          <Heading className="m-0 truncate font-grotesk text-lg font-bold text-fg md:text-xl">{title}</Heading>
          {subtitle && <div className="truncate text-sm text-fg-muted">{subtitle}</div>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
