import { test as setup } from "@playwright/test";
import { loginWithForm, STUDENT_STATE } from "./helpers";

// Signs in once per run and saves the session for every other test.
setup("sign in the e2e student", async ({ page }) => {
  await page.goto("/login");
  await loginWithForm(page);
  await page.context().storageState({ path: STUDENT_STATE });
});
