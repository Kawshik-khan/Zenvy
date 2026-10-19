import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cx } from "./cx";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "match" | "chat" | "focus" | "live" | "career";
export type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-ink text-paper",
  secondary: "bg-card text-fg",
  ghost: "bg-transparent text-fg",
  danger: "bg-alert text-ink",
  match: "bg-match text-ink",
  chat: "bg-chat text-ink",
  focus: "bg-focus text-ink",
  live: "bg-live text-ink",
  career: "bg-career text-ink",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-11 px-3.5 text-sm gap-1.5",
  md: "min-h-12 px-5 text-base gap-2",
  lg: "min-h-14 px-7 text-lg gap-2.5",
};

// Icon-only buttons are a fixed square. They must not also carry the horizontal padding from
// sizeClasses: two competing padding utilities on one element is decided by stylesheet order.
const squareClasses: Record<ButtonSize, string> = {
  sm: "size-11 p-0",
  md: "size-12 p-0",
  lg: "size-14 p-0",
};

type StyleOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  /** Fixed square for icon-only buttons and links. */
  square?: boolean;
  className?: string;
};

/** Class list shared by Button and ButtonLink. */
export function buttonClasses({ variant = "primary", size = "md", fullWidth, square, className }: StyleOptions = {}) {
  const isGhost = variant === "ghost";
  return cx(
    "nb-focus inline-flex items-center justify-center rounded-nb font-grotesk font-bold leading-none whitespace-nowrap [&>svg]:shrink-0",
    "cursor-pointer select-none no-underline",
    isGhost ? "border-[length:var(--nb-border-width)] border-transparent" : "border-nb nb-press shadow-nb",
    "disabled:cursor-not-allowed disabled:border-dashed disabled:bg-quiet-paper disabled:text-fg-muted disabled:shadow-none",
    "aria-disabled:cursor-not-allowed aria-disabled:border-dashed aria-disabled:bg-quiet-paper aria-disabled:text-fg-muted aria-disabled:shadow-none",
    variantClasses[variant],
    square ? squareClasses[size] : sizeClasses[size],
    fullWidth && "w-full",
    className,
  );
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none"
    />
  );
}

type ButtonProps = ComponentProps<"button"> &
  StyleOptions & {
    loading?: boolean;
    icon?: ReactNode;
  };

export function Button({
  variant,
  size,
  fullWidth,
  loading = false,
  icon,
  className,
  type = "button",
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...props}
    >
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> &
  StyleOptions & {
    icon?: ReactNode;
  };

/** A link styled as a button. Use for navigation; use Button for actions. */
export function ButtonLink({ variant, size, fullWidth, icon, className, children, ...props }: ButtonLinkProps) {
  return (
    <Link className={buttonClasses({ variant, size, fullWidth, className })} {...props}>
      {icon}
      {children}
    </Link>
  );
}
