import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { cx } from "@/components/ui";

const widths = { sm: "max-w-md", lg: "max-w-2xl", xl: "max-w-6xl" };

type AuthShellProps = {
  /** Link or button shown at the right of the header (e.g. "Sign in"). */
  action?: ReactNode;
  width?: keyof typeof widths;
  children: ReactNode;
};

/** Page frame for signed-out screens and onboarding: logo header, centred content. */
export function AuthShell({ action, width = "sm", children }: AuthShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas font-grotesk text-fg">
      <header className="border-b-[length:var(--nb-border-width)] border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <Logo />
          {action}
        </div>
      </header>
      <main id="main-content" className="flex flex-1 items-start justify-center px-4 py-10 md:items-center md:py-14">
        <div className={cx("w-full", widths[width])}>{children}</div>
      </main>
    </div>
  );
}
