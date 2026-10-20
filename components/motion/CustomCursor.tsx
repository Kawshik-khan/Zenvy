"use client";

import { useEffect, useRef, useState } from "react";
import { useMotionOk } from "./useMotionOk";

const INTERACTIVE = "a, button, [role='button'], [role='tab'], label, select, summary, input[type='checkbox']";

/**
 * A ring that trails the pointer with a little lag, grows over things you can click and shows
 * a short label for elements with `data-cursor-label`. The system cursor (a custom icon, see
 * `.nb-cursor` in globals.css) stays visible, so nothing depends on the ring. Mouse only.
 */
export function CustomCursor() {
  const enabled = useMotionOk();
  const ringRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<{ hover: boolean; label: string; down: boolean; visible: boolean }>({
    hover: false,
    label: "",
    down: false,
    visible: false,
  });

  useEffect(() => {
    if (!enabled) return;
    const target = { x: -100, y: -100 };
    const pos = { x: -100, y: -100 };
    let frame = 0;

    const tick = () => {
      pos.x += (target.x - pos.x) * 0.22;
      pos.y += (target.y - pos.y) * 0.22;
      if (ringRef.current) ringRef.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      target.x = event.clientX;
      target.y = event.clientY;
      const element = event.target instanceof Element ? event.target : null;
      const labelled = element?.closest<HTMLElement>("[data-cursor-label]");
      const hover = Boolean(element?.closest(INTERACTIVE)) || Boolean(labelled);
      const label = labelled?.dataset.cursorLabel ?? "";
      setState((prev) => (prev.hover === hover && prev.label === label && prev.visible ? prev : { ...prev, hover, label, visible: true }));
    };
    const onDown = () => setState((prev) => ({ ...prev, down: true }));
    const onUp = () => setState((prev) => ({ ...prev, down: false }));
    const onLeave = () => setState((prev) => ({ ...prev, visible: false }));

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [enabled]);

  if (!enabled) return null;

  const size = state.label ? 76 : state.hover ? 54 : 34;
  return (
    <div
      ref={ringRef}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-[100]"
      style={{ opacity: state.visible ? 1 : 0, transition: "opacity 150ms ease" }}
    >
      <div
        className="flex items-center justify-center rounded-full border-2 border-ink font-grotesk text-xs font-bold text-ink"
        style={{
          width: size,
          height: size,
          marginLeft: -size / 2,
          marginTop: -size / 2,
          transform: `scale(${state.down ? 0.82 : 1})`,
          background: state.label ? "var(--color-focus)" : state.hover ? "color-mix(in srgb, var(--color-focus) 45%, transparent)" : "transparent",
          transition: "width 220ms var(--ease-nb-spring), height 220ms var(--ease-nb-spring), margin 220ms var(--ease-nb-spring), transform 120ms ease, background 160ms ease",
        }}
      >
        {state.label}
      </div>
    </div>
  );
}
