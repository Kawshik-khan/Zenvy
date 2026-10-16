import { expect, test } from "@playwright/test";

// Requires UI_GALLERY=true (set in CI) because e2e runs against a production build.
test("UI gallery renders the design system", async ({ page }) => {
  const response = await page.goto("/ui");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: "UI gallery" })).toBeVisible();

  // Tokens and fonts are applied.
  const primary = page.getByRole("button", { name: "Primary" });
  await expect(primary).toHaveCSS("background-color", "rgb(17, 17, 17)");
  await expect(primary).toHaveCSS("border-top-width", "3px");
  await expect(primary).toHaveCSS("box-shadow", /4px 4px 0px 0px/);
  await expect(primary).toHaveCSS("font-family", /Space Grotesk/);

  // Quiet volume swaps the edge width.
  const quietStart = page.locator(".quiet").getByRole("button", { name: "Start" });
  await expect(quietStart).toHaveCSS("border-top-width", "2px");

  // Keyboard focus shows the ring.
  await primary.focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(primary).toHaveCSS("outline-style", "solid");
});
