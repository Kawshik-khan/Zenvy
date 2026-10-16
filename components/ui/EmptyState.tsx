import type { ReactNode } from "react";
import { cx } from "./cx";

type EmptyStateProps = {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div className={cx("flex flex-col items-center gap-3 rounded-nb-lg border-nb border-dashed bg-canvas px-6 py-10 text-center text-fg", className)}>
      {icon && (
        <span aria-hidden="true" className="inline-flex size-14 items-center justify-center rounded-full border-nb bg-focus text-ink">
          {icon}
        </span>
      )}
      <p className="m-0 font-grotesk text-xl font-bold">{title}</p>
      {description && <p className="m-0 max-w-md text-[15px] text-fg-muted">{description}</p>}
      {action}
    </div>
  );
}
