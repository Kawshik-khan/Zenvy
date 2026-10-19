import { expect, test } from "@playwright/test";
import { appAlert, expectNoAppError, login } from "../helpers";

// Relies on the fixtures from `npm run db:seed:e2e`: an accepted match with "E2E Mate",
// the study group "E2E Study Circle" and the channel #e2e-algorithms. The test server has no
// socket endpoint, so these tests cover layout, labels and keyboard use, not live delivery.

test("inbox lists conversations, partners and groups without third-party avatars", async ({ page }) => {
  const external: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("ui-avatars.com")) external.push(request.url());
  });

  await login(page);
  await page.goto("/chat");
  await expectNoAppError(page);

  await expect(page.getByRole("heading", { level: 1, name: "Messages" })).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Search conversations" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Study groups" })).toBeVisible();
  await expect(page.getByRole("link", { name: "E2E Study Circle" })).toBeVisible();
  expect(external).toEqual([]);
});

test("starting a DM opens the conversation with a labelled composer", async ({ page }) => {
  await login(page);
  await page.goto("/chat");

  await page.getByRole("button", { name: "E2E Mate" }).first().click();
  await expect(page).toHaveURL(/\/chat\?conversation=/);

  await expect(page.getByRole("heading", { level: 2, name: "E2E Mate" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Voice call" })).toHaveAttribute("href", /\/call\/active\?type=dm&id=.*&media=audio/);
  await expect(page.getByRole("link", { name: "Video call" })).toHaveAttribute("href", /media=video/);

  const send = page.getByRole("button", { name: "Send message" });
  await expect(send).toBeDisabled();
  await page.getByLabel("Message E2E Mate").fill("Hello from the test");
  await expect(send).toBeEnabled();
  await expect(page.getByRole("button", { name: /Attach file/ })).toBeVisible();
});

test("a conversation fits a phone and hides the bottom bar", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 375, height: 700 }, storageState: undefined });
  const page = await context.newPage();
  await login(page);
  await page.goto("/chat");
  await page.getByRole("button", { name: "E2E Mate" }).first().click();
  await expect(page).toHaveURL(/\/chat\?conversation=/);

  await expect(page.getByRole("link", { name: "Back to inbox" })).toBeVisible();
  const composer = page.getByLabel("Message E2E Mate");
  await expect(composer).toBeVisible();
  const box = await composer.boundingBox();
  expect(box && box.x >= 0 && box.x + box.width <= 375).toBeTruthy();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);

  await page.getByRole("link", { name: "Back to inbox" }).click();
  await expect(page).toHaveURL(/\/chat$/);
  await context.close();
});

test("study group has chat and resources tabs and a members sheet", async ({ page }) => {
  await login(page);
  await page.goto("/groups");
  await page.getByRole("link", { name: /E2E Study Circle/ }).first().click();
  await expect(page).toHaveURL(/\/groups\/[^/]+$/);
  await expectNoAppError(page);

  await expect(page.getByRole("heading", { level: 1, name: "E2E Study Circle" })).toBeVisible();
  await expect(page.getByLabel("Message E2E Study Circle")).toBeVisible();

  await page.getByRole("button", { name: "2 members" }).click();
  const sheet = page.getByRole("dialog", { name: "Members" });
  await expect(sheet.getByText("E2E Mate")).toBeVisible();
  await expect(sheet.getByText("Admin")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();

  await page.getByRole("tab", { name: "Resources" }).click();
  await expect(page.getByRole("heading", { name: "Study resources" })).toBeVisible();
  // The student is the admin, so the add form and invite form are shown with real labels.
  await expect(page.getByLabel("Title")).toBeVisible();
  await page.locator("label").filter({ hasText: /^Note$/ }).click();
  await expect(page.getByRole("textbox", { name: "Note", exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Chat" }).click();
  await expect(page.getByLabel("Message E2E Study Circle")).toBeVisible();
  await expect(appAlert(page)).toHaveCount(0);
});

test("channel shows its tag, members and composer", async ({ page }) => {
  await login(page);
  await page.goto("/channels");
  await page.getByRole("article").filter({ hasText: "E2E Algorithms" }).getByRole("link", { name: "Open" }).click();
  await expect(page).toHaveURL(/\/channels\/[^/]+$/);
  await expectNoAppError(page);

  await expect(page.getByRole("heading", { level: 1, name: "#e2e-algorithms" })).toBeVisible();
  await expect(page.getByLabel("Message #e2e-algorithms")).toBeVisible();
  await page.getByRole("button", { name: "2 members" }).click();
  await expect(page.getByRole("dialog", { name: "Members" }).getByText("Creator")).toBeVisible();
});
