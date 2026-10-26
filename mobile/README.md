# Zenvy mobile

The Zenvy app for iOS and Android, built with Expo (SDK 58) and Expo Router. It implements
the 28 screens from the [Zenvy App UI Screens](https://claude.ai/artifact/TCkicwMEuwNhpjPoM92v3M)
design canvas in the same Zenvy Brutal design system as the web app.

## Run it

```bash
cd mobile
npm install
cp .env.example .env   # set EXPO_PUBLIC_API_URL to your Zenvy site; leave it empty for demo mode
npm start
npm run typecheck
```

With `EXPO_PUBLIC_API_URL` set, the app signs in against the real backend. Without it the app
runs in **demo mode** on sample data, which works in Expo Go.

Calls use LiveKit's native WebRTC module, so the live app needs a **development build or APK**
(Expo Go can't load it):

```bash
npx eas-cli@latest login
npx eas-cli@latest build -p android --profile preview      # installable APK
npx eas-cli@latest build -p android --profile development  # dev client for `npm start`
```

Set `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_SOCKET_URL` as EAS environment variables (or in
`.env`) before building; they are baked into the bundle at build time.

## What's here

| Flow | Routes (`src/app/`) |
|---|---|
| Get started | `(auth)/welcome`, `sign-up`, `log-in`, `verify`, `onboarding-about`, `onboarding-style` |
| Tabs | `(tabs)/home`, `partners`, `messages`, `focus`, `more` (custom floating tab bar) |
| Home & focus | `focus-done`, `stats`, `notifications` |
| Partners | `partner/[id]`, `matched/[id]`, `post-ad` |
| Messages & calls | `chat/[id]` and `call/live` (live mode); `dm/[id]`, `group-room/[id]`, `call/active` (demo); `call/incoming` (both) |
| Groups & events | `groups/index`, `groups/[id]`, `events/index`, `events/new` |
| Careers & you | `jobs/index`, `jobs/[id]`, `profile` |

```
src/
  app/          routes (every file is a screen)
  components/   Surface (hard-shadow box), Button, IconButton, Chip, Field, Segmented, Toggle, Screen, TopBar, chat parts
  theme/        tokens.ts (palette, radii, fonts) and volume.tsx (loud / quiet)
  data/         types.ts and sample.ts (fictional sample content)
  api/          backend URL, fetch client with bearer token, secure token storage, response types
  auth/         AuthProvider (session) and AuthGate (signed-in / signed-out routing)
  realtime/     SocketProvider: one Socket.io connection per session
  chat/         conversation list, conversation and unread-count hooks
  calls/        CallProvider (start, ring, accept, decline, leave) and the LiveKit call view
  state/        AppState.tsx: in-memory state for the sample-data screens
  lib/          focus timer, validation, cross-platform dialogs
```

## Design system

`src/theme/tokens.ts` mirrors `app/globals.css` and `components/ui/tokens.ts` in the web app:
one meaning per accent (match pink = people, chat blue = messages, focus yellow = timers,
live green = calls and success, alert = leave and errors, career purple = jobs), ink text on
every accent, 3px edges with hard offset shadows. Focus, calls and chat threads render in the
**quiet** volume (`<Screen volume="quiet">`): 2px edges, softer shadows, warmer ground.

Every control is at least 44pt tall and has an accessibility role and label.

## Connected to the backend

| Feature | How |
|---|---|
| Log in / sign up / log out | `POST /api/mobile/auth/login` and `/register` return a 30-day bearer token, stored in the Keychain / Keystore (`expo-secure-store`). Same password rules, 5-strike lockout and rate limit as the website. `GET /api/mobile/auth/me` checks the token on launch; any 401 signs out. |
| Direct messages | Conversation list and history from `/api/conversations`. Messages, typing and read receipts go over the same Socket.io server as the website (token from `/api/socket-token`); sending falls back to REST when the socket is down. |
| Voice and video calls | `/api/calls/start`, `join`, `leave`, `decline` plus socket ringing (`call:start` → `call:incoming`, `call:state`, `call:declined`). Media through LiveKit (`@livekit/react-native`). Unanswered calls stop ringing after 45 seconds. |

The web app's API routes accept either the browser session cookie or the app's
`Authorization: Bearer` token (`lib/request-user.ts`), so both clients share one backend.

## Still sample data

Home, partners, groups and channels, events, jobs, stats and profile editing still use
`src/data/sample.ts`. Group and channel rooms use different tables (`GroupMessage`,
`ChannelMessage`) from direct messages and need their own endpoints. Also not connected:
Google sign-in (needs a browser OAuth flow), photo upload, chat attachments, focus sounds and
push notifications.
