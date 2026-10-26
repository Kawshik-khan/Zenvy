import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:zenvy/main.dart';
import 'package:zenvy/router.dart';
import 'package:zenvy/state/app_state.dart';

const routes = [
  '/welcome',
  '/sign-up',
  '/log-in',
  '/verify?email=nadia@g.bracu.ac.bd',
  '/onboarding-about',
  '/onboarding-style',
  '/home',
  '/partners',
  '/messages',
  '/focus',
  '/more',
  '/focus-done?minutes=25',
  '/stats',
  '/notifications',
  '/partner/tanvir',
  '/matched/tanvir',
  '/post-ad',
  '/dm/tanvir',
  '/group-room/ac',
  '/call/incoming?id=tanvir',
  '/call/active?title=Algorithms%20Circle',
  '/groups',
  '/groups/ac',
  '/events',
  '/events/new',
  '/jobs',
  '/jobs?tab=saved',
  '/jobs/kl-frontend',
  '/profile',
];

void main() {
  GoogleFonts.config.allowRuntimeFetching = false;

  for (final size in const [Size(390, 844), Size(360, 640)]) {
    for (final route in routes) {
      testWidgets('$route renders at ${size.width.toInt()}x${size.height.toInt()}', (tester) async {
        tester.view.physicalSize = size * 3;
        tester.view.devicePixelRatio = 3;
        addTearDown(tester.view.reset);

        await tester.pumpWidget(ZenvyApp(state: AppState()));
        router.go(route);
        await tester.pump();
        await tester.pump(const Duration(milliseconds: 600));

        // Layout overflows and build errors surface here.
        expect(tester.takeException(), isNull);
        // Stop periodic timers (calls, verify countdown) before the test ends.
        await tester.pumpWidget(const SizedBox());
      });
    }
  }
}
