import { devices, expect, test } from "@playwright/test";
import { expectNoAppError, login } from "../helpers";

// These tests create a match request and a study ad. `npm run db:seed:e2e` clears both.
test.describe.configure({ mode: "serial" });

test("matching page lists partners with reasons and sends no request to third parties", async ({ page }) => {
  const external: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("ui-avatars.com")) external.push(request.url());
  });

  await login(page);
  await page.goto("/matching");
  await expectNoAppError(page);
  await expect(page.getByRole("heading", { level: 1, name: "Find partners" })).toBeVisible();

  const card = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "E2E Partner" }) });
  await expect(card).toBeVisible();
  await expect(card.getByText("Why you match")).toBeVisible();
  await expect(card.getByRole("list").first()).toContainText("Same major");
  await expect(card.getByText(/\d+%/).first()).toBeVisible();

  // Names are not leaked to the avatar service; initials are shown instead.
  expect(external).toEqual([]);
  await expect(card.getByRole("img", { name: "E2E Partner" })).toHaveText("EP");

  // Filters are labelled and work through the URL.
  await expect(page.getByRole("search", { name: "Filter partners" })).toBeVisible();
  await page.getByRole("searchbox", { name: "Filter by keyword" }).fill("zzz-no-such-person");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page).toHaveURL(/q=zzz-no-such-person/);
  await expect(page.getByText("No matching peers found").locator("visible=true")).toBeVisible();
  await page.getByRole("link", { name: "Clear filters" }).first().click();
  await expect(page.getByRole("heading", { name: "E2E Partner" })).toBeVisible();
});

test("connecting opens an accessible note dialog and sends the request", async ({ page }) => {
  await login(page);
  await page.goto("/matching");
  const connect = page.getByRole("button", { name: "Connect with E2E Partner" });

  await connect.click();
  const dialog = page.getByRole("dialog", { name: "Add a short note" });
  await expect(dialog).toBeVisible();

  // Escape closes it and focus returns to the button.
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(connect).toBeFocused();

  await connect.click();
  const note = "Also studying graphs. Join me?";
  await dialog.getByLabel("Your note").fill(note);
  await expect(dialog.getByText(`${note.length}/180`)).toBeVisible();
  await dialog.getByRole("button", { name: "Send request" }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByRole("article").filter({ hasText: "E2E Partner" }).getByText("Pending")).toBeVisible();
});

test("the public profile reflects the pending request", async ({ page }) => {
  await login(page);
  await page.goto("/matching");
  await page.getByRole("article").filter({ hasText: "E2E Partner" }).getByRole("link", { name: "View profile" }).click();
  await expect(page).toHaveURL(/\/users\//);
  await expect(page.getByRole("heading", { level: 1, name: "E2E Partner" })).toBeVisible();
  await expect(page.getByText("Pending")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Interests" })).toBeVisible();
  await expectNoAppError(page);
});

test("a study ad can be posted and appears on the matching page", async ({ page }) => {
  await login(page);
  await page.goto("/matching/post-ad");
  await expect(page.getByRole("heading", { level: 1, name: "Post your study ad" })).toBeVisible();
  await page.getByLabel("Title").fill("E2E: graphs finals prep");
  await page.getByLabel("What should partners know?").fill("Past papers on Sunday.");
  await page.getByRole("button", { name: "Publish study ad" }).click();
  await expect(page).toHaveURL(/\/matching$/);
  await expect(page.getByRole("heading", { name: "E2E: graphs finals prep" })).toBeVisible();
});

test.describe("phone", () => {
  const { defaultBrowserType: _ignored, ...pixel7 } = devices["Pixel 7"];
  test.use(pixel7);

  test("matching has no sideways scroll and the filter form stays usable", async ({ page }) => {
    await login(page);
    await page.goto("/matching");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await expect(page.getByLabel("Department")).toBeVisible();
    await expect(page.getByRole("button", { name: "Apply" })).toBeVisible();
  });
});
