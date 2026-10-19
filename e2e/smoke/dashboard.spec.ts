import { devices, expect, test } from "@playwright/test";
import { expectNoAppError, login } from "../helpers";

test("dashboard shows the study summary in the new design", async ({ page }) => {
  await login(page);
  await expectNoAppError(page);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("ready to study?");

  const summary = page.getByRole("region", { name: "Study summary" });
  for (const label of ["Study hours", "Sessions", "Groups", "Attendance"]) {
    await expect(summary.getByText(label, { exact: true })).toBeVisible();
  }
  await expect(page.getByRole("img", { name: /Study activity for the last 28 days/ })).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "Level progress" })).toBeVisible();

  // Design tokens are applied to the page, not just the shell.
  await expect(page.locator("div.bg-canvas").first()).toHaveCSS("background-color", "rgb(255, 248, 236)");
  // Icon-only controls render their icon at full size (a padding conflict once squeezed it to ~8px).
  const bellIcon = page.getByRole("link", { name: /notifications/i }).locator("svg");
  const box = await bellIcon.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(19);
  expect(box?.height).toBeGreaterThanOrEqual(19);
  // The old glass styling is gone.
  expect(await page.locator('[class*="backdrop-blur"]').count()).toBe(0);
});

test("people search finds a seeded student and offers actions", async ({ page }) => {
  await login(page);
  const search = page.getByRole("combobox", { name: "Search people" });
  await search.fill("E2E Partner");
  const option = page.getByRole("option").filter({ hasText: "E2E Partner" });
  await expect(option).toBeVisible();
  await expect(option.getByRole("link", { name: "View profile" })).toHaveAttribute("href", /\/users\//);

  // Keyboard: the active result is exposed to assistive tech.
  await expect(search).toHaveAttribute("aria-activedescendant", /.+/);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("listbox")).toBeHidden();
});

test("Ctrl+K focuses the search", async ({ page }) => {
  await login(page);
  await page.keyboard.press("Control+k");
  await expect(page.getByRole("combobox", { name: "Search people" })).toBeFocused();
});

test.describe("phone", () => {
  const { defaultBrowserType: _ignored, ...pixel7 } = devices["Pixel 7"];
  test.use(pixel7);

  test("dashboard has no sideways scroll and keeps the search usable", async ({ page }) => {
    await login(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await expect(page.getByRole("combobox", { name: "Search people" })).toBeVisible();
    await expect(page.getByRole("link", { name: /notifications/i })).toBeVisible();
    // "Create" is a desktop-only shortcut.
    await expect(page.getByRole("link", { name: "Create", exact: true })).toBeHidden();
  });
});
