"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import type { ComponentProps } from "react";
import { cx } from "./cx";

export const Tabs = TabsPrimitive.Root;

const activeTone = {
  focus: "data-[state=active]:bg-focus",
  match: "data-[state=active]:bg-match",
  chat: "data-[state=active]:bg-chat",
  live: "data-[state=active]:bg-live",
  career: "data-[state=active]:bg-career",
  ink: "data-[state=active]:bg-ink data-[state=active]:text-paper",
} as const;

export function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cx("inline-flex max-w-full gap-1.5 overflow-x-auto rounded-full border-nb bg-canvas p-1", className)}
      {...props}
    />
  );
}

type TabsTriggerProps = ComponentProps<typeof TabsPrimitive.Trigger> & {
  tone?: keyof typeof activeTone;
};

export function TabsTrigger({ tone = "focus", className, ...props }: TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      className={cx(
        "nb-focus inline-flex min-h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border-2 border-transparent px-4",
        "font-grotesk text-[15px] font-bold whitespace-nowrap text-fg transition-colors duration-100",
        "hover:bg-card data-[state=active]:border-line data-[state=active]:text-ink data-[state=active]:shadow-nb-sm data-[state=active]:animate-nb-stamp",
        "disabled:cursor-not-allowed disabled:opacity-50",
        activeTone[tone],
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cx("nb-focus mt-5 data-[state=active]:animate-nb-rise", className)} {...props} />;
}
