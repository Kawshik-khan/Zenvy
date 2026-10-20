"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";
import { useMotionOk } from "./useMotionOk";

/** Pulls its child a few pixels toward the pointer, then springs back. Mouse only. */
export function Magnetic({ children, strength = 12 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const enabled = useMotionOk();

  const onMove = (event: PointerEvent<HTMLSpanElement>) => {
    const el = ref.current;
    if (!enabled || !el || event.pointerType !== "mouse") return;
    const rect = el.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * strength;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * strength * 0.8;
    el.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
  };
  const onLeave = () => {
    if (ref.current) ref.current.style.translate = "";
  };

  return (
    <span
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="inline-flex transition-[translate] duration-300 ease-[var(--ease-nb-spring)]"
    >
      {children}
    </span>
  );
}
