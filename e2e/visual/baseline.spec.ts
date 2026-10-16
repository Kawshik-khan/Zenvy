import { test } from "@playwright/test";
import { login } from "../helpers";

// Captures full-page screenshots of every main route as the "before" baseline for the
// redesign. Images are written to test-results/ and uploaded as a CI artifact; they are
// not compared automatically.

const PUBLIC_ROUTES = ["/", "/login", "/register", "/ui"];
const APP_ROUTES = [
  "/dashboard",
  "/matching",
  "/chat",
  "/groups",
  "/channels",
  "/events",
  "/scheduling",
  "/notifications",
  "/bookmarks",
  "/stats",
  "/profile",
];

function fileName(route: string) {
  return route === "/" ? "landing" : route.slice(1).replace(/\//g, "-");
}

for (const route of PUBLIC_ROUTES) {
  test(`baseline ${route}`, async ({ page }, testInfo) => {
    await page.goto(route);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.screenshot({ path: testInfo.outputPath(`${fileName(route)}.png`), fullPage: true });
  });
}

test("baseline signed-in routes", async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  await login(page);
  for (const route of APP_ROUTES) {
    await page.goto(route);
    await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
    await page.screenshot({ path: testInfo.outputPath(`${fileName(route)}.png`), fullPage: true });
  }
});
