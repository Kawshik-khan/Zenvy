// @vitest-environment jsdom
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LandingPage from "./LandingPage";

describe("LandingPage", () => {
  it("has one h1 and a heading for every section", () => {
    render(<LandingPage />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Find your study partner.");
    expect(screen.getAllByRole("heading", { level: 2 }).length).toBeGreaterThanOrEqual(6);
  });

  it("every in-page link points at a section that exists, and no link is a dead '#'", () => {
    const { container } = render(<LandingPage />);
    const hrefs = Array.from(container.querySelectorAll("a[href]")).map((a) => a.getAttribute("href")!);
    expect(hrefs).not.toContain("#");
    for (const href of hrefs.filter((value) => value.startsWith("#"))) {
      expect(container.querySelector(href), `${href} has no matching section`).not.toBeNull();
    }
    for (const href of hrefs.filter((value) => !value.startsWith("#"))) {
      expect(["/", "/login", "/register"], `unexpected link ${href}`).toContain(href);
    }
  });

  it("offers sign-up and log-in", () => {
    render(<LandingPage />);
    expect(screen.getAllByRole("link", { name: "Get started" })[0]).toHaveAttribute("href", "/register");
    expect(screen.getAllByRole("link", { name: "Log in" })[0]).toHaveAttribute("href", "/login");
    for (const link of screen.getAllByRole("link", { name: "Find my match" })) expect(link).toHaveAttribute("href", "/register");
  });

  it("hides the decorative hero illustration from assistive tech", () => {
    render(<LandingPage />);
    const chat = screen.getByText("Library at 7? I'll bring the past papers.");
    expect(chat.closest("[aria-hidden='true']")).not.toBeNull();
  });

  it("keeps the footer navigation labelled", () => {
    render(<LandingPage />);
    expect(screen.getByRole("navigation", { name: "Footer" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Page sections" })).toBeInTheDocument();
  });

  it("only shows the jobs section when the jobs flag is on", () => {
    const { unmount } = render(<LandingPage />);
    expect(screen.queryByRole("heading", { name: "Jobs that fit around your classes" })).toBeNull();
    unmount();
    render(<LandingPage jobsEnabled />);
    expect(screen.getByRole("heading", { name: "Jobs that fit around your classes" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Jobs" })[0]).toHaveAttribute("href", "#jobs");
  });

  it("filters the example jobs and saves one", () => {
    render(<LandingPage jobsEnabled />);
    const jobs = screen.getByRole("heading", { name: "Jobs that fit around your classes" }).closest("section")!;
    fireEvent.click(within(jobs).getByRole("button", { name: "Research" }));
    expect(within(jobs).getAllByRole("article")).toHaveLength(1);
    const save = within(jobs).getByRole("button", { name: "Unsave Research assistant, ML lab" });
    fireEvent.click(save);
    expect(within(jobs).getByRole("button", { name: "Save Research assistant, ML lab" })).toHaveAttribute("aria-pressed", "false");
  });

  it("lets visitors join example channels", () => {
    render(<LandingPage />);
    const chip = screen.getByRole("button", { name: "cse-220" });
    fireEvent.click(chip);
    expect(chip).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/1 joined/)).toBeInTheDocument();
  });

  it("runs the focus timer demo", () => {
    vi.useFakeTimers();
    try {
      render(<LandingPage />);
      const timer = screen.getByRole("timer");
      expect(timer).toHaveTextContent("25:00");
      fireEvent.click(screen.getByRole("button", { name: "Start" }));
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(timer).toHaveTextContent("24:57");
      fireEvent.click(screen.getByRole("button", { name: "Break 5" }));
      expect(timer).toHaveTextContent("05:00");
    } finally {
      vi.useRealTimers();
    }
  });
});
