import type { ComponentProps, ReactNode } from "react";
import { buttonClasses, type ButtonVariant } from "./Button";
import { cx } from "./cx";

type IconButtonProps = Omit<ComponentProps<"button">, "children" | "aria-label"> & {
  /** Accessible name. Required because the button has no visible text. */
  label: string;
  icon: ReactNode;
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
};

const squareSize = {
  sm: "size-11 p-0",
  md: "size-12 p-0",
  lg: "size-14 p-0",
};

export function IconButton({ label, icon, variant = "secondary", size = "md", className, type = "button", ...props }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cx(buttonClasses({ variant, size }), squareSize[size], className)}
      {...props}
    >
      <span aria-hidden="true" className="inline-flex">
        {icon}
      </span>
    </button>
  );
}
