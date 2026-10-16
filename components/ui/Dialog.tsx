"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cx } from "./cx";
import { IconButton } from "./IconButton";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

const widths = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

type DialogContentProps = Omit<ComponentProps<typeof DialogPrimitive.Content>, "title"> & {
  /** Required: Radix uses it as the dialog's accessible name. */
  title: ReactNode;
  description?: ReactNode;
  size?: keyof typeof widths;
  hideClose?: boolean;
};

/**
 * Centred modal. The overlay doubles as the scroll container so long dialogs scroll on phones.
 * Focus is trapped, Escape and the backdrop close it, and focus returns to the trigger.
 */
export function DialogContent({ title, description, size = "md", hideClose = false, className, children, ...props }: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className={cx(
          "fixed inset-0 z-[200] grid place-items-center overflow-y-auto bg-ink/50 p-4",
          "data-[state=open]:animate-nb-fade-in data-[state=closed]:animate-nb-fade-out",
        )}
      >
        <DialogPrimitive.Content
          {...(description ? {} : { "aria-describedby": undefined })}
          className={cx(
            "relative w-full rounded-nb-lg border-nb bg-card p-6 font-grotesk text-fg shadow-nb-lg outline-none md:p-7",
            "data-[state=open]:animate-nb-pop-in data-[state=closed]:animate-nb-pop-out",
            widths[size],
            className,
          )}
          {...props}
        >
          <div className={cx("flex flex-col gap-1.5", !hideClose && "pr-12")}>
            <DialogPrimitive.Title className="m-0 text-2xl font-bold tracking-tight">{title}</DialogPrimitive.Title>
            {description && <DialogPrimitive.Description className="m-0 text-[15px] text-fg-muted">{description}</DialogPrimitive.Description>}
          </div>
          {children && <div className="mt-5">{children}</div>}
          {!hideClose && (
            <DialogPrimitive.Close asChild>
              <IconButton label="Close" size="sm" icon={<X size={18} />} className="absolute top-4 right-4" />
            </DialogPrimitive.Close>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Overlay>
    </DialogPrimitive.Portal>
  );
}

export function DialogFooter({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("mt-6 flex flex-wrap justify-end gap-3", className)}>{children}</div>;
}
