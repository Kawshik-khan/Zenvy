import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import 'api/client.dart';
import 'api/config.dart';
import 'api/session.dart';
import 'api/zenvy_api.dart';
import 'router.dart';
import 'state/app_state.dart';
import 'theme/tokens.dart';
import 'theme/type.dart';

void main() {
  // Fonts ship in google_fonts/, so the app never downloads them at runtime.
  GoogleFonts.config.allowRuntimeFetching = false;
  WidgetsFlutterBinding.ensureInitialized();
  final app = AppState(
    api: ZenvyApi(ApiClient(baseUrl: kApiBaseUrl)),
    sessions: SecureSessionStore(),
  );
  final router = buildRouter(app);
  wireIncomingCalls(app, router);
  app.bootstrap();
  runApp(ZenvyApp(state: app, router: router));
}

class ZenvyApp extends StatelessWidget {
  const ZenvyApp({super.key, required this.state, required this.router});

  final AppState state;
  final GoRouter router;

  @override
  Widget build(BuildContext context) {
    return AppScope(
      state: state,
      child: MaterialApp.router(
        title: 'Zenvy',
        debugShowCheckedModeBanner: false,
        routerConfig: router,
        theme: ThemeData(
          useMaterial3: true,
          scaffoldBackgroundColor: Palette.paper,
          colorScheme: ColorScheme.fromSeed(seedColor: Palette.chat, surface: Palette.paper),
          textTheme: TextTheme(bodyMedium: variantStyle(TextVariant.body).copyWith(color: Palette.ink)),
          textSelectionTheme: const TextSelectionThemeData(cursorColor: Palette.ink, selectionColor: Color(0x664D96FF), selectionHandleColor: Palette.chat),
          pageTransitionsTheme: const PageTransitionsTheme(
            builders: {TargetPlatform.android: CupertinoPageTransitionsBuilder(), TargetPlatform.iOS: CupertinoPageTransitionsBuilder()},
          ),
        ),
      ),
    );
  }
}
