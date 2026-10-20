import { expect, test } from "@playwright/test";
import { expectNoAppError } from "../helpers";

test.describe("public pages", () => {
  for (const path of ["/", "/login", "/register", "/forgot-password"]) {
    test(`${path} renders`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBeLessThan(400);
      await expect(page.locator("body")).toBeVisible();
      await expectNoAppError(page);
    });
  }

  test("health endpoint responds", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.ok()).toBe(true);
  });

  test("signed-out users are sent to login from the dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
