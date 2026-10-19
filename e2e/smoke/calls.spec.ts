import { expect, test } from "@playwright/test";
import { expectNoAppError, login } from "../helpers";

// LiveKit is not configured in the test environment, so these cover the screens around a
// call: starting one from a chat, and what the person sees when the media server is missing.

test("starting a call from a conversation shows a readable screen with a way out", async ({ page }) => {
  await login(page);
  await page.goto("/chat");
  await page.getByRole("button", { name: "E2E Mate" }).first().click();
  await expect(page).toHaveURL(/conversation=/);

  await page.getByRole("link", { name: "Voice call" }).click();
  await expect(page).toHaveURL(/\/call\/active\?type=dm/);
  await expectNoAppError(page);

  // Either the connecting screen or, without a media server, an error with recovery actions.
  const goBack = page.getByRole("button", { name: "Go to messages" });
  const leave = page.getByRole("button", { name: "Leave call" });
  await expect(goBack.or(leave)).toBeVisible({ timeout: 15_000 });
  if (await goBack.isVisible()) {
    await expect(page.getByRole("alert").filter({ hasText: /\w/ }).first()).toBeVisible();
    await goBack.click();
    await expect(page).toHaveURL(/\/chat$/);
  }
});

test("the call route without a target returns to messages", async ({ page }) => {
  await login(page);
  await page.goto("/call/active");
  await expect(page).toHaveURL(/\/chat/);
});

test("no call screen sends names to third-party avatar services", async ({ page }) => {
  const external: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("ui-avatars.com")) external.push(request.url());
  });
  await login(page);
  await page.goto("/chat");
  await page.getByRole("button", { name: "E2E Mate" }).first().click();
  await page.getByRole("link", { name: "Video call" }).click();
  await expect(page).toHaveURL(/\/call\/active/);
  await page.waitForLoadState("networkidle").catch(() => {});
  expect(external).toEqual([]);
});
