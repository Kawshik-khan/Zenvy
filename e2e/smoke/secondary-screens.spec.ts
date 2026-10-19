import { expect, test } from "@playwright/test";
import { expectNoAppError, login } from "../helpers";

const screens = [
  { path: "/groups", heading: "Study groups" },
  { path: "/channels", heading: "Channels" },
  { path: "/events", heading: "Study events" },
  { path: "/scheduling", heading: "Scheduling" },
  { path: "/notifications", heading: "Notifications" },
  { path: "/bookmarks", heading: "Bookmarks" },
  { path: "/stats", heading: "Study stats" },
];

for (const { path, heading } of screens) {
  test(`${path} renders with one h1, no third-party avatars, and fits a phone`, async ({ browser }) => {
    const external: string[] = [];
    const context = await browser.newContext({ viewport: { width: 375, height: 700 } });
    const page = await context.newPage();
    page.on("request", (request) => {
      if (request.url().includes("ui-avatars.com")) external.push(request.url());
    });

    await login(page);
    await page.goto(path);
    await expectNoAppError(page);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    expect(external).toEqual([]);
    await context.close();
  });
}

test("create group dialog is labelled, closes on Escape and returns focus", async ({ page }) => {
  await login(page);
  await page.goto("/groups");
  const trigger = page.getByRole("button", { name: "Create group" }).first();
  await trigger.click();

  const dialog = page.getByRole("dialog", { name: "Create study group" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("Group name")).toBeVisible();
  await expect(dialog.getByLabel("Subject")).toBeVisible();
  await expect(dialog.getByLabel("Description")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("create channel dialog derives a tag from the name", async ({ page }) => {
  await login(page);
  await page.goto("/channels");
  await page.getByRole("button", { name: "Create channel" }).first().click();

  const dialog = page.getByRole("dialog", { name: "Create channel" });
  await dialog.getByLabel("Channel name").fill("CS 101 Study Hall");
  await expect(dialog.getByLabel("Unique tag")).toHaveValue("cs-101-study-hall");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("groups list shows the seeded group with a real join/leave control", async ({ page }) => {
  await login(page);
  await page.goto("/groups");
  const card = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "E2E Study Circle" }) });
  await expect(card).toBeVisible();
  await expect(card.getByRole("button", { name: "Leave group E2E Study Circle" })).toBeVisible();
  // No made-up "Active" badge.
  await expect(card.getByText("Active", { exact: true })).toHaveCount(0);
});

test("event form uses labelled fields and a chip group for duration", async ({ page }) => {
  await login(page);
  await page.goto("/events");
  for (const label of ["Title", "Group", "Date", "Start", "End", "Location", "Notes"]) {
    await expect(page.getByLabel(label, { exact: true })).toBeVisible();
  }
  const twoHours = page.getByRole("group", { name: "Duration" }).getByRole("button", { name: "2h" });
  await twoHours.click();
  await expect(twoHours).toHaveAttribute("aria-pressed", "true");
});

test("admin login is on the shared auth frame and non-admins are sent to the dashboard", async ({ page }) => {
  await page.goto("/zenvy-admin/login");
  await expect(page.getByRole("heading", { level: 1, name: "System access" })).toBeVisible();
  await expect(page.getByLabel("Admin email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();

  await login(page);
  await page.goto("/zenvy-admin");
  await expect(page).toHaveURL(/\/dashboard/);
});
