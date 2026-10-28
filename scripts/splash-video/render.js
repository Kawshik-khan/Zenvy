// Renders an animation page frame-by-frame with Playwright and encodes it with ffmpeg.
// Usage: node scripts/splash-video/render.js [name] [palette]
//   name: page in this folder without ".html" (default "splash"); output is public/brand/zenvy-<name>.mp4/.webm
//   palette: passed to the page as ?palette=<palette>; output becomes zenvy-<name>-<palette>.mp4/.webm
//   FFMPEG env var points at an ffmpeg binary (default: "ffmpeg" on PATH).
// Each page exposes window.ready, window.render(t) and optionally window.DURATION (seconds, default 2).
const { chromium } = require("playwright");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const FPS = 60;
const OUT_DIR = path.join(__dirname, "..", "..", "public", "brand");
const name = process.argv[2] || "splash";
const palette = process.argv[3];
const outName = palette ? `${name}-${palette}` : name;
const ffmpeg = process.env.FFMPEG || "ffmpeg";

function encode(args) {
  const proc = spawn(ffmpeg, ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-", ...args], {
    stdio: ["pipe", "inherit", "inherit"],
  });
  const done = new Promise((res, rej) => proc.on("close", (code) => (code === 0 ? res() : rej(new Error(`ffmpeg exited ${code}`)))));
  return { stdin: proc.stdin, done };
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  // Fall back to the system Edge when Playwright's bundled browser isn't installed.
  const browser = await chromium.launch().catch(() => chromium.launch({ channel: "msedge" }));
  const page = await browser.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 });
  const query = palette ? `?palette=${encodeURIComponent(palette)}` : "";
  await page.goto("file://" + path.join(__dirname, `${name}.html`).replace(/\\/g, "/") + query);
  await page.evaluate(() => window.ready);
  const duration = await page.evaluate(() => window.DURATION || 2);

  const out = path.join(OUT_DIR, `zenvy-${outName}`);
  const mp4 = encode(["-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "16", "-preset", "slow", "-movflags", "+faststart", `${out}.mp4`]);
  const webm = encode(["-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "28", "-pix_fmt", "yuv420p", `${out}.webm`]);

  const frames = Math.round(FPS * duration);
  for (let i = 0; i <= frames; i++) {
    await page.evaluate((t) => window.render(t), i / FPS);
    const png = await page.screenshot({ type: "png" });
    mp4.stdin.write(png);
    webm.stdin.write(png);
    if (process.env.PREVIEW_DIR && i % 10 === 0) {
      fs.writeFileSync(path.join(process.env.PREVIEW_DIR, `${outName}-${i}.png`), png);
    }
  }
  mp4.stdin.end();
  webm.stdin.end();
  await Promise.all([mp4.done, webm.done]);
  await browser.close();
  console.log(`Wrote ${frames + 1} frames to ${out}.mp4/.webm`);
})();
