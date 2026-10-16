"use client";

import * as ToastPrimitive from "@radix-ui/react-toast";
import { AlertTriangle, Check, Info, X } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { cx } from "./cx";

export type ToastTone = "info" | "success" | "error";

export type ToastOptions = {
  title: string;
  description?: string;
  tone?: ToastTone;
  /** Milliseconds before auto-dismiss. Errors stay twice as long by default. */
  duration?: number;
  action?: { label: string; onClick: () => void };
};

type ToastItem = ToastOptions & { id: number; open: boolean };

const ToastContext = createContext<((options: ToastOptions) => void) | null>(null);

const toneStyles: Record<ToastTone, { shadow: string; chip: string; icon: ReactNode }> = {
  info: { shadow: "shadow-nb", chip: "bg-chat", icon: <Info size={18} /> },
  success: { shadow: "shadow-[var(--nb-offset)_var(--nb-offset)_0_0_var(--color-live)]", chip: "bg-live", icon: <Check size={18} /> },
  error: { shadow: "shadow-[var(--nb-offset)_var(--nb-offset)_0_0_var(--color-alert)]", chip: "bg-alert", icon: <AlertTriangle size={18} /> },
};

const MAX_VISIBLE = 3;
const DEFAULT_DURATION = 5000;

/** Mount once near the root. Exposes `useToast()` to everything inside. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const toast = useCallback((options: ToastOptions) => {
    nextId.current += 1;
    const id = nextId.current;
    setItems((current) => [...current.slice(-(MAX_VISIBLE - 1)), { ...options, id, open: true }]);
  }, []);

  const close = useCallback((id: number) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, open: false } : item)));
    // Remove after the exit animation (Radix keeps it mounted until then).
    window.setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), 400);
  }, []);

  const value = useMemo(() => toast, [toast]);

  return (
    <ToastContext.Provider value={value}>
      <ToastPrimitive.Provider swipeDirection="right" duration={DEFAULT_DURATION} label="Notification">
        {children}
        {items.map((item) => {
          const tone = item.tone ?? "info";
          const styles = toneStyles[tone];
          return (
            <ToastPrimitive.Root
              key={item.id}
              open={item.open}
              onOpenChange={(open) => !open && close(item.id)}
              type={tone === "error" ? "foreground" : "background"}
              duration={item.duration ?? (tone === "error" ? DEFAULT_DURATION * 2 : DEFAULT_DURATION)}
              className={cx(
                "grid grid-cols-[auto_1fr_auto] items-start gap-3 rounded-nb border-nb bg-card p-4 font-grotesk text-fg",
                styles.shadow,
                "data-[state=open]:animate-nb-toast-in data-[state=closed]:animate-nb-toast-out",
                "data-[swipe=move]:translate-x-(--radix-toast-swipe-move-x)",
                "data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:transition-[translate] data-[swipe=end]:animate-nb-toast-out",
              )}
            >
              <span aria-hidden="true" className={cx("inline-flex size-8 items-center justify-center rounded-full border-2 border-line text-ink", styles.chip)}>
                {styles.icon}
              </span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <ToastPrimitive.Title className="text-base font-bold">{item.title}</ToastPrimitive.Title>
                {item.description && <ToastPrimitive.Description className="text-sm text-fg-muted">{item.description}</ToastPrimitive.Description>}
                {item.action && (
                  <ToastPrimitive.Action
                    altText={item.action.label}
                    onClick={item.action.onClick}
                    className="nb-focus mt-2 self-start rounded-md border-2 border-line bg-canvas px-3 py-1 text-sm font-bold"
                  >
                    {item.action.label}
                  </ToastPrimitive.Action>
                )}
              </div>
              <ToastPrimitive.Close aria-label="Dismiss notification" className="nb-focus inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-fg hover:bg-canvas">
                <X size={18} aria-hidden="true" />
              </ToastPrimitive.Close>
            </ToastPrimitive.Root>
          );
        })}
        <ToastPrimitive.Viewport className="fixed right-0 bottom-0 z-[300] m-0 flex w-full max-w-[420px] list-none flex-col gap-3 p-4 outline-none" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const toast = useContext(ToastContext);
  if (!toast) throw new Error("useToast must be used inside <ToastProvider>");
  return toast;
}
