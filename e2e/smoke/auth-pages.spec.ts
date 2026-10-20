import { expect, test } from "@playwright/test";
import { appAlert, expectNoAppError, loginWithForm, ownIpHeaders } from "../helpers";

test.describe("login", () => {
  test.use({ extraHTTPHeaders: ownIpHeaders() });

  test("shows the design-system form with labelled fields", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { level: 1, name: "Sign in to Zenvy" })).toBeVisible();
    await expect(page.getByLabel("Email address")).toHaveAttribute("autocomplete", "email");
    await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("autocomplete", "current-password");
    await expect(page.getByRole("button", { name: "Sign in", exact: true })).toHaveCSS("background-color", "rgb(17, 17, 17)");
    // Google only shows when AUTH_GOOGLE_ID/SECRET are configured (not in CI).
    await expect(page.getByText("Continue with Google")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Forgot password?" })).toHaveAttribute("href", "/forgot-password");
  });

  test("the password can be shown and hidden", async ({ page }) => {
    await page.goto("/login");
    const password = page.getByLabel("Password", { exact: true });
    await password.fill("secret-value");
    await page.getByRole("button", { name: "Show password" }).click();
    await expect(password).toHaveAttribute("type", "text");
    await page.getByRole("button", { name: "Hide password" }).click();
    await expect(password).toHaveAttribute("type", "password");
  });

  test("a wrong password shows an announced error and keeps the user on the page", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email address").fill("e2e.student@zenvy.test");
    await page.getByLabel("Password", { exact: true }).fill("not-the-password");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(appAlert(page)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("messages from the verification flow are shown", async ({ page }) => {
    await page.goto("/login?message=check-email");
    await expect(page.getByRole("status")).toContainText("Check your inbox");
    await page.goto("/login?error=Verification");
    await expect(appAlert(page)).toContainText("Verification failed");
  });
});

test.describe("register", () => {
  test.use({ extraHTTPHeaders: ownIpHeaders() });

  test("validates the password before creating anything", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { level: 1, name: "Create your account" })).toBeVisible();
    await page.getByLabel("Full name").fill("Weak Password");
    await page.getByLabel("University email").fill("weak.password@zenvy.test");
    const password = page.getByLabel("Password", { exact: true });
    await password.fill("short");
    await expect(page.getByText("Too short")).toBeVisible();
    await page.getByRole("button", { name: "Create account", exact: true }).click();
    // The error sits under the field and is linked to it.
    await expect(page.getByText("Use at least 8 characters.")).toBeVisible();
    await expect(password).toHaveAttribute("aria-invalid", "true");
    await expect(page).toHaveURL(/\/register/);
  });

  test("does not claim numbers or features the product cannot back", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByText("10K+")).toHaveCount(0);
  });
});

test.describe("password reset", () => {
  test.use({ extraHTTPHeaders: ownIpHeaders() });

  test("asks for an email, then confirms without saying whether the account exists", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByRole("heading", { level: 1, name: "Forgot your password?" })).toBeVisible();
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByText("Enter the email you signed up with.")).toBeVisible();

    await page.getByLabel("Email address").fill("nobody.here@zenvy.test");
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Check your email" })).toBeVisible();
    await expect(page.getByText("If an account exists for nobody.here@zenvy.test")).toBeVisible();
    await expect(page.getByRole("button", { name: /Resend in/ })).toBeDisabled();
    await expectNoAppError(page);
  });

  test("an unknown or expired link offers a new one", async ({ page }) => {
    await page.goto("/reset-password?token=does-not-exist");
    await expect(page.getByRole("heading", { level: 1, name: "This link has expired" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Send a new link" })).toHaveAttribute("href", "/forgot-password");
    await expectNoAppError(page);
  });
});

test.describe("verify", () => {
  test("a missing or unknown token explains what to do next", async ({ page }) => {
    await page.goto("/verify");
    await expect(page.getByRole("heading", { level: 1, name: "Missing token" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Back to log in" })).toHaveAttribute("href", "/login");

    await page.goto("/verify?token=does-not-exist");
    await expect(page.getByRole("heading", { level: 1, name: "Link expired" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Register again" })).toHaveAttribute("href", "/register");
    await expectNoAppError(page);
  });
});

test.describe("onboarding", () => {
  test.use({ extraHTTPHeaders: ownIpHeaders() });

  test("a new user completes their profile on a phone and lands on the dashboard", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/login?callbackUrl=%2Fonboarding");
    await loginWithForm(page, /\/onboarding/, "e2e.newbie@zenvy.test");
    await expect(page.getByRole("heading", { level: 1, name: "Complete your study profile." })).toBeVisible();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);

    // Required fields block an empty submit (native validation), so nothing is sent.
    await page.getByRole("button", { name: "Complete profile" }).click();
    await expect(page).toHaveURL(/\/onboarding/);

    await page.getByLabel("College").fill("Zenvy University");
    await page.getByLabel("Major").fill("Computer Science");
    await page.getByLabel("Semester").selectOption("3");
    await page.getByLabel("Interests").fill("graphs, react");
    await page.getByLabel("Availability").fill("Evenings");
    await page.getByRole("button", { name: "Complete profile" }).click();

    await expect(page.getByRole("status").filter({ hasText: "Profile completed" })).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
  });
});
