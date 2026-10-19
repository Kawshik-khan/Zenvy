import { devices, expect, test } from "@playwright/test";

test("landing page: content, anchors and CTAs work", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Find your study partner.");

  // In-page navigation scrolls to the section.
  await page.getByRole("navigation", { name: "Page sections" }).getByRole("link", { name: "Matching" }).click();
  await expect(page).toHaveURL(/#matching$/);
  await expect(page.locator("#matching")).toBeInViewport();

  // Primary CTA goes to sign-up.
  await page.getByRole("link", { name: "Get started" }).click();
  await expect(page).toHaveURL(/\/register/);
});

test("landing page uses the design system fonts and colours", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("div:has(> main)").first()).toHaveCSS("background-color", "rgb(255, 248, 236)");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCSS("font-family", /Space Grotesk/);
});

test.describe("phone", () => {
  const { defaultBrowserType: _ignored, ...pixel7 } = devices["Pixel 7"];
  test.use(pixel7);

  test("landing page fits the screen and keeps the CTAs reachable", async ({ page }) => {
    await page.goto("/");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await expect(page.getByRole("link", { name: "Get started" })).toBeVisible();
    // Section links are hidden below the lg breakpoint; the nav must not overflow.
    await expect(page.getByRole("navigation", { name: "Page sections" })).toBeHidden();
  });
});
