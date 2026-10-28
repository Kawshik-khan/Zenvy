// Renders the app icon variants from icon.html to mobile/assets/icon/ with Playwright.
// Usage: node scripts/app-icon/render.js
// Then, in mobile/: dart run flutter_launcher_icons
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const OUT_DIR = path.join(__dirname, "..", "..", "mobile", "assets", "icon");
const VARIANTS = ["full", "foreground", "monochrome"];

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  // Fall back to the system Edge when Playwright's bundled browser isn't installed.
  const browser = await chromium.launch().catch(() => chromium.launch({ channel: "msedge" }));
  const page = await browser.newPage({ viewport: { width: 1024, height: 1024 } });
  for (const variant of VARIANTS) {
    await page.goto("file://" + path.join(__dirname, "icon.html").replace(/\\/g, "/") + `?variant=${variant}`);
    await page.evaluate(() => window.ready);
    const out = path.join(OUT_DIR, `icon-${variant}.png`);
    // Only the full icon is opaque; iOS rejects icons with an alpha channel.
    await page.screenshot({ path: out, omitBackground: variant !== "full" });
    console.log(out);
  }
  await browser.close();
})();
