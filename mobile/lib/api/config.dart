/// Where the app finds the Zenvy backend (the Next.js app).
///
/// Production by default. Point it elsewhere at build time, for example a local server:
/// `flutter run --dart-define=ZENVY_API_URL=http://10.0.2.2:3000` (Android emulator) or
/// `--dart-define=ZENVY_API_URL=http://localhost:3000` (iOS simulator, web).
const String kApiBaseUrl = String.fromEnvironment('ZENVY_API_URL', defaultValue: 'https://zenvy-ten.vercel.app');
