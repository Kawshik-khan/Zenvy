"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cx } from "./cx";
import { IconButton } from "./IconButton";

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

type Side = "right" | "left" | "bottom";

const sideClasses: Record<Side, string> = {
  right: cx(
    "inset-y-0 right-0 h-full w-[min(420px,calc(100vw-24px))] border-0 border-l-[length:var(--nb-border-width)]",
    "data-[state=open]:animate-nb-slide-in-right data-[state=closed]:animate-nb-slide-out-right",
  ),
  left: cx(
    "inset-y-0 left-0 h-full w-[min(320px,calc(100vw-24px))] border-0 border-r-[length:var(--nb-border-width)]",
    "data-[state=open]:animate-nb-slide-in-left data-[state=closed]:animate-nb-slide-out-left",
  ),
  bottom: cx(
    "inset-x-0 bottom-0 max-h-[85vh] rounded-t-nb-lg border-0 border-t-[length:var(--nb-border-width)]",
    "pb-[max(env(safe-area-inset-bottom),1.5rem)]",
    "data-[state=open]:animate-nb-slide-in-bottom data-[state=closed]:animate-nb-slide-out-bottom",
  ),
};

type SheetContentProps = Omit<ComponentProps<typeof DialogPrimitive.Content>, "title"> & {
  title: ReactNode;
  description?: ReactNode;
  side?: Side;
};

/** Panel that slides in from an edge: mobile filters, navigation, details. Same a11y as Dialog. */
export function SheetContent({ title, description, side = "right", className, children, ...props }: SheetContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-[200] bg-ink/40 data-[state=open]:animate-nb-fade-in data-[state=closed]:animate-nb-fade-out" />
      <DialogPrimitive.Content
        {...(description ? {} : { "aria-describedby": undefined })}
        className={cx(
          "fixed z-[201] flex flex-col overflow-y-auto border-line bg-card p-6 font-grotesk text-fg outline-none",
          sideClasses[side],
          className,
        )}
        {...props}
      >
        {side === "bottom" && <span aria-hidden="true" className="mx-auto -mt-2 mb-4 h-1.5 w-12 shrink-0 rounded-full bg-line" />}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <DialogPrimitive.Title className="m-0 text-2xl font-bold tracking-tight">{title}</DialogPrimitive.Title>
            {description && <DialogPrimitive.Description className="m-0 text-[15px] text-fg-muted">{description}</DialogPrimitive.Description>}
          </div>
          <DialogPrimitive.Close asChild>
            <IconButton label="Close" size="sm" icon={<X size={18} />} />
          </DialogPrimitive.Close>
        </div>
        <div className="mt-5 flex-1">{children}</div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
