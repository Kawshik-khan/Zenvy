import { expect, test } from "@playwright/test";
import { expectNoAppError, login } from "../helpers";

test("focus panel starts, pauses and closes with the keyboard", async ({ page }) => {
  await login(page);
  await expectNoAppError(page);

  const launcher = page.getByRole("button", { name: "Start focus session" });
  await launcher.click();

  const panel = page.getByRole("dialog", { name: "Focus" });
  await expect(panel).toBeVisible();
  await expect(panel.getByRole("timer", { name: "Time remaining" })).toHaveText("25:00");
  await expect(panel.getByText("Ready to begin")).toBeVisible();
  await expect(panel.getByRole("progressbar", { name: "Session progress" })).toBeVisible();
  // No made-up streak.
  await expect(panel.getByText("Streak")).toHaveCount(0);

  await panel.getByRole("button", { name: "Start", exact: true }).click();
  await expect(panel.getByText("In progress")).toBeVisible();
  await expect(panel.getByRole("button", { name: "Pause" })).toBeVisible();

  await panel.getByRole("button", { name: "Session settings" }).click();
  await expect(panel.getByLabel("Focus (min)")).toBeDisabled(); // locked while running
  await panel.getByRole("button", { name: "Pause", exact: true }).first().click();
  await expect(panel.getByText("Paused").first()).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();

  // The sidebar now reports the running session instead of offering a new one.
  await expect(page.getByRole("button", { name: /Focus active/ })).toBeVisible();

  // End the session so later tests start from a clean timer.
  await page.getByRole("button", { name: /Focus active/ }).click();
  await panel.getByRole("button", { name: "End session" }).click();
  await expect(panel.getByText("Ready to begin")).toBeVisible();
  await page.keyboard.press("Escape");
});

test("focus panel fits a phone", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 375, height: 700 } });
  const page = await context.newPage();
  await login(page);
  await page.getByRole("button", { name: "Focus", exact: true }).click();
  const panel = page.getByRole("dialog", { name: "Focus" });
  await expect(panel).toBeVisible();
  // The panel slides in, so wait for it to settle before measuring.
  await expect
    .poll(async () => {
      const box = await panel.boundingBox();
      return box ? box.x >= 0 && box.x + box.width <= 375 : false;
    })
    .toBe(true);
  await expect(panel.getByRole("button", { name: "Start", exact: true })).toBeInViewport();
  await context.close();
});
