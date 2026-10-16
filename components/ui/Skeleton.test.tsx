// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SkeletonAvatar, SkeletonCard } from "./Skeleton";

describe("Skeleton", () => {
  it("hides placeholder blocks from assistive tech", () => {
    const { container } = render(<SkeletonAvatar className="size-10" />);
    const block = container.firstElementChild;
    expect(block).toHaveAttribute("aria-hidden", "true");
    expect(block).toHaveClass("rounded-full", "size-10", "animate-nb-shimmer");
  });

  it("renders a card with several placeholder blocks", () => {
    const { container } = render(<SkeletonCard />);
    expect(container.firstElementChild).toHaveClass("border-nb", "bg-card");
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThanOrEqual(4);
  });
});
