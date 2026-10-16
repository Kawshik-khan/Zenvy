"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import type { ComponentProps } from "react";
import { cx } from "./cx";

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;
export const PopoverClose = PopoverPrimitive.Close;

type PopoverContentProps = ComponentProps<typeof PopoverPrimitive.Content>;

/** Small floating card anchored to its trigger: profile previews, quick actions, filter menus. */
export function PopoverContent({ className, sideOffset = 10, align = "start", collisionPadding = 12, ...props }: PopoverContentProps) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        sideOffset={sideOffset}
        align={align}
        collisionPadding={collisionPadding}
        className={cx(
          "z-[210] w-72 max-w-[calc(100vw-24px)] rounded-nb-lg border-nb bg-card p-4 font-grotesk text-fg shadow-nb-md outline-none",
          "origin-(--radix-popover-content-transform-origin)",
          "data-[state=open]:animate-nb-pop-in data-[state=closed]:animate-nb-pop-out",
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}
