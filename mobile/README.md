# Zenvy mobile

The Zenvy app for Android and iOS, built with Flutter (one Dart codebase for both). It implements
the 28 screens from the [Zenvy App UI Screens](https://claude.ai/artifact/TCkicwMEuwNhpjPoM92v3M)
design canvas in the same Zenvy Brutal design system as the web app. It replaces the earlier Expo
(React Native) prototype.

## Run it

Needs the Flutter SDK (stable, 3.47 or newer).

```bash
cd mobile
flutter pub get
flutter run                 # on a connected phone or emulator, against https://zenvy-ten.vercel.app
flutter analyze
flutter test                # every route at two phone sizes + sign-in/chat/connect flows, against a fake backend
```

Release builds: `flutter build apk` / `flutter build appbundle` for Android, `flutter build ipa` for iOS
(needs a Mac with Xcode).

## Backend

The app talks to the Next.js app in the repository root over HTTPS. The base URL is
`ZENVY_API_URL` (default `https://zenvy-ten.vercel.app`, see `lib/api/config.dart`):

```bash
flutter run --dart-define=ZENVY_API_URL=http://10.0.2.2:3000     # Android emulator -> your machine
flutter run --dart-define=ZENVY_API_URL=http://localhost:3000    # iOS simulator
```

**The deployment must include `app/api/mobile/`.** Those routes were added for this app; until this
branch is deployed, sign-in fails against production.

- **Auth**: `POST /api/mobile/auth/login` (and `/register`) checks the password with the same
  rules and lockout as the web login and returns Auth.js session cookies (30 days). The app keeps
  them in `flutter_secure_storage` and sends them as a `Cookie` header, so every existing web API
  route works unchanged. `/api/mobile/auth/refresh` renews them; a 401 signs the app out. Login is
  rate limited to 5 attempts per IP per 15 minutes.
- **Data**: `/api/mobile/*` returns screen-shaped JSON (home, partners, person, inbox, groups,
  events, notifications, jobs, stats). Messages, focus sessions, profile photo and calls use the
  existing routes (`/api/conversations`, `/api/groups/messages`, `/api/channels/messages`,
  `/api/pomodoro-sessions`, `/api/calls/*`).
- **Realtime**: polling. Open threads refresh every 4 s, badges every 30 s, incoming calls every 5 s,
  and everything refreshes when the app returns to the foreground.
- **Calls**: LiveKit (`livekit_client`). The backend needs `LIVEKIT_URL`, `LIVEKIT_API_KEY` and
  `LIVEKIT_API_SECRET`.
- **Jobs**: shown only when the backend has `FEATURE_JOBS=true`.

### Local backend with demo data

```bash
# repository root, with DATABASE_URL and AUTH_SECRET in .env.local
npm run dev
npm run db:seed:dev   # six demo users: nadia@zenvy.dev, tanvir@, sadia@, mahin@, farhan@, rafia@ — password Zenvy-dev-1
```

The live API tests (skipped by default) sign in as the demo users and exercise the real endpoints:

```bash
ZENVY_LIVE_API=http://localhost:3000 flutter test test/live
```

`flutter run -d chrome` builds, but browsers do not let the app set a `Cookie` header, so the web
build cannot sign in. The app targets Android and iOS.

## What's here

| Flow | Routes (`lib/router.dart`) | Screens (`lib/screens/`) |
|---|---|---|
| Get started | `/welcome`, `/sign-up`, `/log-in`, `/forgot-password`, `/onboarding-about`, `/onboarding-style` | `auth/` |
| Tabs | `/home`, `/partners`, `/messages`, `/focus`, `/more` (custom floating tab bar) | `tabs/` |
| Home & focus | `/focus-done`, `/stats`, `/notifications` | `focus_done.dart`, `stats.dart`, `notifications.dart` |
| Partners | `/partner/:id`, `/matched/:id`, `/post-ad` | `partners/` |
| Messages & calls | `/dm/:userId`, `/group-room/:id`, `/channel/:id`, `/new-message`, `/call/incoming`, `/call/active` | `chat/`, `calls/` |
| Groups & events | `/groups`, `/groups/new`, `/groups/:id`, `/events`, `/events/new` | `groups/`, `events/` |
| Careers & you | `/jobs`, `/jobs/:id`, `/profile` | `jobs/`, `profile.dart` |

```
lib/
  main.dart     app entry, theme
  router.dart   go_router routes (tabs are a StatefulShellRoute)
  screens/      one file per screen
  widgets/      Surface (hard-shadow box), ZButton, ZIconButton, ZChip, Field, Segmented, Toggle,
                Screen, TopBar, chat bubbles and composer, search box and chip rail
  theme/        tokens.dart (palette, radii), type.dart (text styles), volume.dart (loud / quiet)
  api/          config (base URL), session (cookies in secure storage), client (HTTP), zenvy_api (typed endpoints)
  data/         models.dart: API response models
  state/        app_state.dart: session, signed-in user, unread badges, polling
  util/         focus timer, validation, dialogs
google_fonts/   Space Grotesk and JetBrains Mono, bundled so the app never fetches fonts at runtime
```

Packages: `go_router` (navigation), `google_fonts` (bundled fonts), `lucide_icons_flutter` (the same
icon set as the web app), `http`, `flutter_secure_storage`, `image_picker`, `url_launcher`, `livekit_client`. State is a plain `ChangeNotifier` exposed through an `InheritedNotifier`
(`AppScope.of(context)`), so there is no state-management dependency.

## Design system

`lib/theme/tokens.dart` mirrors `app/globals.css` and `components/ui/tokens.ts` in the web app:
one meaning per accent (match pink = people, chat blue = messages, focus yellow = timers,
live green = calls and success, alert = leave and errors, career purple = jobs), ink text on
every accent, 3px edges with hard offset shadows. Focus, calls and chat threads render in the
**quiet** volume (`Screen(volume: Volume.quiet)`): 2px edges, softer shadows, warmer ground.

Every control is at least 44pt tall and has a semantics label.

## Not done yet

- Push notifications (needs FCM/APNs keys); notifications appear in-app only.
- Live typing indicators and presence (the web app's Socket.IO server); threads poll instead.
- Chat attachments and focus sounds.
- Google sign-in (needs a native OAuth client); email and password only.
- App icons: `assets/icon.png` is the Zenvy icon; generate launcher icons with `flutter_launcher_icons`.
