import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import 'package:zenvy/main.dart';
import 'package:zenvy/router.dart';
import 'package:zenvy/state/app_state.dart';

import 'fake_backend.dart';

class Harness {
  Harness(this.backend, this.app, this.router);
  final FakeBackend backend;
  final AppState app;
  final GoRouter router;

  String get location => router.state.uri.toString();
}

Future<Harness> start(WidgetTester tester, {bool signedIn = true, String? route, FakeBackend? backend}) async {
  tester.view.physicalSize = const Size(390, 844) * 3;
  tester.view.devicePixelRatio = 3;
  addTearDown(tester.view.reset);
  final b = backend ?? FakeBackend();
  final app = b.appState(signedIn: signedIn);
  final router = buildRouter(app);
  await app.bootstrap();
  await tester.pumpWidget(ZenvyApp(state: app, router: router));
  if (route != null) router.go(route);
  await settle(tester);
  addTearDown(() async {
    await tester.pumpWidget(const SizedBox());
    app.dispose();
  });
  return Harness(b, app, router);
}

Future<void> settle(WidgetTester tester) async {
  for (var i = 0; i < 6; i++) {
    await tester.pump(const Duration(milliseconds: 100));
  }
}

void main() {
  GoogleFonts.config.allowRuntimeFetching = false;

  testWidgets('a saved session opens straight to Home with real data', (tester) async {
    final h = await start(tester);
    expect(h.location, '/home');
    expect(find.text("Today's focus".toUpperCase()), findsOneWidget);
    expect(find.text('Algorithms Circle'), findsWidgets);
    expect(h.backend.sentTo('GET', '/api/mobile/me'), isTrue);
    expect(h.backend.sentTo('GET', '/api/mobile/home'), isTrue);
  });

  testWidgets('signed out, the app starts on Welcome and protects other routes', (tester) async {
    final h = await start(tester, signedIn: false);
    expect(h.location, '/welcome');
    h.router.go('/messages');
    await settle(tester);
    expect(h.location, '/welcome');
  });

  testWidgets('logging in posts the credentials and lands on Home', (tester) async {
    final h = await start(tester, signedIn: false, route: '/log-in');
    await tester.enterText(find.byType(TextField).at(0), 'nadia@zenvy.dev');
    await tester.enterText(find.byType(TextField).at(1), 'Zenvy-dev-1');
    await tester.tap(find.text('Log in'));
    await settle(tester);

    final login = h.backend.sent.firstWhere((s) => s.path == '/api/mobile/auth/login');
    expect(login.body, {'email': 'nadia@zenvy.dev', 'password': 'Zenvy-dev-1'});
    expect(h.app.status, AuthStatus.signedIn);
    expect(h.location, '/home');
  });

  testWidgets('a wrong password shows the error and stays on log in', (tester) async {
    final backend = FakeBackend()..overrides['POST /api/mobile/auth/login'] = (_) => {'__status': 401, 'error': 'Invalid credentials.'};
    final h = await start(tester, signedIn: false, route: '/log-in', backend: backend);
    await tester.enterText(find.byType(TextField).at(0), 'nadia@zenvy.dev');
    await tester.enterText(find.byType(TextField).at(1), 'wrong');
    await tester.tap(find.text('Log in'));
    await settle(tester);
    expect(find.textContaining("don't match"), findsOneWidget);
    expect(h.location, '/log-in');
  });

  testWidgets('sign-up shows the server\'s field errors', (tester) async {
    final backend = FakeBackend()
      ..overrides['POST /api/mobile/auth/register'] = (_) => {
        '__status': 400,
        'error': 'Check the highlighted fields.',
        'fieldErrors': {'email': 'An account with this email already exists. Sign in instead.'},
      };
    await start(tester, signedIn: false, route: '/sign-up', backend: backend);
    await tester.enterText(find.byType(TextField).at(0), 'Nadia Rahman');
    await tester.enterText(find.byType(TextField).at(1), 'nadia@zenvy.dev');
    await tester.enterText(find.byType(TextField).at(2), 'Password123');
    await tester.pump();
    await tester.ensureVisible(find.text('Create account'));
    await tester.tap(find.text('Create account'));
    await settle(tester);
    expect(find.text('An account with this email already exists. Sign in instead.'), findsOneWidget);
  });

  testWidgets('sending a DM posts it to the conversation and shows it', (tester) async {
    final tanvir = fixture('person_tanvir')['person']['id'] as String;
    final conversation = fixture('dm')['conversation']['id'] as String;
    final h = await start(tester, route: '/dm/$tanvir');
    expect(find.text('Library room 3 at 7? Bringing the DP notes.'), findsOneWidget);
    expect(h.backend.sentTo('PATCH', '/api/conversations/$conversation/read'), isTrue);

    await tester.enterText(find.byType(TextField).last, 'On my way!');
    await tester.pump();
    await tester.tap(find.bySemanticsLabel('Send'));
    await settle(tester);

    final post = h.backend.sent.lastWhere((s) => s.method == 'POST' && s.path == '/api/conversations/$conversation/messages');
    expect(post.body, {'content': 'On my way!'});
    expect(find.text('On my way!'), findsOneWidget);
  });

  testWidgets('accepting a partner request answers it and opens the match screen', (tester) async {
    final sadia = fixture('person_sadia')['person']['id'] as String;
    final backend = FakeBackend()
      ..overrides['POST /api/mobile/users/$sadia/respond'] = (_) {
        final accepted = fixture('person_sadia');
        (accepted['person'] as Map)['connection'] = {'status': 'ACCEPTED', 'direction': 'incoming'};
        return accepted;
      };
    final h = await start(tester, route: '/partner/$sadia', backend: backend);
    expect(find.textContaining('wants to study together'), findsOneWidget);

    await tester.tap(find.text('Accept'));
    await settle(tester);
    final respond = h.backend.sent.firstWhere((s) => s.path == '/api/mobile/users/$sadia/respond');
    expect(respond.body, {'accept': true});
    expect(h.location, '/matched/$sadia');
  });

  testWidgets('a rejected session signs the app out', (tester) async {
    final backend = FakeBackend()..overrides['GET /api/mobile/home'] = (_) => {'__status': 401, 'error': 'Sign in to continue'};
    final h = await start(tester, backend: backend);
    await settle(tester);
    expect(h.app.status, AuthStatus.signedOut);
    expect(h.location, '/welcome');
  });
}
