# Zenvy intro video

A 26-second, 1920×1080 intro, "From alone to together", built from code so it
stays on brand (colors and fonts mirror `app/globals.css` / `app/layout.tsx`).

- `scene.html`: the animation. Every frame is a pure function of time
  (`window.seek(t)`), timed to the voiceover. Open it in a browser and click
  to preview with sound.
- `assets/voiceover.mp3`: ElevenLabs voiceover the scenes are synced to.
- `make_audio.py`: synthesizes the lo-fi music bed and sound effects (at the
  cue times exported from `scene.html`) and mixes them under the voice.
- `render.mjs`: renders the final MP4.
- `zenvy-intro.mp4`: the rendered video.

## Re-render

```sh
pip install numpy scipy
node marketing/intro-video/render.mjs            # -> marketing/intro-video/out/zenvy-intro.mp4
```

Needs Playwright with Chromium and ffmpeg (libx264). Rendering takes ~1.5 min.

## Timeline

| Time | Voiceover | Scene |
|---|---|---|
| 0.0–4.4 | Late nights. Same desk. Studying alone. | Close-up of a tired student at 2 AM; "Studying alone?" types in |
| 4.4–9.0 | Thousands of students… alone. | Pull back to a grid of lonely desks; "ALONE." stamp |
| 9.0–12.1 | Zenvy finds the people who study like you. | Two desks light up in color; 92% match badge, shared tags |
| 12.1–16.0 | Chat. Call. Study together — live. | Chat bubbles → video call window → LIVE badge |
| 16.0–20.2 | Stay focused. Build your streak. Never study alone again. | Focus timer, 3 → 7 → 30 day streak, connected Study Lounge |
| 20.2–21.6 | Zenvy. | Lounge collapses into the Z-E-N-V-Y logo slam |
| 22.0–26.0 | Find your study people. Join free. | Tagline, "Join free" button click, confetti |
