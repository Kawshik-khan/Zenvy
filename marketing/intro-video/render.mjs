// Renders scene.html to an MP4: screenshots every frame with Playwright,
// builds the soundtrack with make_audio.py and muxes both with ffmpeg.
//
//   node marketing/intro-video/render.mjs [out.mp4]
//
// Needs: playwright (with Chromium), ffmpeg, python3 with numpy + scipy.
import { spawn, execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(process.argv[2] || join(here, "out", "zenvy-intro.mp4"));
const work = mkdtempSync(join(tmpdir(), "zenvy-intro-"));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on("pageerror", (e) => { throw e; });
await page.goto("file://" + join(here, "scene.html") + "?render");
await page.evaluate(() => document.fonts.ready);
const { dur, fps, cues } = await page.evaluate(() => ({ dur: window.DUR, fps: window.FPS, cues: window.CUES }));

const cuesPath = join(work, "cues.json");
const wavPath = join(work, "mix.wav");
writeFileSync(cuesPath, JSON.stringify(cues));
console.log(`soundtrack: ${cues.length} sound cues`);
execFileSync("python3", [join(here, "make_audio.py"), cuesPath, join(here, "assets", "voiceover.mp3"), wavPath, String(dur)], { stdio: "inherit" });

execFileSync("mkdir", ["-p", dirname(out)]);
const ff = spawn("ffmpeg", [
  "-y", "-v", "error",
  "-f", "image2pipe", "-framerate", String(fps), "-c:v", "png", "-i", "-",
  "-i", wavPath,
  "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p",
  "-af", "alimiter=limit=0.8:attack=2:release=40:level=0", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart",
  out,
], { stdio: ["pipe", "inherit", "inherit"] });
const done = new Promise((ok, fail) => ff.on("close", (c) => (c === 0 ? ok() : fail(new Error("ffmpeg exited " + c)))));

const frames = Math.round(dur * fps);
for (let f = 0; f < frames; f++) {
  await page.evaluate((t) => window.seek(t), f / fps);
  const png = await page.screenshot({ type: "png" });
  if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once("drain", r));
  if (f % 60 === 0) console.log(`frame ${f}/${frames}`);
}
ff.stdin.end();
await done;
await browser.close();
rmSync(work, { recursive: true, force: true });
console.log("wrote " + out);
