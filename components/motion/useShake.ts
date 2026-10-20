"use client";

import { useEffect, useRef } from "react";

/** Shakes the element once each time `trigger` changes to a new truthy value (e.g. a form error). */
export function useShake<T extends HTMLElement>(trigger: unknown) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!trigger || !ref.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    ref.current.animate?.(
      [{ transform: "translateX(0)" }, { transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "translateX(0)" }],
      { duration: 320, easing: "ease-in-out" },
    );
  }, [trigger]);
  return ref;
}
