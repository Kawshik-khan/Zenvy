import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { login } from "../helpers";

// Automated WCAG 2.1 A/AA checks with axe. This catches contrast, missing names, bad ARIA and
// heading/landmark mistakes; it does not replace a keyboard and screen reader pass.

const SIGNED_OUT = ["/", "/login", "/register", "/forgot-password", "/reset-password?token=expired"];
const SIGNED_IN = ["/dashboard", "/matching", "/chat", "/groups", "/channels", "/events", "/scheduling", "/notifications", "/bookmarks", "/stats", "/profile", "/jobs", "/jobs/new", "/jobs/saved", "/jobs/mine"];

async function scan(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const summary = results.violations.map((violation) => `${violation.id} (${violation.impact}): ${violation.help}\n    ${violation.nodes.slice(0, 3).map((node) => node.target.join(" ")).join("\n    ")}`);
  expect(summary, `Accessibility violations:\n${summary.join("\n")}`).toEqual([]);
}

for (const path of SIGNED_OUT) {
  test(`axe: ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle").catch(() => {});
    await scan(page);
  });
}

for (const path of SIGNED_IN) {
  test(`axe: ${path}`, async ({ page }) => {
    await login(page);
    await page.goto(path);
    await page.waitForLoadState("networkidle").catch(() => {});
    await scan(page);
  });
}

test("axe: dialogs and the focus panel", async ({ page }) => {
  await login(page);
  await page.goto("/groups");
  await page.getByRole("button", { name: "Create group" }).first().click();
  await expect(page.getByRole("dialog", { name: "Create study group" })).toBeVisible();
  await scan(page);
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Start focus session" }).click();
  await expect(page.getByRole("dialog", { name: "Focus" })).toBeVisible();
  await scan(page);
});

test("axe: a conversation, a group room and a channel room", async ({ page }) => {
  await login(page);
  await page.goto("/chat");
  await page.getByRole("button", { name: "E2E Mate" }).first().click();
  await expect(page.getByLabel("Message E2E Mate")).toBeVisible();
  await scan(page);

  await page.goto("/groups");
  await page.getByRole("link", { name: /E2E Study Circle/ }).first().click();
  await expect(page.getByLabel("Message E2E Study Circle")).toBeVisible();
  await scan(page);
  await page.getByRole("tab", { name: "Resources" }).click();
  await scan(page);

  await page.goto("/channels");
  await page.getByRole("article").filter({ hasText: "E2E Algorithms" }).getByRole("link", { name: "Open" }).click();
  await expect(page.getByLabel("Message #e2e-algorithms")).toBeVisible();
  await scan(page);
});

test("axe: core screens at phone width", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 375, height: 700 } });
  const page = await context.newPage();
  await login(page);
  for (const path of ["/dashboard", "/matching", "/chat", "/groups", "/profile", "/jobs"]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle").catch(() => {});
    await scan(page);
  }
  await context.close();
});
