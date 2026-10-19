import type { ComponentProps, ReactNode } from "react";
import { cx } from "./cx";

type FieldProps = {
  /** Required so the label and messages can be linked to the control. */
  id: string;
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  /** Keep the label for assistive tech but hide it visually (compact filter bars). */
  labelHidden?: boolean;
  className?: string;
};

export const controlClasses = cx(
  "nb-focus w-full rounded-nb border-nb bg-canvas px-3.5 font-grotesk text-base font-medium text-fg",
  "placeholder:text-fg-muted shadow-nb-sm",
  "disabled:cursor-not-allowed disabled:border-dashed disabled:opacity-70",
  "aria-invalid:shadow-[var(--nb-offset)_var(--nb-offset)_0_0_var(--color-alert)]",
);

function describedBy(id: string, hint?: ReactNode, error?: ReactNode) {
  const ids = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean);
  return ids.length ? ids.join(" ") : undefined;
}

function FieldFrame({ id, label, labelHidden, hint, error, className, children }: FieldProps & { children: ReactNode }) {
  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={id} className={cx("font-grotesk text-[15px] font-bold text-fg", labelHidden && "sr-only")}>
          {label}
        </label>
      )}
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="m-0 text-sm text-fg-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="m-0 text-sm font-bold text-fg">
          <span aria-hidden="true" className="mr-1 inline-block rounded-sm bg-alert px-1 text-ink">
            !
          </span>
          {error}
        </p>
      )}
    </div>
  );
}

type InputProps = Omit<ComponentProps<"input">, "id"> & FieldProps;

export function Input({ id, label, labelHidden, hint, error, className, ...props }: InputProps) {
  return (
    <FieldFrame id={id} label={label} labelHidden={labelHidden} hint={hint} error={error} className={className}>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={cx(controlClasses, "min-h-12")}
        {...props}
      />
    </FieldFrame>
  );
}

type TextareaProps = Omit<ComponentProps<"textarea">, "id"> & FieldProps;

export function Textarea({ id, label, labelHidden, hint, error, className, rows = 4, ...props }: TextareaProps) {
  return (
    <FieldFrame id={id} label={label} labelHidden={labelHidden} hint={hint} error={error} className={className}>
      <textarea
        id={id}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={cx(controlClasses, "resize-y py-3 leading-relaxed")}
        {...props}
      />
    </FieldFrame>
  );
}

type SelectProps = Omit<ComponentProps<"select">, "id"> & FieldProps;

export function Select({ id, label, labelHidden, hint, error, className, children, ...props }: SelectProps) {
  return (
    <FieldFrame id={id} label={label} labelHidden={labelHidden} hint={hint} error={error} className={className}>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={cx(controlClasses, "min-h-12 cursor-pointer")}
        {...props}
      >
        {children}
      </select>
    </FieldFrame>
  );
}

type CheckboxProps = Omit<ComponentProps<"input">, "type" | "id"> & {
  id: string;
  label: ReactNode;
};

export function Checkbox({ id, label, className, ...props }: CheckboxProps) {
  return (
    <label htmlFor={id} className={cx("flex cursor-pointer items-start gap-3 font-grotesk text-[15px] leading-normal text-fg", className)}>
      <input id={id} type="checkbox" className="nb-focus mt-0.5 size-[22px] shrink-0 cursor-pointer accent-ink" {...props} />
      <span>{label}</span>
    </label>
  );
}
