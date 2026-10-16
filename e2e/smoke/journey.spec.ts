import { expect, test } from "@playwright/test";
import { expectNoAppError, login } from "../helpers";

// Core signed-in journey: login → dashboard → matching → messages → focus → profile.
test("signed-in student can reach the core screens", async ({ page }) => {
  await login(page);
  await expectNoAppError(page);

  for (const path of ["/matching", "/chat", "/groups", "/profile"]) {
    const response = await page.goto(path);
    expect(response?.status(), `${path} status`).toBeLessThan(400);
    await expect(page, `${path} should not bounce to login`).not.toHaveURL(/\/login/);
    await expectNoAppError(page);
  }

  // The focus timer is opened from the sidebar rather than a route.
  await page.goto("/dashboard");
  const focusLink = page.getByRole("link", { name: /focus timer/i }).first();
  if (await focusLink.isVisible()) {
    await focusLink.click();
    await expectNoAppError(page);
  }
});
