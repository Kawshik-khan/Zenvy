import { expect, test } from "@playwright/test";

// Runs against /ui (needs UI_GALLERY=true in production builds).

const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);
const png = (name: string) => ({ name, mimeType: "image/png", buffer: PNG_1PX });

test.beforeEach(async ({ page }) => {
  await page.goto("/ui");
});

test("dialog pops in, traps focus, closes on Escape", async ({ page }) => {
  const trigger = page.locator('button[aria-haspopup="dialog"]', { hasText: "Leave call" });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Leave this call?" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveCSS("animation-name", "nb-pop-in");

  await page.keyboard.press("Tab");
  await expect(dialog.locator(":focus")).toHaveCount(1);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("side sheet slides in and popover opens", async ({ page }) => {
  await page.getByRole("button", { name: "Filters (side sheet)" }).click();
  const sheet = page.getByRole("dialog", { name: "Filter jobs" });
  await expect(sheet).toHaveCSS("animation-name", "nb-slide-in-right");
  await page.getByRole("button", { name: "Close" }).click();
  await expect(sheet).toBeHidden();

  await page.getByRole("button", { name: "Nadia Rahman" }).click();
  await expect(page.getByRole("dialog", { name: "Nadia Rahman profile preview" })).toBeVisible();
});

test("tabs switch with the keyboard", async ({ page }) => {
  await page.getByRole("tab", { name: "People" }).click();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Groups" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel")).toContainText("Study groups");
});

test("toasts appear and can be dismissed", async ({ page }) => {
  await page.getByRole("button", { name: "Success toast" }).click();
  // Radix also renders a visually hidden copy for screen readers; target the visible toast.
  const toast = page.locator('li[role="status"]', { hasText: "Request sent" });
  await expect(toast).toBeVisible();
  await page.getByRole("button", { name: "Dismiss notification" }).click();
  await expect(toast).toHaveCount(0);
});

test("image drop zone previews files and submits them with the form", async ({ page }) => {
  const jobImages = page.getByLabel("Job images (poster, notice, office photo)");
  await jobImages.setInputFiles([png("poster.png"), png("office.png")]);
  await expect(page.getByRole("img", { name: "poster.png" })).toBeVisible();
  await expect(page.getByText("Cover")).toBeVisible();

  await page.getByRole("button", { name: "Remove office.png" }).click();
  await expect(page.getByRole("img", { name: "office.png" })).toHaveCount(0);

  await page.getByLabel("Profile photo").setInputFiles([png("me.png")]);
  await expect(page.getByRole("img", { name: "New photo: me.png" })).toBeVisible();

  await page.getByRole("button", { name: /Submit form/ }).click();
  await expect(page.locator('li[role="status"]', { hasText: "1 job image, 1 new profile photo." })).toBeVisible();
});

test("invalid files are rejected with a reason", async ({ page }) => {
  await page.getByLabel("Job images (poster, notice, office photo)").setInputFiles([{ name: "cv.pdf", mimeType: "application/pdf", buffer: Buffer.from("x") }]);
  await expect(page.getByText("cv.pdf: use JPG, PNG or WebP.").first()).toBeVisible();
});

test.describe("reduced motion", () => {
  test("animations are cut to near zero", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.locator('button[aria-haspopup="dialog"]', { hasText: "Leave call" }).click();
    const dialog = page.getByRole("dialog", { name: "Leave this call?" });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveCSS("animation-duration", "0.001s");
  });
});
