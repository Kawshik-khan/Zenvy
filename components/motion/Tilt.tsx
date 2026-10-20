"use client";

import { useRef, type ComponentProps, type PointerEvent } from "react";
import { cx } from "@/components/ui";
import { useMotionOk } from "./useMotionOk";

type TiltProps = ComponentProps<"div"> & {
  /** Maximum tilt in degrees. */
  max?: number;
};

/**
 * Tilts toward the pointer and moves its hard shadow the opposite way, like a card lifted off
 * the table. Children with `shadow-[var(--tilt-shadow)]` pick the shadow up. Mouse only.
 */
export function Tilt({ max = 8, className, style, children, ...props }: TiltProps) {
  const ref = useRef<HTMLDivElement>(null);
  const enabled = useMotionOk();

  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!enabled || !el || event.pointerType !== "mouse") return;
    const rect = el.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(900px) rotateX(${(-y * max).toFixed(2)}deg) rotateY(${(x * max * 1.2).toFixed(2)}deg) translateY(-4px)`;
    el.style.setProperty("--tilt-shadow", `${(6 - x * 10).toFixed(1)}px ${(10 - y * 8).toFixed(1)}px 0 0 var(--nb-line)`);
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "";
    el.style.removeProperty("--tilt-shadow");
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={cx("transition-transform duration-300 ease-[var(--ease-nb-out)] [--tilt-shadow:6px_6px_0_0_var(--nb-line)]", className)}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
}
