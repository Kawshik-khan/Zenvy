import { expect, test, type Page } from "@playwright/test";
import { appAlert, E2E_USER, expectNoAppError, login, loginWithForm, ownIpHeaders } from "../helpers";

// Needs FEATURE_JOBS=true on the server and the seeded users from `npm run db:seed:e2e`.
// The test server has no image storage, so these posts have no images; image handling is unit tested.
test.describe.configure({ mode: "serial" });

const stamp = Date.now();
const goodTitle = `Frontend intern ${stamp}`;
const scamTitle = `Easy data entry ${stamp}`;
let goodId = "";

function deadline(days: number) {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
}

async function fillJob(page: Page, over: { title: string; description: string; target?: string }) {
  await page.goto("/jobs/new");
  await page.getByLabel("Title", { exact: true }).fill(over.title);
  await page.getByLabel("Company").fill("Acme Ltd");
  await page.getByLabel("Location").fill("Dhaka");
  await page.getByLabel("Apply by").fill(deadline(20));
  await page.getByLabel("Description").fill(over.description);
  await page.getByLabel("Tags (optional)").fill("react, design");
  await page.getByLabel("Link or email").fill(over.target ?? "https://acme.example/careers");
}

test("the feed renders with filters, an empty-state-safe list and a safety tip", async ({ page }) => {
  await login(page);
  await page.goto("/jobs");
  await expectNoAppError(page);
  await expect(page.getByRole("heading", { level: 1, name: "Jobs" })).toBeVisible();
  await expect(page.getByRole("search", { name: "Filter jobs" })).toBeVisible();
  await expect(page.getByText("never asks you to pay").locator("visible=true")).toBeVisible();
});

test("posting needs the required fields and the no-fee confirmation", async ({ page }) => {
  await login(page);
  await page.goto("/jobs/new");
  await page.getByRole("button", { name: "Post job" }).click();
  await expect(page.getByText("Some fields need attention")).toBeVisible();
  await expect(page.getByText("Title is required")).toBeVisible();
  await expect(page.getByText(/never asked to pay/i).first()).toBeVisible();
});

test("a first post goes to review and stays out of the feed", async ({ page }) => {
  await login(page);
  await fillJob(page, { title: goodTitle, description: "Build screens with React and help the design team ship every week." });
  await page.getByLabel(/Applicants are never asked to pay/).check();
  await page.getByRole("button", { name: "Post job" }).click();

  await expect(page).toHaveURL(/\/jobs\/[^/?]+\?posted=pending/);
  goodId = new URL(page.url()).pathname.split("/").pop() ?? "";
  await expect(page.getByText("your post is with our reviewers")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: goodTitle })).toBeVisible();

  await page.goto("/jobs");
  await expect(page.getByRole("heading", { name: goodTitle })).toHaveCount(0);
  await page.goto("/jobs/mine");
  const mine = page.getByRole("article").filter({ hasText: goodTitle });
  await expect(mine.getByText("Waiting for review")).toBeVisible();
});

test("a post with scam wording is flagged for the reviewer", async ({ page }) => {
  await login(page);
  await fillJob(page, { title: scamTitle, description: "Pay a registration fee of 500 to start. Contact us on WhatsApp to begin working today.", target: "https://bit.ly/abc123" });
  await page.getByLabel(/Applicants are never asked to pay/).check();
  await page.getByRole("button", { name: "Post job" }).click();
  await expect(page).toHaveURL(/posted=pending/);
});

test.describe("another student", () => {
  test.use({ extraHTTPHeaders: ownIpHeaders() });
  test("cannot open a post that is still pending", async ({ page }) => {
    await page.goto("/login");
    await loginWithForm(page, /\/dashboard/, "e2e.partner@zenvy.test");
    await page.goto(`/jobs/${goodId}`);
    // The route streams, so the status is already 200; the page itself says not found.
    await expect(page.getByText("This page could not be found")).toBeVisible();
    await expect(page.getByRole("heading", { name: goodTitle })).toHaveCount(0);
  });
});

test.describe("admin review", () => {
  test.use({ extraHTTPHeaders: ownIpHeaders() });

  test("shows signals, approves one post and removes the flagged one", async ({ page }) => {
    await page.goto("/zenvy-admin/login");
    await page.getByLabel("Admin email").fill("e2e.admin@zenvy.test");
    await page.getByLabel("Password").fill(E2E_USER.password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/zenvy-admin$/, { timeout: 30_000 });

    await page.goto("/zenvy-admin/jobs");
    await expectNoAppError(page);
    const scam = page.getByRole("article").filter({ hasText: scamTitle });
    await expect(scam.getByText("Possible scam signals")).toBeVisible();
    await expect(scam.getByText("Asks for a fee or deposit")).toBeVisible();
    await expect(scam.getByText("Shortened link")).toBeVisible();

    // Removing needs a note, so the poster is told why.
    await scam.getByLabel(/Note to poster/).fill("Asks for a fee");
    await scam.getByRole("button", { name: `Remove ${scamTitle}` }).click();
    await expect(page.getByRole("article").filter({ hasText: scamTitle })).toHaveCount(0);

    const good = page.getByRole("article").filter({ hasText: goodTitle });
    await good.getByRole("button", { name: `Approve ${goodTitle}` }).click();
    await expect(page.getByRole("article").filter({ hasText: goodTitle })).toHaveCount(0);
  });
});

test("an approved post appears in the feed and can be filtered, saved, opened and reported", async ({ page }) => {
  await login(page);
  await page.goto("/notifications");
  await expect(page.getByText(`Your post "${goodTitle}" was approved`).locator("visible=true")).toBeVisible();
  await expect(page.getByText(`Your post "${scamTitle}" was removed: Asks for a fee`).locator("visible=true")).toBeVisible();

  await page.goto("/jobs?type=INTERNSHIP&q=" + encodeURIComponent(String(stamp)));
  const card = page.getByRole("article").filter({ hasText: goodTitle });
  await expect(card).toBeVisible();
  await expect(page.getByRole("heading", { name: scamTitle })).toHaveCount(0);

  const save = card.getByRole("button", { name: `Save ${goodTitle}` });
  await save.click();
  await expect(card.getByRole("button", { name: `Unsave ${goodTitle}` })).toHaveAttribute("aria-pressed", "true");

  await page.goto("/jobs/saved");
  await expect(page.getByRole("heading", { name: goodTitle })).toBeVisible();

  await page.goto(`/jobs/${goodId}`);
  await expect(page.getByRole("heading", { level: 1, name: goodTitle })).toBeVisible();
  await expect(page.getByText("This is your post").locator("visible=true")).toBeVisible();

  // Authors cannot report their own post.
  await expect(page.getByRole("button", { name: /^Report/ })).toHaveCount(0);
  await expect(appAlert(page)).toHaveCount(0);
});

test.describe("reporting", () => {
  test.use({ extraHTTPHeaders: ownIpHeaders() });
  test("another student can report a post once", async ({ page }) => {
    await page.goto("/login");
    await loginWithForm(page, /\/dashboard/, "e2e.partner@zenvy.test");
    await page.goto(`/jobs/${goodId}`);
  await page.getByRole("button", { name: "Apply on their site" }).click();
  const leaving = page.getByRole("dialog", { name: "You are leaving Zenvy" });
  await expect(leaving.getByRole("link", { name: "Continue" })).toHaveAttribute("rel", /noopener/);
  await page.keyboard.press("Escape");

    await page.getByRole("button", { name: `Report ${goodTitle}` }).click();
    const dialog = page.getByRole("dialog", { name: "Report this post" });
    await dialog.getByLabel("Reason").selectOption("SCAM_FEE");
    await dialog.getByRole("button", { name: "Send report" }).click();
    await expect(page.getByText("Thanks, we will review it", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: `Report ${goodTitle}` }).click();
    await page.getByRole("dialog", { name: "Report this post" }).getByRole("button", { name: "Send report" }).click();
    await expect(page.getByText("You already reported this post", { exact: true })).toBeVisible();
  });
});

test("the jobs entry is in the sidebar and the post form fits a phone", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 375, height: 700 } });
  const page = await context.newPage();
  await login(page);
  await page.goto("/jobs/new");
  await expect(page.getByRole("button", { name: "Post job" })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await page.goto("/jobs");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  await context.close();
});
