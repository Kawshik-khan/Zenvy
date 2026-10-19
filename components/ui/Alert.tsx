import { AlertTriangle, Check, Info } from "lucide-react";
import type { ReactNode } from "react";
import { cx } from "./cx";

type AlertTone = "info" | "success" | "warning" | "error";

const styles: Record<AlertTone, { chip: string; icon: ReactNode; role: "alert" | "status" }> = {
  info: { chip: "bg-chat", icon: <Info size={18} />, role: "status" },
  success: { chip: "bg-live", icon: <Check size={18} />, role: "status" },
  warning: { chip: "bg-focus", icon: <AlertTriangle size={18} />, role: "alert" },
  error: { chip: "bg-alert", icon: <AlertTriangle size={18} />, role: "alert" },
};

type AlertProps = {
  tone?: AlertTone;
  title?: ReactNode;
  /** Swap the default icon, e.g. a mail icon for "check your inbox". */
  icon?: ReactNode;
  className?: string;
  children?: ReactNode;
};

/**
 * Inline message. Errors and warnings use role="alert" (announced immediately);
 * info and success use role="status" (announced politely).
 */
export function Alert({ tone = "info", title, icon, className, children }: AlertProps) {
  const style = styles[tone];
  return (
    <div role={style.role} className={cx("flex items-start gap-3 rounded-nb border-nb bg-card p-3 font-grotesk text-fg", className)}>
      <span aria-hidden="true" className={cx("inline-flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-line text-ink", style.chip)}>
        {icon ?? style.icon}
      </span>
      <div className="min-w-0 flex-1 pt-1 text-[15px] leading-snug">
        {title && <p className="m-0 font-bold">{title}</p>}
        {children && <div className={cx(title ? "mt-0.5 text-fg-muted" : undefined)}>{children}</div>}
      </div>
    </div>
  );
}
