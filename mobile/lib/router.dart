import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'screens/auth/log_in.dart';
import 'screens/auth/onboarding_about.dart';
import 'screens/auth/onboarding_style.dart';
import 'screens/auth/sign_up.dart';
import 'screens/auth/verify.dart';
import 'screens/auth/welcome.dart';
import 'screens/calls/active_call.dart';
import 'screens/calls/incoming_call.dart';
import 'screens/chat/direct_message.dart';
import 'screens/chat/group_room.dart';
import 'screens/events/events.dart';
import 'screens/events/new_event.dart';
import 'screens/focus_done.dart';
import 'screens/groups/group_detail.dart';
import 'screens/groups/groups.dart';
import 'screens/jobs/job_detail.dart';
import 'screens/jobs/jobs.dart';
import 'screens/notifications.dart';
import 'screens/partners/matched.dart';
import 'screens/partners/partner_profile.dart';
import 'screens/partners/post_ad.dart';
import 'screens/profile.dart';
import 'screens/stats.dart';
import 'screens/tabs/focus.dart';
import 'screens/tabs/home.dart';
import 'screens/tabs/messages.dart';
import 'screens/tabs/more.dart';
import 'screens/tabs/partners.dart';
import 'screens/tabs/tab_shell.dart';

final rootNavigatorKey = GlobalKey<NavigatorState>();

GoRoute _page(String path, Widget Function(GoRouterState s) build) => GoRoute(path: path, builder: (_, s) => build(s));

/// Slides up from the bottom, like a sheet (session summary, forms).
GoRoute _modal(String path, Widget Function(GoRouterState s) build) => GoRoute(
  path: path,
  pageBuilder: (_, s) => MaterialPage(key: s.pageKey, fullscreenDialog: true, child: build(s)),
);

/// Fades in over everything (calls, the match celebration).
GoRoute _fade(String path, Widget Function(GoRouterState s) build) => GoRoute(
  path: path,
  pageBuilder: (_, s) => CustomTransitionPage(
    key: s.pageKey,
    child: build(s),
    transitionsBuilder: (_, animation, _, child) => FadeTransition(opacity: animation, child: child),
  ),
);

StatefulShellBranch _tab(String path, Widget screen) => StatefulShellBranch(
  routes: [GoRoute(path: path, builder: (_, _) => screen)],
);

// Signed-out entry point. Once auth is wired, send signed-in users to /home instead.
final router = GoRouter(
  navigatorKey: rootNavigatorKey,
  initialLocation: '/welcome',
  routes: [
    GoRoute(path: '/', redirect: (_, _) => '/welcome'),
    _page('/welcome', (_) => const WelcomeScreen()),
    _page('/sign-up', (_) => const SignUpScreen()),
    _page('/log-in', (_) => const LogInScreen()),
    _page('/verify', (s) => VerifyScreen(email: s.uri.queryParameters['email'])),
    _page('/onboarding-about', (_) => const OnboardingAboutScreen()),
    _page('/onboarding-style', (_) => const OnboardingStyleScreen()),
    StatefulShellRoute.indexedStack(
      builder: (_, _, shell) => TabShell(shell: shell),
      branches: [
        _tab('/home', const HomeScreen()),
        _tab('/partners', const PartnersScreen()),
        _tab('/messages', const MessagesScreen()),
        _tab('/focus', const FocusScreen()),
        _tab('/more', const MoreScreen()),
      ],
    ),
    _modal('/focus-done', (s) => FocusDoneScreen(minutes: int.tryParse(s.uri.queryParameters['minutes'] ?? ''))),
    _page('/stats', (_) => const StatsScreen()),
    _page('/notifications', (_) => const NotificationsScreen()),
    _page('/partner/:id', (s) => PartnerProfileScreen(id: s.pathParameters['id']!)),
    _fade('/matched/:id', (s) => MatchedScreen(id: s.pathParameters['id']!)),
    _modal('/post-ad', (_) => const PostAdScreen()),
    _page('/dm/:id', (s) => DirectMessageScreen(id: s.pathParameters['id']!)),
    _page('/group-room/:id', (s) => GroupRoomScreen(id: s.pathParameters['id']!)),
    _fade('/call/incoming', (s) => IncomingCallScreen(id: s.uri.queryParameters['id'] ?? 'tanvir')),
    _fade('/call/active', (s) => ActiveCallScreen(title: s.uri.queryParameters['title'] ?? 'Algorithms Circle')),
    _page('/groups', (_) => const GroupsScreen()),
    _page('/groups/:id', (s) => GroupDetailScreen(id: s.pathParameters['id']!)),
    _page('/events', (_) => const EventsScreen()),
    _modal('/events/new', (_) => const NewEventScreen()),
    _page('/jobs', (s) => JobsScreen(initialTab: s.uri.queryParameters['tab'])),
    _page('/jobs/:id', (s) => JobDetailScreen(id: s.pathParameters['id']!)),
    _page('/profile', (_) => const ProfileScreen()),
  ],
);

/// Builds a location with query parameters, e.g. `withQuery('/call/active', {'title': 'Tanvir'})`.
String withQuery(String path, Map<String, String> params) => Uri(path: path, queryParameters: params).toString();
