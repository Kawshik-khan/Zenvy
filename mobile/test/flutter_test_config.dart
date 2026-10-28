import 'package:flutter/widgets.dart';

import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:zenvy/theme/type.dart';

/// Loads the bundled fonts before any test, so layouts are measured with the real glyphs.
Future<void> testExecutable(FutureOr<void> Function() testMain) async {
  TestWidgetsFlutterBinding.ensureInitialized();
  GoogleFonts.config.allowRuntimeFetching = false;
  for (final v in TextVariant.values) {
    variantStyle(v);
  }
  grotesk(FontWeight.w500, 16, 22);
  grotesk(FontWeight.w600, 16, 22);
  mono(FontWeight.w500, 12, 16);
  await GoogleFonts.pendingFonts();
  await testMain();
}
