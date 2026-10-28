import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'screens/auth/forgot_password.dart';
import 'screens/auth/log_in.dart';
import 'screens/auth/onboarding_about.dart';
import 'screens/auth/onboarding_style.dart';
import 'screens/auth/sign_up.dart';
import 'screens/auth/splash.dart';
import 'screens/auth/welcome.dart';
import 'screens/calls/active_call.dart';
import 'screens/calls/incoming_call.dart';
import 'screens/chat/channel_room.dart';
import 'screens/chat/direct_message.dart';
import 'screens/chat/group_room.dart';
import 'screens/events/events.dart';
import 'screens/events/new_event.dart';
import 'screens/focus_done.dart';
import 'screens/groups/group_detail.dart';
import 'screens/groups/groups.dart';
import 'screens/groups/new_group.dart';
import 'screens/jobs/job_detail.dart';
import 'screens/jobs/jobs.dart';
import 'screens/notifications.dart';
import 'screens/partners/matched.dart';
import 'screens/partners/new_message.dart';
import 'screens/partners/partner_profile.dart';
import 'screens/partners/post_ad.dart';
import 'screens/profile.dart';
import 'screens/stats.dart';
import 'screens/home/day_plan.dart';
import 'screens/home/recap.dart';
import 'screens/tabs/focus.dart';
import 'screens/tabs/home.dart';
import 'screens/tabs/messages.dart';
import 'screens/tabs/more.dart';
import 'screens/tabs/partners.dart';
import 'screens/tabs/tab_shell.dart';
import 'state/app_state.dart';

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

StatefulShellBranch _tab(String path, Widget Function(GoRouterState) build) => StatefulShellBranch(
  routes: [GoRoute(path: path, builder: (_, s) => build(s))],
);

const _signedOutRoutes = {'/welcome', '/sign-up', '/log-in', '/forgot-password'};

GoRouter buildRouter(AppState app) => GoRouter(
  initialLocation: '/',
  refreshListenable: app,
  redirect: (context, state) {
    final location = state.matchedLocation;
    switch (app.status) {
      case AuthStatus.loading:
        return location == '/' ? null : '/';
      case AuthStatus.signedOut:
        return _signedOutRoutes.contains(location) ? null : '/welcome';
      case AuthStatus.signedIn:
        if (location == '/' || _signedOutRoutes.contains(location)) {
          return app.me != null && !app.me!.onboarded ? '/onboarding-about' : '/home';
        }
        return null;
    }
  },
  routes: [
    _page('/', (_) => const SplashScreen()),
    _page('/welcome', (_) => const WelcomeScreen()),
    _page('/sign-up', (_) => const SignUpScreen()),
    _page('/log-in', (_) => const LogInScreen()),
    _page('/forgot-password', (_) => const ForgotPasswordScreen()),
    _page('/onboarding-about', (_) => const OnboardingAboutScreen()),
    _page('/onboarding-style', (_) => const OnboardingStyleScreen()),
    StatefulShellRoute.indexedStack(
      builder: (_, _, shell) => TabShell(shell: shell),
      branches: [
        _tab('/home', (_) => const HomeScreen()),
        _tab('/partners', (_) => const PartnersScreen()),
        _tab('/messages', (_) => const MessagesScreen()),
        _tab('/jobs', (s) => JobsScreen(initialTab: s.uri.queryParameters['tab'])),
        _tab('/more', (_) => const MoreScreen()),
      ],
    ),
    _page('/focus', (_) => const FocusScreen()),
    _modal('/focus-done', (s) => FocusDoneScreen(minutes: int.tryParse(s.uri.queryParameters['minutes'] ?? ''), saved: s.uri.queryParameters['saved'] != '0')),
    _page('/stats', (_) => const StatsScreen()),
    _page('/today', (_) => const TodayScreen()),
    _modal('/recap', (_) => const RecapScreen()),
    _page('/notifications', (_) => const NotificationsScreen()),
    _page('/partner/:id', (s) => PartnerProfileScreen(id: s.pathParameters['id']!)),
    _fade('/matched/:id', (s) => MatchedScreen(id: s.pathParameters['id']!)),
    _modal('/post-ad', (_) => const PostAdScreen()),
    _modal('/new-message', (_) => const NewMessageScreen()),
    _page('/dm/:userId', (s) => DirectMessageScreen(userId: s.pathParameters['userId']!)),
    _page('/group-room/:id', (s) => GroupRoomScreen(id: s.pathParameters['id']!)),
    _page('/channel/:id', (s) => ChannelRoomScreen(id: s.pathParameters['id']!, name: s.uri.queryParameters['name'])),
    _fade(
      '/call/incoming',
      (s) => IncomingCallScreen(
        callId: s.uri.queryParameters['callId'] ?? '',
        callerId: s.uri.queryParameters['callerId'],
        callerName: s.uri.queryParameters['name'] ?? 'Zenvy student',
        video: s.uri.queryParameters['video'] == '1',
      ),
    ),
    _fade(
      '/call/active',
      (s) => ActiveCallScreen(
        callId: s.uri.queryParameters['callId'],
        conversationId: s.uri.queryParameters['conversationId'],
        groupId: s.uri.queryParameters['groupId'],
        title: s.uri.queryParameters['title'] ?? 'Study call',
        video: s.uri.queryParameters['video'] == '1',
      ),
    ),
    _page('/groups', (_) => const GroupsScreen()),
    _modal('/groups/new', (_) => const NewGroupScreen()),
    _page('/groups/:id', (s) => GroupDetailScreen(id: s.pathParameters['id']!)),
    _page('/events', (_) => const EventsScreen()),
    _modal('/events/new', (s) => NewEventScreen(groupId: s.uri.queryParameters['groupId'])),
    _page('/jobs/:id', (s) => JobDetailScreen(id: s.pathParameters['id']!)),
    _page('/profile', (_) => const ProfileScreen()),
  ],
);

/// Builds a location with query parameters, e.g. `withQuery('/call/active', {'title': 'Tanvir'})`.
String withQuery(String path, Map<String, String?> params) => Uri(
  path: path,
  queryParameters: {
    for (final e in params.entries)
      if (e.value != null) e.key: e.value!,
  },
).toString();

/// Opens the incoming-call screen whenever [AppState] spots a call ringing for this user.
void wireIncomingCalls(AppState app, GoRouter router) {
  app.incomingCall.addListener(() {
    final call = app.incomingCall.value;
    if (call == null) return;
    final caller = call.caller;
    router.push(withQuery('/call/incoming', {'callId': call.id, 'callerId': caller?.id, 'name': caller?.name, 'video': call.video ? '1' : null}));
  });
}
