import { expect, type Page } from "@playwright/test";

export const E2E_USER = {
  email: "e2e.student@zenvy.test",
  // Keep in sync with scripts/seed-e2e.mjs
  password: "Zenvy-e2e-password-1",
};

export async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email Address").fill(E2E_USER.email);
  await page.getByLabel("Password").fill(E2E_USER.password);
  await page.locator('form button[type="submit"]').click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
}

/** Fails the test if the page rendered Next's error overlay or an error boundary. */
export async function expectNoAppError(page: Page) {
  await expect(page.getByText("Application error", { exact: false })).toHaveCount(0);
  await expect(page.getByText("Internal Server Error", { exact: false })).toHaveCount(0);
}
