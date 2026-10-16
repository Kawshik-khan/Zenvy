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
