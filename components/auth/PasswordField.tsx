"use client";

import { Check, Eye, EyeOff } from "lucide-react";
import { useState, type ReactNode } from "react";
import { controlClasses, cx } from "@/components/ui";
import { PASSWORD_RULES, passwordStrength } from "@/lib/password";

const SEGMENT_COLOUR = ["", "bg-alert", "bg-focus", "bg-live", "bg-live"] as const;

type PasswordFieldProps = {
  id: string;
  name: string;
  label: ReactNode;
  autoComplete: "current-password" | "new-password";
  error?: string;
  /** Strength bar (sign-up) or rule checklist (reset). */
  feedback?: "none" | "meter" | "checklist";
  /** Controlled value, when the parent needs it (e.g. to compare with a confirm field). */
  value?: string;
  onValueChange?: (value: string) => void;
  /** Lets one show/hide button control several fields. */
  visible?: boolean;
  onVisibleChange?: (visible: boolean) => void;
  labelAside?: ReactNode;
};

export function PasswordField({
  id,
  name,
  label,
  autoComplete,
  error,
  feedback = "none",
  value: controlledValue,
  onValueChange,
  visible: controlledVisible,
  onVisibleChange,
  labelAside,
}: PasswordFieldProps) {
  const [ownValue, setOwnValue] = useState("");
  const [ownVisible, setOwnVisible] = useState(false);
  const value = controlledValue ?? ownValue;
  const visible = controlledVisible ?? ownVisible;
  const strength = passwordStrength(value);
  const describedBy = [feedback !== "none" ? `${id}-feedback` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;

  const setVisible = (next: boolean) => (onVisibleChange ? onVisibleChange(next) : setOwnVisible(next));

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="font-grotesk text-[15px] font-bold text-fg">
          {label}
        </label>
        {labelAside}
      </div>
      <div className="relative flex">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => (onValueChange ? onValueChange(event.target.value) : setOwnValue(event.target.value))}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cx(controlClasses, "min-h-12 pr-14")}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="nb-focus absolute top-1/2 right-1.5 inline-flex size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-nb text-fg"
        >
          {visible ? <Eye size={20} aria-hidden="true" /> : <EyeOff size={20} aria-hidden="true" />}
        </button>
      </div>

      {feedback === "meter" && (
        <div id={`${id}-feedback`} className="flex items-center gap-3" aria-live="polite">
          <div aria-hidden="true" className="grid flex-1 grid-cols-4 gap-1.5">
            {[0, 1, 2, 3].map((segment) => (
              <span
                key={segment}
                className={cx(
                  "h-2.5 rounded-full border-2 border-line transition-colors duration-200",
                  segment < strength.score ? SEGMENT_COLOUR[strength.score] : "bg-canvas",
                )}
              />
            ))}
          </div>
          <span className="min-w-20 text-right text-sm font-bold">{strength.label ? `${strength.label}` : <span className="sr-only">No password yet</span>}</span>
        </div>
      )}

      {feedback === "checklist" && (
        <ul id={`${id}-feedback`} aria-label="Password requirements" className="m-0 grid list-none grid-cols-2 gap-2 p-0">
          {PASSWORD_RULES.map((rule) => {
            const ok = strength.passed[rule.id];
            return (
              <li key={rule.id} className="flex items-center gap-2 text-sm font-bold">
                <span
                  aria-hidden="true"
                  className={cx(
                    "inline-flex size-5.5 shrink-0 items-center justify-center rounded-md border-2 border-line transition-colors duration-200",
                    ok ? "bg-live" : "bg-card",
                  )}
                >
                  {ok && <Check size={14} strokeWidth={3.5} className="animate-nb-stamp" />}
                </span>
                {rule.label}
                <span className="sr-only">{ok ? ", done" : ", not yet"}</span>
              </li>
            );
          })}
        </ul>
      )}

      {error && (
        <p id={`${id}-error`} className="m-0 animate-nb-rise text-sm font-bold text-fg">
          <span aria-hidden="true" className="mr-1 inline-block rounded-sm bg-alert px-1 text-ink">
            !
          </span>
          {error}
        </p>
      )}
    </div>
  );
}
