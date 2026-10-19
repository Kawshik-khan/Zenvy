// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Heatmap, StreakBars, type HeatDay } from "./Heatmap";

const day = (n: number, level: number): HeatDay => ({ date: `2026-10-${String(n).padStart(2, "0")}`, activityCount: level, studyHours: level, level });

describe("Heatmap", () => {
  it("is one labelled image rather than 28 unlabelled boxes", () => {
    render(<Heatmap days={[day(1, 0), day(2, 3)]} summary="Study activity: 1 active day." />);
    expect(screen.getByRole("img", { name: "Study activity: 1 active day." })).toBeInTheDocument();
  });

  it("maps levels to the heat scale and clamps out-of-range values", () => {
    const { container } = render(<Heatmap days={[day(1, 0), day(2, 2), day(3, 9), day(4, -3)]} summary="x" />);
    const cells = Array.from(container.querySelectorAll('[role="img"] > div'));
    expect(cells.map((cell) => Array.from(cell.classList).find((c) => c.startsWith("bg-heat-")))).toEqual(["bg-heat-0", "bg-heat-2", "bg-heat-4", "bg-heat-0"]);
  });

  it("shows the legend to sighted users only", () => {
    const { container } = render(<Heatmap days={[day(1, 1)]} summary="x" />);
    expect(container.querySelector('[aria-hidden="true"]')?.textContent).toContain("Less");
  });
});

describe("StreakBars", () => {
  it("renders one decorative bar per day", () => {
    const { container } = render(<StreakBars days={[day(1, 0), day(2, 4)]} />);
    expect(container.querySelector('[aria-hidden="true"]')?.children).toHaveLength(2);
  });
});
