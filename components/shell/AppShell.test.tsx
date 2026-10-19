// @vitest-environment jsdom
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const navigation = vi.hoisted(() => ({ pathname: "/dashboard", search: "" }));
const openPomodoro = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useSearchParams: () => new URLSearchParams(navigation.search),
}));
vi.mock("@/app/components/PomodoroProvider", () => ({ usePomodoro: () => ({ openPomodoro, closePomodoro: vi.fn() }) }));
vi.mock("@/app/actions/auth", () => ({ logoutAction: vi.fn() }));

import { AppShell } from "./AppShell";

const user = { name: "Nadia Rahman", image: null, isAdmin: false };

function mockApis(unreadCount = 0) {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve(
            url.includes("unread") ? { unreadCount } : { metrics: { levelTitle: "Level 2 Scholar", currentStreakDays: 6 } },
          ),
      }),
    ),
  );
}

function renderShell(options: { pathname?: string; search?: string; jobs?: boolean; isAdmin?: boolean; unread?: number } = {}) {
  navigation.pathname = options.pathname ?? "/dashboard";
  navigation.search = options.search ?? "";
  mockApis(options.unread);
  return render(
    <AppShell user={{ ...user, isAdmin: options.isAdmin ?? false }} flags={{ jobs: options.jobs ?? false }}>
      <h1>Page content</h1>
    </AppShell>,
  );
}

const desktopNav = () => screen.getAllByRole("navigation", { name: "Main" })[0];
const bottomNav = () => screen.getAllByRole("navigation", { name: "Main" })[1];

beforeEach(() => {
  openPomodoro.mockClear();
});

describe("AppShell", () => {
  it("renders the page inside a skip-linked main region", () => {
    renderShell();
    expect(screen.getByRole("heading", { name: "Page content" }).closest("#main-content")).not.toBeNull();
    expect(screen.getByRole("link", { name: "Skip to content" })).toHaveAttribute("href", "#main-content");
  });

  it("shows the main destinations in the sidebar, without Jobs by default", () => {
    renderShell();
    const nav = within(desktopNav());
    expect(nav.getAllByRole("link").map((link) => link.textContent)).toEqual(["Home", "Find partners", "Messages", "Profile"]);
    expect(nav.getByRole("button", { name: "Focus" })).toBeInTheDocument();
  });

  it("shows Jobs when the flag is on", () => {
    renderShell({ jobs: true });
    expect(within(desktopNav()).getByRole("link", { name: "Jobs" })).toHaveAttribute("href", "/jobs");
  });

  it("marks the current section, including nested routes", () => {
    renderShell({ pathname: "/groups/abc" });
    const messages = within(desktopNav()).getByRole("link", { name: /Messages/ });
    expect(messages).toHaveAttribute("aria-current", "page");
    expect(messages).toHaveClass("bg-chat");
    expect(within(desktopNav()).getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current");
  });

  it("shows the unread count on Messages", async () => {
    renderShell({ unread: 12 });
    await waitFor(() => expect(within(desktopNav()).getByRole("link", { name: /Messages.*9\+.*unread/ })).toBeInTheDocument());
  });

  it("shows the streak from study metrics", async () => {
    renderShell();
    expect(await screen.findByText("6 days")).toBeInTheDocument();
  });

  it("opens the focus timer from the nav", async () => {
    renderShell();
    await userEvent.click(within(desktopNav()).getByRole("button", { name: "Focus" }));
    expect(openPomodoro).toHaveBeenCalledOnce();
  });

  it("lists secondary screens and the admin link only for admins", () => {
    const { unmount } = renderShell();
    const more = screen.getByRole("navigation", { name: "More" });
    expect(within(more).getAllByRole("link").map((link) => link.textContent)).toEqual(["Events", "Scheduling", "Notifications", "Bookmarks", "Study stats"]);
    unmount();
    renderShell({ isAdmin: true });
    expect(within(screen.getByRole("navigation", { name: "More" })).getByRole("link", { name: "Admin" })).toHaveAttribute("href", "/zenvy-admin");
  });
});

describe("mobile bottom bar", () => {
  it("has four tabs plus More", () => {
    renderShell();
    const bar = within(bottomNav());
    expect(bar.getAllByRole("link").map((link) => link.textContent)).toEqual(["Home", "Partners", "Messages"]);
    expect(bar.getByRole("button", { name: "Focus" })).toBeInTheDocument();
    expect(bar.getByRole("button", { name: "More" })).toBeInTheDocument();
  });

  it("More opens a sheet with profile, jobs, secondary screens and log out", async () => {
    renderShell({ jobs: true });
    await userEvent.click(within(bottomNav()).getByRole("button", { name: "More" }));
    const sheet = await screen.findByRole("dialog", { name: "More" });
    const sheetScope = within(sheet);
    expect(sheetScope.getByRole("link", { name: "View profile" })).toHaveAttribute("href", "/profile");
    expect(sheetScope.getByRole("link", { name: "Jobs" })).toBeInTheDocument();
    expect(sheetScope.queryByRole("link", { name: "Profile" })).toBeNull();
    expect(sheetScope.getByRole("link", { name: "Study stats" })).toBeInTheDocument();
    expect(sheetScope.getByRole("button", { name: "Log out" })).toBeInTheDocument();
  });

  it("hides itself inside a conversation", () => {
    renderShell({ pathname: "/chat", search: "conversation=abc" });
    // Hidden navs leave the accessibility tree, so query the DOM directly.
    expect(screen.getAllByRole("navigation", { name: "Main" })).toHaveLength(1);
    const bar = document.querySelectorAll('nav[aria-label="Main"]')[1];
    expect(bar).toHaveAttribute("aria-hidden", "true");
    expect(bar).toHaveClass("translate-y-full");
  });
});
