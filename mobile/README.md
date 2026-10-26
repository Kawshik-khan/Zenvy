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
flutter run                 # on a connected phone or emulator
flutter run -d chrome       # same app in the browser
flutter analyze
flutter test                # opens every route at 390x844 and 360x640 and fails on overflow or errors
```

Release builds: `flutter build apk` / `flutter build appbundle` for Android, `flutter build ipa` for iOS
(needs a Mac with Xcode).

## What's here

| Flow | Routes (`lib/router.dart`) | Screens (`lib/screens/`) |
|---|---|---|
| Get started | `/welcome`, `/sign-up`, `/log-in`, `/verify`, `/onboarding-about`, `/onboarding-style` | `auth/` |
| Tabs | `/home`, `/partners`, `/messages`, `/focus`, `/more` (custom floating tab bar) | `tabs/` |
| Home & focus | `/focus-done`, `/stats`, `/notifications` | `focus_done.dart`, `stats.dart`, `notifications.dart` |
| Partners | `/partner/:id`, `/matched/:id`, `/post-ad` | `partners/` |
| Messages & calls | `/dm/:id`, `/group-room/:id`, `/call/incoming`, `/call/active` | `chat/`, `calls/` |
| Groups & events | `/groups`, `/groups/:id`, `/events`, `/events/new` | `groups/`, `events/` |
| Careers & you | `/jobs`, `/jobs/:id`, `/profile` | `jobs/`, `profile.dart` |

```
lib/
  main.dart     app entry, theme
  router.dart   go_router routes (tabs are a StatefulShellRoute)
  screens/      one file per screen
  widgets/      Surface (hard-shadow box), ZButton, ZIconButton, ZChip, Field, Segmented, Toggle,
                Screen, TopBar, chat bubbles and composer, search box and chip rail
  theme/        tokens.dart (palette, radii), type.dart (text styles), volume.dart (loud / quiet)
  data/         models.dart and sample.dart (fictional sample content)
  state/        app_state.dart: in-memory state for connections, RSVPs, saved jobs, messages, profile
  util/         focus timer, validation, dialogs
google_fonts/   Space Grotesk and JetBrains Mono, bundled so the app never fetches fonts at runtime
```

Packages: `go_router` (navigation), `google_fonts` (bundled fonts), `lucide_icons_flutter` (the same
icon set as the web app). State is a plain `ChangeNotifier` exposed through an `InheritedNotifier`
(`AppScope.of(context)`), so there is no state-management dependency.

## Design system

`lib/theme/tokens.dart` mirrors `app/globals.css` and `components/ui/tokens.ts` in the web app:
one meaning per accent (match pink = people, chat blue = messages, focus yellow = timers,
live green = calls and success, alert = leave and errors, career purple = jobs), ink text on
every accent, 3px edges with hard offset shadows. Focus, calls and chat threads render in the
**quiet** volume (`Screen(volume: Volume.quiet)`): 2px edges, softer shadows, warmer ground.

Every control is at least 44pt tall and has a semantics label.

## Not wired yet

The app runs on sample data (`lib/data/sample.dart`) and in-memory state. To connect it to the
web backend:

- **Auth**: Auth.js uses cookie sessions; the app needs a token flow (for example a mobile
  sign-in endpoint returning a bearer token stored with `flutter_secure_storage`).
- **Data**: replace the `AppState` methods and `sample.dart` reads with calls to the existing
  API routes (`/api/matching`, `/api/conversations`, `/api/groups/messages`, `/api/pomodoro-sessions`, …).
- **Realtime**: `socket_io_client` for messages and presence; the LiveKit Flutter SDK
  (`livekit_client`) with `/api/livekit-token` for calls.
- **Device features**: `image_picker` (profile photo), `file_picker` (chat attachments),
  `just_audio` (focus sounds from `public/audio`), push notifications.
- **App icons**: `assets/icon.png` is the Zenvy icon; generate launcher icons from it with
  `flutter_launcher_icons`.
