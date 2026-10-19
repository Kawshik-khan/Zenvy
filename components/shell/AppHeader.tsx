import type { ReactNode } from "react";
import GlobalPeopleSearch from "@/components/shell/GlobalPeopleSearch";
import NotificationBell from "@/components/shell/NotificationBell";
import { cx } from "@/components/ui";

type AppHeaderProps = {
  /** Page-specific buttons shown before the bell, e.g. "Create group". */
  actions?: ReactNode;
  /** Small text at the left on wide screens (the page's own h1 stays in the content). */
  title?: ReactNode;
  className?: string;
};

/** Top bar for signed-in pages: people search, page actions and notifications. */
export function AppHeader({ actions, title, className }: AppHeaderProps) {
  return (
    <header
      className={cx(
        "sticky top-0 z-30 flex items-center gap-3 border-b-[length:var(--nb-border-width)] border-line bg-canvas px-4 py-3 md:gap-4 md:px-8",
        className,
      )}
    >
      {title && <div className="hidden font-grotesk text-lg font-bold text-fg lg:block">{title}</div>}
      <GlobalPeopleSearch className="min-w-0 flex-1 md:max-w-xl" />
      <div className="ml-auto flex shrink-0 items-center gap-2 md:gap-3">
        {actions}
        <NotificationBell />
      </div>
    </header>
  );
}
