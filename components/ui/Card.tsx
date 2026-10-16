import type { ComponentProps, ElementType, ReactNode } from "react";
import { cx } from "./cx";
import { textOn, toneBg, type Tone } from "./tokens";

type Shadow = "none" | "sm" | "md" | "lg";

const shadowClasses: Record<Shadow, string> = {
  none: "",
  sm: "shadow-nb",
  md: "shadow-nb-md",
  lg: "shadow-nb-lg",
};

const paddingClasses = {
  none: "",
  sm: "p-4",
  md: "p-5 md:p-6",
  lg: "p-6 md:p-8",
};

type CardProps<T extends ElementType> = {
  as?: T;
  tone?: Tone;
  shadow?: Shadow;
  padding?: keyof typeof paddingClasses;
  /** Adds the hover lift / press sink. Use only when the whole card is clickable. */
  interactive?: boolean;
  className?: string;
  children?: ReactNode;
} & Omit<ComponentProps<T>, "as" | "className" | "children">;

export function Card<T extends ElementType = "div">({
  as,
  tone = "card",
  shadow = "md",
  padding = "md",
  interactive = false,
  className,
  children,
  ...props
}: CardProps<T>) {
  const Component: ElementType = as ?? "div";
  return (
    <Component
      className={cx(
        "border-nb overflow-hidden rounded-nb-lg",
        textOn(tone),
        toneBg[tone],
        shadowClasses[shadow],
        paddingClasses[padding],
        interactive && "nb-press nb-focus",
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

type CardHeaderProps = {
  title: ReactNode;
  /** Heading level for the title; defaults to h2. */
  level?: 2 | 3 | 4;
  tone?: Tone;
  action?: ReactNode;
  className?: string;
};

/** Coloured header band for a Card with `padding="none"`. */
export function CardHeader({ title, level = 2, tone = "card", action, className }: CardHeaderProps) {
  const Heading = `h${level}` as const;
  return (
    <div
      className={cx(
        "flex items-center justify-between gap-3 border-b-[length:var(--nb-border-width)] border-line px-5 py-4",
        toneBg[tone],
        textOn(tone),
        className,
      )}
    >
      <Heading className="m-0 font-grotesk text-xl font-bold">{title}</Heading>
      {action}
    </div>
  );
}
