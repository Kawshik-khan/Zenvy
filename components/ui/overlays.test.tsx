// @vitest-environment jsdom
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Sheet,
  SheetContent,
  SheetTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  ToastProvider,
  useToast,
} from "./index";

describe("Dialog", () => {
  function Example() {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button>Leave call</Button>
        </DialogTrigger>
        <DialogContent title="Leave this call?" description="Your partner stays connected.">
          <Button>Stay</Button>
        </DialogContent>
      </Dialog>
    );
  }

  it("opens as a labelled modal, closes on Escape and returns focus", async () => {
    const user = userEvent.setup();
    render(<Example />);
    const trigger = screen.getByRole("button", { name: "Leave call" });
    await user.click(trigger);

    const dialog = await screen.findByRole("dialog", { name: "Leave this call?" });
    expect(dialog).toHaveAccessibleDescription("Your partner stays connected.");
    expect(dialog).toHaveClass("data-[state=open]:animate-nb-pop-in");
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(trigger).toHaveFocus();
  });

  it("closes from the close button", async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByRole("button", { name: "Leave call" }));
    await user.click(await screen.findByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
});

describe("Sheet", () => {
  it("slides in from the chosen side", async () => {
    const user = userEvent.setup();
    render(
      <Sheet>
        <SheetTrigger asChild>
          <Button>Filters</Button>
        </SheetTrigger>
        <SheetContent title="Filter jobs" side="bottom">
          <p>Body</p>
        </SheetContent>
      </Sheet>,
    );
    await user.click(screen.getByRole("button", { name: "Filters" }));
    const sheet = await screen.findByRole("dialog", { name: "Filter jobs" });
    expect(sheet).toHaveClass("data-[state=open]:animate-nb-slide-in-bottom");
  });
});

describe("Popover", () => {
  it("toggles from its trigger", async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger asChild>
          <Button>Nadia</Button>
        </PopoverTrigger>
        <PopoverContent aria-label="Nadia profile preview">CS · Semester 5</PopoverContent>
      </Popover>,
    );
    const trigger = screen.getByRole("button", { name: "Nadia" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await user.click(trigger);
    expect(await screen.findByText("CS · Semester 5")).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });
});

describe("Tabs", () => {
  it("switches panels with arrow keys", async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="people">
        <TabsList aria-label="Inbox">
          <TabsTrigger value="people">People</TabsTrigger>
          <TabsTrigger value="groups">Groups</TabsTrigger>
        </TabsList>
        <TabsContent value="people">People panel</TabsContent>
        <TabsContent value="groups">Groups panel</TabsContent>
      </Tabs>,
    );
    expect(screen.getByRole("tab", { name: "People" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("People panel");

    await user.click(screen.getByRole("tab", { name: "People" }));
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Groups" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Groups panel");
  });
});

describe("Toast", () => {
  function Trigger() {
    const toast = useToast();
    return <Button onClick={() => toast({ title: "Request sent", description: "Nadia will be notified.", tone: "success" })}>Connect</Button>;
  }

  it("shows a toast from the hook and dismisses it", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );
    await user.click(screen.getByRole("button", { name: "Connect" }));
    expect(await screen.findByText("Request sent")).toBeInTheDocument();
    expect(screen.getByText("Nadia will be notified.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Dismiss notification" }));
    await act(() => new Promise((resolve) => setTimeout(resolve, 450)));
    expect(screen.queryByText("Request sent")).toBeNull();
  });

  it("throws a helpful error outside the provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Trigger />)).toThrow("useToast must be used inside <ToastProvider>");
    spy.mockRestore();
  });
});
