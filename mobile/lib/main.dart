import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'router.dart';
import 'state/app_state.dart';
import 'theme/tokens.dart';
import 'theme/type.dart';

void main() {
  // Fonts ship in google_fonts/, so the app never downloads them at runtime.
  GoogleFonts.config.allowRuntimeFetching = false;
  runApp(ZenvyApp(state: AppState()));
}

class ZenvyApp extends StatelessWidget {
  const ZenvyApp({super.key, required this.state});

  final AppState state;

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
