import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:zenvy/main.dart';
import 'package:zenvy/router.dart';

import 'fake_backend.dart';

String id(String fixtureName, String key) => fixture(fixtureName)[key]['id'] as String;

List<String> signedInRoutes() {
  final tanvir = id('person_tanvir', 'person');
  final sadia = id('person_sadia', 'person');
  final group = id('group', 'group');
  final job = id('job', 'job');
  final channel = (fixture('inbox')['channels'] as List).first['id'] as String;
  return [
    '/home',
    '/partners',
    '/messages',
    '/focus',
    '/more',
    '/onboarding-about',
    '/onboarding-style',
    '/focus-done?minutes=25',
    '/stats',
    '/today',
    '/recap',
    '/notifications',
    '/partner/$tanvir',
    '/partner/$sadia',
    '/matched/$tanvir',
    '/post-ad',
    '/new-message',
    '/dm/$tanvir',
    '/group-room/$group',
    '/channel/$channel?name=cse-bracu',
    '/call/incoming?callId=call1&callerId=$tanvir&name=Tanvir%20Ahmed&video=1',
    '/call/active?groupId=$group&title=Algorithms%20Circle',
    '/groups',
    '/groups/new',
    '/groups/$group',
    '/events',
    '/events/new',
    '/jobs',
    '/jobs?tab=saved',
    '/jobs/$job',
    '/profile',
  ];
}

const signedOutRoutes = ['/welcome', '/sign-up', '/log-in', '/forgot-password'];

Future<void> pumpRoute(WidgetTester tester, {required bool signedIn, required String route, required Size size}) async {
  tester.view.physicalSize = size * 3;
  tester.view.devicePixelRatio = 3;
  addTearDown(tester.view.reset);

  final backend = FakeBackend();
  final app = backend.appState(signedIn: signedIn);
  final router = buildRouter(app);
  await app.bootstrap();
  await tester.pumpWidget(ZenvyApp(state: app, router: router));
  router.go(route);
  for (var i = 0; i < 6; i++) {
    await tester.pump(const Duration(milliseconds: 100));
  }

  // Layout overflows and build errors surface here.
  expect(tester.takeException(), isNull);
  // Every fixture parsed: no screen fell back to its error state.
  expect(find.text("Couldn't load this"), findsNothing);
  expect(router.state.uri.toString(), route, reason: 'stayed on the requested route');

  // Dispose screens (cancelling their timers) before the test ends.
  await tester.pumpWidget(const SizedBox());
  app.dispose();
}

void main() {
  GoogleFonts.config.allowRuntimeFetching = false;

  for (final size in const [Size(390, 844), Size(360, 640)]) {
    final label = '${size.width.toInt()}x${size.height.toInt()}';
    for (final route in signedInRoutes()) {
      testWidgets('$route renders at $label', (tester) => pumpRoute(tester, signedIn: true, route: route, size: size));
    }
    for (final route in signedOutRoutes) {
      testWidgets('$route renders signed out at $label', (tester) => pumpRoute(tester, signedIn: false, route: route, size: size));
    }
  }
}
