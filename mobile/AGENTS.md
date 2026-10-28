This is the Zenvy Flutter app (Android and iOS from one Dart codebase). It is separate from the
Next.js web app in the repository root: none of the web tooling (eslint, tsc, vitest) runs here.

## Commands

```bash
flutter pub add <package>   # add dependencies this way so pubspec.lock stays in sync
flutter analyze             # must report no issues
flutter test                # routes at two phone sizes + flows, against test/fake_backend.dart
ZENVY_LIVE_API=http://localhost:3000 flutter test test/live   # optional, against `npm run dev` + `npm run db:seed:dev`
dart format -l 160 lib test
```

Run analyze and test before declaring any task done.

## Conventions

- Routes live in `lib/router.dart`; screens in `lib/screens/`, one per file. Navigate with
  `context.push` / `context.go` from go_router; use `goBack(context, fallback)` for back buttons so
  deep links still land somewhere. Add every new route to `test/routes_test.dart`.
- Build screens from `lib/widgets/` (`Screen`, `Surface`, `ZButton`, `ZText`, …) and colours from
  `Palette` / `Tone` in `lib/theme/tokens.dart`. Do not hard-code new colours or use Material
  buttons and cards; the look is Zenvy Brutal, matching the web app.
- Read app state with `AppScope.of(context)` in `build`, `AppScope.read(context)` in callbacks.
- Fonts are bundled in `google_fonts/` and runtime fetching is off. A new weight needs its TTF there.
- Avoid `IntrinsicHeight`/`IntrinsicWidth` around `ZButton`: it uses a `LayoutBuilder`.
- Never hand-edit generated files under `android/`, `ios/` or `web/` beyond app metadata (name,
  permissions); prefer packages and `pubspec.yaml`.
- All server access goes through `ZenvyApi` (`lib/api/zenvy_api.dart`); screens never build URLs.
  Prefer existing web API routes; add an `app/api/mobile/` route only for screen-shaped data, and
  keep business rules in `lib/` on the server so web and mobile share them.
- Load screen data with `Loader<T>` (`lib/widgets/async.dart`); it handles loading/error/retry and
  reloads when `AppState.touch()` bumps `revision`. Wrap mutations in `attempt(context, ...)`.
- Models in `lib/data/models.dart` parse the API JSON; update `test/fixtures/` when a response
  changes (capture them from a local backend) and keep the fake backend in `test/fake_backend.dart`
  in step. Construct `AppState(poll: false)` in tests.
