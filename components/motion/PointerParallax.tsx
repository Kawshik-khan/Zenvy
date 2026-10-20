"use client";

import { useRef, type ComponentProps, type PointerEvent } from "react";
import { useMotionOk } from "./useMotionOk";

/**
 * Publishes the pointer position inside it as --px and --py (-0.5 to 0.5). Children move with
 * `translate-x-[calc(var(--px)*20px)]` style utilities or the `Depth` helper below.
 */
export function PointerParallax({ style, children, ...props }: ComponentProps<"div">) {
  const ref = useRef<HTMLDivElement>(null);
  const enabled = useMotionOk();

  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!enabled || !el || event.pointerType !== "mouse") return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--px", ((event.clientX - rect.left) / rect.width - 0.5).toFixed(3));
    el.style.setProperty("--py", ((event.clientY - rect.top) / rect.height - 0.5).toFixed(3));
  };
  const onLeave = () => {
    ref.current?.style.setProperty("--px", "0");
    ref.current?.style.setProperty("--py", "0");
  };

  return (
    <div ref={ref} onPointerMove={onMove} onPointerLeave={onLeave} style={{ ["--px" as string]: 0, ["--py" as string]: 0, ...style }} {...props}>
      {children}
    </div>
  );
}

/** Moves with the pointer by `depth` pixels (negative moves the other way). */
export function Depth({ depth, className, style, children, ...props }: ComponentProps<"div"> & { depth: number }) {
  return (
    <div
      className={className}
      style={{
        ...style,
        translate: `calc(var(--px, 0) * ${depth}px) calc(var(--py, 0) * ${depth}px)`,
        transition: "translate 400ms var(--ease-nb-out)",
      }}
      {...props}
    >
      {children}
    </div>
  );
}
