import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, type BrowserContext, type Locator, type Page } from "@playwright/test";

export const E2E_USER = {
  email: "e2e.student@zenvy.test",
  // Keep in sync with scripts/seed-e2e.mjs
  password: "Zenvy-e2e-password-1",
};

/** Session saved by e2e/auth.setup.ts so tests don't hit the login rate limit (5 per 15 min). */
export const STUDENT_STATE = path.join(__dirname, ".auth", "student.json");

/**
 * Signs in through the real login form. Every attempt counts toward the app's login rate limit
 * (5 per 15 minutes per IP, keyed on x-forwarded-for), so tests that sign in give their context
 * a unique fake address with `ownIpHeaders`.
 */
export async function loginWithForm(page: Page, expectedUrl: RegExp = /\/dashboard/, email: string = E2E_USER.email, password: string = E2E_USER.password) {
  await page.getByLabel("Email address").fill(email);
  // Exact: the "Show password" toggle also has "password" in its name.
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(expectedUrl, { timeout: 30_000 });
}

let ipCounter = 0;
/** Header set for `test.use({ extraHTTPHeaders })`: a fake client IP so this test has its own rate-limit bucket. */
export function ownIpHeaders() {
  ipCounter += 1;
  const octet = (Date.now() + ipCounter) % 250;
  return { "x-forwarded-for": `10.77.${ipCounter % 250}.${octet + 1}` };
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

/** The app's own role="alert" messages. Excludes Next's route announcer, which is also role="alert". */
export function appAlert(page: Page): Locator {
  return page.locator('[role="alert"]:not(#__next-route-announcer__)');
}
