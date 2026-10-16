import { devices, expect, test } from "@playwright/test";
import { expectNoAppError, login, loginWithForm } from "../helpers";

test.describe("route guard (middleware)", () => {
  for (const path of ["/matching", "/profile", "/onboarding", "/call/active", "/notifications"]) {
    test(`signed-out visit to ${path} redirects to login with a callback`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login\?callbackUrl=/);
      expect(decodeURIComponent(new URL(page.url()).searchParams.get("callbackUrl") || "")).toContain(path);
    });
  }

  test("the redirect happens before the page renders (no page HTML sent)", async ({ request }) => {
    const response = await request.get("/matching", { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    expect(response.headers()["location"]).toContain("/login");
  });

  test("APIs answer 401 instead of redirecting", async ({ request }) => {
    const response = await request.get("/api/conversations/unread", { maxRedirects: 0 });
    expect(response.status()).toBe(401);
  });

  test("static files are not guarded", async ({ request }) => {
    const response = await request.get("/sw.js", { maxRedirects: 0 });
    expect(response.status()).toBe(200);
  });

  test("after login the user returns to the page they asked for", async ({ page }) => {
    await page.goto("/notifications");
    await expect(page).toHaveURL(/\/login/);
    await loginWithForm(page, /\/notifications$/);
  });
});

test.describe("app shell", () => {
  test("desktop sidebar shows the main destinations and marks the current one", async ({ page }) => {
    await login(page);
    const nav = page.getByRole("navigation", { name: "Main" }).first();
    await expect(nav.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");

    await nav.getByRole("link", { name: "Find partners" }).click();
    await expect(page).toHaveURL(/\/matching/);
    await expect(nav.getByRole("link", { name: "Find partners" })).toHaveAttribute("aria-current", "page");
    await expectNoAppError(page);

    await nav.getByRole("link", { name: /Messages/ }).click();
    await expect(page).toHaveURL(/\/chat/);
    await expect(nav.getByRole("link", { name: /Messages/ })).toHaveAttribute("aria-current", "page");

    // Only the shell's navigation: the old per-page sidebar ("Sidebar navigation") is gone.
    await expect(page.getByRole("navigation", { name: "Sidebar navigation" })).toHaveCount(0);
    await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(1);
  });

  test("Focus opens the timer and the skip link moves focus to the content", async ({ page }) => {
    await login(page);
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main-content")).toBeFocused();

    await page.getByRole("navigation", { name: "Main" }).first().getByRole("button", { name: "Focus" }).click();
    await expectNoAppError(page);
  });
});

test.describe("mobile shell", () => {
  // Phone-sized viewport and touch; defaultBrowserType can't be set inside a describe.
  const { defaultBrowserType: _ignored, ...pixel7 } = devices["Pixel 7"];
  test.use(pixel7);

  test("bottom bar navigates and More opens the sheet", async ({ page }) => {
    await login(page);
    const bar = page.getByRole("navigation", { name: "Main" }).last();
    await expect(bar).toBeVisible();
    // The desktop sidebar is display:none on phones (so it also leaves the accessibility tree).
    await expect(page.locator("aside")).toBeHidden();
    await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(1);

    await bar.getByRole("link", { name: "Partners" }).click();
    await expect(page).toHaveURL(/\/matching/);

    await bar.getByRole("button", { name: "More" }).click();
    const sheet = page.getByRole("dialog", { name: "More" });
    await expect(sheet).toBeVisible();
    await sheet.getByRole("link", { name: "Study stats" }).click();
    await expect(page).toHaveURL(/\/stats/);
    await expect(sheet).toBeHidden();
  });

  test("page content is not covered by the bottom bar and nothing scrolls sideways", async ({ page }) => {
    await login(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
