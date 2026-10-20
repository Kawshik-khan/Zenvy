import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});

// Browser APIs that jsdom lacks but Radix primitives and ImageDropzone use.
if (typeof window !== "undefined") {
  if (typeof window.ResizeObserver === "undefined") {
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.scrollIntoView ??= () => {};

  let objectUrlCount = 0;
  URL.createObjectURL ??= () => `blob:mock/${++objectUrlCount}`;
  URL.revokeObjectURL ??= () => {};
}

// jsdom has no matchMedia. Report a touch device with no motion preference, so pointer-driven
// effects (custom cursor, tilt, parallax) stay off in tests, as they do on phones.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: query.includes("pointer: coarse"),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
