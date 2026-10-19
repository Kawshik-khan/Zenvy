// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ErrorView from "./ErrorView";

afterEach(() => vi.unstubAllEnvs());

describe("ErrorView", () => {
  const error = new Error("connect ECONNREFUSED db.internal.example:5432");

  it("shows the trace and the developer message while developing", () => {
    vi.stubEnv("NODE_ENV", "development");
    render(<ErrorView error={error} message="Set AUTH_SECRET in your hosting settings." />);
    expect(screen.getByText(/ECONNREFUSED/)).toBeInTheDocument();
    expect(screen.getByText("Set AUTH_SECRET in your hosting settings.")).toBeInTheDocument();
  });

  it("never leaks the trace or setup hints in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const { container } = render(<ErrorView error={error} message="Set AUTH_SECRET in your hosting settings." />);
    expect(container.textContent).not.toContain("ECONNREFUSED");
    expect(container.textContent).not.toContain("AUTH_SECRET");
    expect(screen.getByText(/Something went wrong on our side/)).toBeInTheDocument();
  });

  it("links back to the gateway", () => {
    render(<ErrorView error={error} resetPath="/dashboard" />);
    expect(screen.getByRole("link", { name: "Back to log in" })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });
});
