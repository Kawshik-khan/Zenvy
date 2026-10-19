// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  Alert,
  Avatar,
  AvatarStack,
  Badge,
  Button,
  ButtonLink,
  Card,
  CardHeader,
  Checkbox,
  Chip,
  IconButton,
  initialsOf,
  Input,
  ProgressBar,
  Select,
  toneFor,
} from "./index";

describe("Button", () => {
  it("defaults to type=button and the primary style", () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveClass("bg-ink", "text-paper", "border-nb", "nb-press", "nb-focus");
  });

  it("applies variant and size", () => {
    render(
      <Button variant="match" size="lg">
        Connect
      </Button>,
    );
    expect(screen.getByRole("button")).toHaveClass("bg-match", "text-ink", "min-h-14");
  });

  it("ghost has no press effect or shadow", () => {
    render(<Button variant="ghost">Skip</Button>);
    const button = screen.getByRole("button");
    expect(button).not.toHaveClass("nb-press");
    expect(button).not.toHaveClass("shadow-nb");
  });

  it("is disabled and busy while loading", async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Saving
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Saving" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("calls onClick", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });
});

describe("ButtonLink", () => {
  it("renders a link with button styling", () => {
    render(
      <ButtonLink href="/matching" variant="career">
        Find partners
      </ButtonLink>,
    );
    const link = screen.getByRole("link", { name: "Find partners" });
    expect(link).toHaveAttribute("href", "/matching");
    expect(link).toHaveClass("bg-career");
  });
});

describe("IconButton", () => {
  it("uses the label as its accessible name and hides the icon", () => {
    const { container } = render(<IconButton label="Start video call" icon={<svg data-testid="icon" />} />);
    expect(screen.getByRole("button", { name: "Start video call" })).toBeInTheDocument();
    expect(container.querySelector('[aria-hidden="true"] [data-testid="icon"]')).not.toBeNull();
  });
});

describe("Card", () => {
  it("uses ink text on accent tones and fg on card", () => {
    const { rerender, container } = render(<Card tone="match">Hi</Card>);
    expect(container.firstElementChild).toHaveClass("bg-match", "text-ink");
    expect(container.firstElementChild).not.toHaveClass("text-fg");
    rerender(<Card>Hi</Card>);
    expect(container.firstElementChild).toHaveClass("bg-card", "text-fg");
  });

  it("can render as another element", () => {
    render(<Card as="article" aria-label="Job">Body</Card>);
    expect(screen.getByRole("article", { name: "Job" })).toBeInTheDocument();
  });

  it("CardHeader renders a heading at the requested level", () => {
    render(<CardHeader title="Upcoming" level={3} tone="focus" />);
    expect(screen.getByRole("heading", { level: 3, name: "Upcoming" })).toBeInTheDocument();
  });
});

describe("form controls", () => {
  it("links label and hint to the input", () => {
    render(<Input id="email" label="Student email" hint="We send a link." />);
    const input = screen.getByLabelText("Student email");
    expect(input).toHaveAccessibleDescription("We send a link.");
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("marks invalid inputs and replaces the hint with the error", () => {
    render(<Input id="name" label="Name" hint="Your full name" error="Too short" />);
    const input = screen.getByLabelText("Name");
    expect(input).toHaveAttribute("aria-invalid", "true");
    // The "!" marker is decorative (aria-hidden); aria-invalid conveys the error state.
    expect(input).toHaveAccessibleDescription("Too short");
    expect(screen.queryByText("Your full name")).toBeNull();
  });

  it("Select is labelled", () => {
    render(
      <Select id="mode" label="Work mode">
        <option>Remote</option>
      </Select>,
    );
    expect(screen.getByRole("combobox", { name: "Work mode" })).toBeInTheDocument();
  });

  it("Checkbox toggles via its label", async () => {
    render(<Checkbox id="ok" label="I agree" />);
    const box = screen.getByRole("checkbox", { name: "I agree" });
    await userEvent.click(screen.getByText("I agree"));
    expect(box).toBeChecked();
  });
});

describe("Badge and Chip", () => {
  it("Badge picks a readable text colour", () => {
    render(<Badge tone="ink">New</Badge>);
    expect(screen.getByText("New")).toHaveClass("bg-ink", "text-paper");
  });

  it("Chip exposes pressed state", () => {
    render(
      <>
        <Chip selected>For you</Chip>
        <Chip>Remote</Chip>
      </>,
    );
    expect(screen.getByRole("button", { name: "For you" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Remote" })).toHaveAttribute("aria-pressed", "false");
  });
});

describe("Avatar", () => {
  it.each([
    ["Nadia Rahman", "NR"],
    ["  maya  ", "M"],
    ["Ana Maria de la Cruz", "AC"],
    ["", "?"],
    [null, "?"],
  ])("initialsOf(%j) = %s", (name, expected) => {
    expect(initialsOf(name)).toBe(expected);
  });

  it("keeps a stable colour per name", () => {
    expect(toneFor("Nadia")).toBe(toneFor("Nadia"));
  });

  it("names the initials fallback and the presence dot", () => {
    render(<Avatar name="Nadia Rahman" presence="online" />);
    expect(screen.getByRole("img", { name: "Nadia Rahman" })).toHaveTextContent("NR");
    expect(screen.getByRole("img", { name: "Online" })).toBeInTheDocument();
  });

  it("uses the photo when given", () => {
    render(<Avatar name="Arif" src="/a.png" />);
    expect(screen.getByRole("img", { name: "Arif" })).toHaveAttribute("src", "/a.png");
  });

  it("AvatarStack shows an overflow count", () => {
    render(<AvatarStack people={[{ name: "A" }, { name: "B" }, { name: "C" }, { name: "D" }, { name: "E" }]} max={3} />);
    expect(screen.getByText("+2")).toBeInTheDocument();
    expect(screen.getAllByRole("img")).toHaveLength(3);
  });
});

describe("ProgressBar", () => {
  it("exposes its value", () => {
    render(<ProgressBar label="Weekly goal" value={75} />);
    const bar = screen.getByRole("progressbar", { name: "Weekly goal" });
    expect(bar).toHaveAttribute("aria-valuenow", "75");
    expect(bar.firstElementChild).toHaveStyle({ width: "75%" });
  });

  it("clamps out-of-range values", () => {
    render(<ProgressBar label="Over" value={150} max={100} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  });

  it("handles a zero max without dividing by zero", () => {
    render(<ProgressBar label="Empty" value={3} max={0} />);
    expect(screen.getByRole("progressbar").firstElementChild).toHaveStyle({ width: "3%" });
  });
});

describe("Alert", () => {
  it("announces errors and warnings immediately, and info/success politely", () => {
    const { rerender } = render(<Alert tone="error">Wrong password</Alert>);
    expect(screen.getByRole("alert")).toHaveTextContent("Wrong password");
    rerender(<Alert tone="warning">Link expired</Alert>);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    rerender(<Alert tone="success" title="Saved">Profile updated</Alert>);
    expect(screen.getByRole("status")).toHaveTextContent("Saved");
    expect(screen.getByRole("status")).toHaveTextContent("Profile updated");
    rerender(<Alert tone="info">FYI</Alert>);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("hides its decorative icon from assistive tech", () => {
    const { container } = render(<Alert tone="error">Oops</Alert>);
    expect(container.querySelector('[aria-hidden="true"] svg')).not.toBeNull();
  });
});
