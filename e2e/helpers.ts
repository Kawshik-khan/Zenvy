import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, type BrowserContext, type Page } from "@playwright/test";

export const E2E_USER = {
  email: "e2e.student@zenvy.test",
  // Keep in sync with scripts/seed-e2e.mjs
  password: "Zenvy-e2e-password-1",
};

/** Session saved by e2e/auth.setup.ts so tests don't hit the login rate limit (5 per 15 min). */
export const STUDENT_STATE = path.join(__dirname, ".auth", "student.json");

/** Signs in through the real login form. Use sparingly: every call counts toward the rate limit. */
export async function loginWithForm(page: Page, expectedUrl: RegExp = /\/dashboard/) {
  await page.getByLabel("Email Address").fill(E2E_USER.email);
  await page.getByLabel("Password").fill(E2E_USER.password);
  await page.locator('form button[type="submit"]').click();
  await expect(page).toHaveURL(expectedUrl, { timeout: 30_000 });
}

/** Reuses the saved session and opens the dashboard. */
export async function login(page: Page) {
  const state = JSON.parse(readFileSync(STUDENT_STATE, "utf8")) as { cookies: Parameters<BrowserContext["addCookies"]>[0] };
  await page.context().addCookies(state.cookies);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
}

/** Fails the test if the page rendered Next's error overlay or an error boundary. */
export async function expectNoAppError(page: Page) {
  await expect(page.getByText("Application error", { exact: false })).toHaveCount(0);
  await expect(page.getByText("Internal Server Error", { exact: false })).toHaveCount(0);
}
