# Zenvy mobile

The Zenvy app for iOS and Android, built with Expo (SDK 58) and Expo Router. It implements
the 28 screens from the [Zenvy App UI Screens](https://claude.ai/artifact/TCkicwMEuwNhpjPoM92v3M)
design canvas in the same Zenvy Brutal design system as the web app.

## Run it

```bash
cd mobile
npm install
npm start          # scan the QR code with Expo Go, or press i / a for a simulator
npm run web        # same app in the browser at phone width
npm run typecheck
```

Everything here uses modules bundled in Expo Go, so no development build is needed yet.

## What's here

| Flow | Routes (`src/app/`) |
|---|---|
| Get started | `(auth)/welcome`, `sign-up`, `log-in`, `verify`, `onboarding-about`, `onboarding-style` |
| Tabs | `(tabs)/home`, `partners`, `messages`, `focus`, `more` (custom floating tab bar) |
| Home & focus | `focus-done`, `stats`, `notifications` |
| Partners | `partner/[id]`, `matched/[id]`, `post-ad` |
| Messages & calls | `dm/[id]`, `group-room/[id]`, `call/incoming`, `call/active` |
| Groups & events | `groups/index`, `groups/[id]`, `events/index`, `events/new` |
| Careers & you | `jobs/index`, `jobs/[id]`, `profile` |

```
src/
  app/          routes (every file is a screen)
  components/   Surface (hard-shadow box), Button, IconButton, Chip, Field, Segmented, Toggle, Screen, TopBar, chat parts
  theme/        tokens.ts (palette, radii, fonts) and volume.tsx (loud / quiet)
  data/         types.ts and sample.ts (fictional sample content)
  state/        AppState.tsx: in-memory state for connections, RSVPs, saved jobs, messages, profile
  lib/          focus timer, validation, cross-platform dialogs
```

## Design system

`src/theme/tokens.ts` mirrors `app/globals.css` and `components/ui/tokens.ts` in the web app:
one meaning per accent (match pink = people, chat blue = messages, focus yellow = timers,
live green = calls and success, alert = leave and errors, career purple = jobs), ink text on
every accent, 3px edges with hard offset shadows. Focus, calls and chat threads render in the
**quiet** volume (`<Screen volume="quiet">`): 2px edges, softer shadows, warmer ground.

Every control is at least 44pt tall and has an accessibility role and label.

## Not wired yet

The app runs on sample data (`src/data/sample.ts`) and in-memory state. To connect it to the
web backend:

- **Auth**: Auth.js uses cookie sessions; the app needs a token flow (for example a mobile
  sign-in endpoint returning a bearer token stored with `expo-secure-store`).
- **Data**: replace the `AppState` setters and `sample.ts` reads with calls to the existing
  API routes (`/api/matching`, `/api/conversations`, `/api/groups/messages`, `/api/pomodoro-sessions`, …).
- **Realtime**: Socket.io client for messages and presence; LiveKit (`/api/livekit-token`)
  for calls, which needs a development build.
- **Media**: `expo-image-picker` for profile photos, `expo-document-picker` for chat
  attachments, `expo-audio` for focus sounds, `expo-notifications` for push.

Buttons for these features show a short "not connected yet" notice instead of doing nothing.
