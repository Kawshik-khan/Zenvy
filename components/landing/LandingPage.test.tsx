// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
});
