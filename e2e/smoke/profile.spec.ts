import { expect, test } from "@playwright/test";
import { appAlert, expectNoAppError, login } from "../helpers";

test("profile form is labelled, saves, and keeps the change after a reload", async ({ page }) => {
  await login(page);
  await page.goto("/profile");
  await expectNoAppError(page);

  await expect(page.getByRole("heading", { level: 1, name: "Profile settings" })).toBeVisible();
  for (const label of ["Full name", "College", "Short bio", "Major", "Semester", "Study style", "Interests", "Availability"]) {
    await expect(page.getByLabel(label, { exact: true })).toBeVisible();
  }
  await expect(page.getByRole("checkbox", { name: /Available for matching/ })).toBeChecked();
  await expect(page.getByRole("progressbar", { name: "Progress to next level" })).toBeVisible();

  const bio = `Updated by the e2e run ${Date.now()}`;
  await page.getByLabel("Short bio").fill(bio);
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByText("Profile saved.")).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("Short bio")).toHaveValue(bio);
});

test("an empty name is refused with a readable message", async ({ page }) => {
  await login(page);
  await page.goto("/profile");
  const name = page.getByLabel("Full name");
  await name.fill("");
  // The field is required, so the browser stops the submit before the server is called.
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(name).toHaveJSProperty("validity.valueMissing", true);
  await expect(appAlert(page)).toHaveCount(0);
});

test("the photo drop zone rejects files that are not images, without uploading", async ({ page }) => {
  const external: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("ui-avatars.com")) external.push(request.url());
  });
  await login(page);
  await page.goto("/profile");

  const input = page.getByLabel("Profile photo");
  await input.setInputFiles({ name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("not an image") });
  await expect(page.getByText(/notes\.txt/).first()).toBeVisible();
  await expect(page.getByText(/JPG|PNG|WebP|image/i).first()).toBeVisible();
  expect(external).toEqual([]);
});

test("profile page fits a phone", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 375, height: 700 } });
  const page = await context.newPage();
  await login(page);
  await page.goto("/profile");
  await expect(page.getByRole("button", { name: "Save profile" })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await context.close();
});
