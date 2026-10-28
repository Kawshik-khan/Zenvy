// Renders the Play Store listing graphics to mobile/store/ with Playwright.
// Usage: node scripts/app-icon/store.js
//   play-icon-512.png        hi-res app icon (Play applies its own rounded mask)
//   feature-graphic-1024x500.png
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const OUT_DIR = path.join(__dirname, "..", "..", "mobile", "store");
const pageUrl = (file, query = "") => "file://" + path.join(__dirname, file).replace(/\\/g, "/") + query;

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  // Fall back to the system Edge when Playwright's bundled browser isn't installed.
  const browser = await chromium.launch().catch(() => chromium.launch({ channel: "msedge" }));

  // The 1024px icon page at half scale gives a crisp 512px render.
  const icon = await browser.newPage({ viewport: { width: 1024, height: 1024 }, deviceScaleFactor: 0.5 });
  await icon.goto(pageUrl("icon.html", "?variant=full"));
  await icon.evaluate(() => window.ready);
  await icon.screenshot({ path: path.join(OUT_DIR, "play-icon-512.png") });

  const feature = await browser.newPage({ viewport: { width: 1024, height: 500 } });
  await feature.goto(pageUrl("feature.html"));
  await feature.evaluate(() => window.ready);
  await feature.screenshot({ path: path.join(OUT_DIR, "feature-graphic-1024x500.png") });

  await browser.close();
  console.log(OUT_DIR);
})();
