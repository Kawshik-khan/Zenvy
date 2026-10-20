// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FeaturePanel } from "./FeaturePanel";
import { PasswordField } from "./PasswordField";

describe("PasswordField", () => {
  it("shows and hides the password", () => {
    render(<PasswordField id="pw" name="password" label="Password" autoComplete="new-password" />);
    const input = screen.getByLabelText("Password");
    expect(input).toHaveAttribute("type", "password");
    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(input).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Hide password" })).toHaveAttribute("aria-pressed", "true");
  });

  it("rates strength as you type", () => {
    render(<PasswordField id="pw" name="password" label="Password" autoComplete="new-password" feedback="meter" />);
    const input = screen.getByLabelText("Password");
    fireEvent.change(input, { target: { value: "abc" } });
    expect(screen.getByText("Too short")).toBeInTheDocument();
    fireEvent.change(input, { target: { value: "Studytime1!" } });
    expect(screen.getByText("Strong")).toBeInTheDocument();
  });

  it("ticks off the rules in checklist mode", () => {
    render(<PasswordField id="pw" name="password" label="New password" autoComplete="new-password" feedback="checklist" />);
    fireEvent.change(screen.getByLabelText("New password"), { target: { value: "Studytime" } });
    const list = screen.getByRole("list", { name: "Password requirements" });
    expect(list).toHaveTextContent("8 or more characters, done");
    expect(list).toHaveTextContent("A number, not yet");
  });

  it("links its error to the input", () => {
    render(<PasswordField id="pw" name="password" label="Password" autoComplete="new-password" error="Use at least 8 characters." />);
    const input = screen.getByLabelText("Password");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input.getAttribute("aria-describedby")).toContain("pw-error");
  });
});

describe("FeaturePanel", () => {
  it("switches slides from the tabs and arrows", () => {
    render(<FeaturePanel />);
    expect(screen.getByRole("heading", { name: "Matches that make sense" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Focus" }));
    expect(screen.getByRole("heading", { name: "Focus mode that keeps you going" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Focus" })).toHaveAttribute("aria-selected", "true");
    fireEvent.click(screen.getByRole("button", { name: "Next feature" }));
    expect(screen.getByRole("heading", { name: "Matches that make sense" })).toBeInTheDocument();
  });

  it("only mentions jobs when the jobs board is on", () => {
    const { unmount } = render(<FeaturePanel />);
    expect(screen.queryByRole("tab", { name: "Jobs" })).toBeNull();
    unmount();
    render(<FeaturePanel jobsEnabled />);
    expect(screen.getByRole("tab", { name: "Jobs" })).toBeInTheDocument();
  });
});
