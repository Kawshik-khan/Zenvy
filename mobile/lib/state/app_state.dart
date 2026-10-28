import 'dart:async';

import 'package:flutter/widgets.dart';

import '../api/client.dart';
import '../api/session.dart';
import '../api/zenvy_api.dart';
import '../data/models.dart';

enum AuthStatus { loading, signedOut, signedIn }

/// App-wide state: the session, the signed-in user, unread badges and incoming calls.
/// Screens load their own data through [api] and call [touch] after changing something,
/// so other screens refresh.
class AppState extends ChangeNotifier with WidgetsBindingObserver {
  AppState({required this.api, required this.sessions, this.poll = true}) {
    api.client.onUnauthorized = _onUnauthorized;
  }

  final ZenvyApi api;
  final SessionStore sessions;

  /// Poll for badges and incoming calls while signed in (off in tests).
  final bool poll;

  AuthStatus status = AuthStatus.loading;
  Me? me;
  int unreadMessages = 0;
  int unreadNotifications = 0;

  /// Bumped after any change, so screens showing server data reload.
  int revision = 0;

  /// A direct call ringing for this user, picked up by the tab shell.
  final incomingCall = ValueNotifier<CallSession?>(null);
  final Set<String> _seenCalls = {};

  Timer? _badgeTimer;
  Timer? _callTimer;
  bool _foreground = true;

  Future<void> bootstrap() async {
    WidgetsBinding.instance.addObserver(this);
    final saved = await sessions.read();
    if (saved == null) return _setSignedOut();
    api.client.session = saved;
    try {
      if (saved.needsRefresh) await _store(await api.refreshSession());
      me = await api.me();
      _setSignedIn();
    } on ApiException catch (e) {
      // Offline: keep the session and retry when screens load; a rejected session signs out.
      if (e.unauthorized) return _setSignedOut();
      status = AuthStatus.signedIn;
      _startPolling();
      notifyListeners();
    }
  }

  /// Signs in; with [remember] false the session lasts until the app is closed.
  Future<void> signIn(String email, String password, {bool remember = true}) async {
    await _store(await api.login(email, password), persist: remember);
    me = await api.me();
    _setSignedIn();
  }

  Future<void> signUp(String name, String email, String password) async {
    await _store(await api.register(name, email, password));
    me = await api.me();
    _setSignedIn();
  }

  Future<void> signOut() async {
    await sessions.clear();
    _setSignedOut();
  }

  Future<void> deleteAccount(String confirmation, String? password) async {
    await api.deleteAccount(confirmation, password);
    await signOut();
  }

  Future<void> refreshMe() async {
    me = await api.me();
    notifyListeners();
  }

  Future<void> updateMe(Map<String, Object?> patch) async {
    me = await api.updateMe(patch);
    touch();
  }

  /// Marks server data as changed so visible screens reload.
  void touch() {
    revision++;
    notifyListeners();
    unawaited(refreshBadges());
  }

  Future<void> refreshBadges() async {
    if (status != AuthStatus.signedIn) return;
    try {
      final results = await Future.wait([api.unreadMessages(), api.notifications()]);
      final messages = results[0] as int;
      final notifications = (results[1] as List<AppNotification>).where((n) => !n.read).length;
      if (messages != unreadMessages || notifications != unreadNotifications) {
        unreadMessages = messages;
        unreadNotifications = notifications;
        notifyListeners();
      }
    } catch (_) {
      // Badges are best effort.
    }
  }

  void dismissIncomingCall() => incomingCall.value = null;

  Future<void> _store(Session session, {bool persist = true}) async {
    api.client.session = session;
    if (persist) {
      await sessions.write(session);
    } else {
      await sessions.clear();
    }
  }

  void _setSignedIn() {
    status = AuthStatus.signedIn;
    notifyListeners();
    _startPolling();
    unawaited(refreshBadges());
  }

  void _setSignedOut() {
    _stopPolling();
    api.client.session = null;
    me = null;
    unreadMessages = 0;
    unreadNotifications = 0;
    incomingCall.value = null;
    status = AuthStatus.signedOut;
    notifyListeners();
  }

  void _onUnauthorized() {
    if (status == AuthStatus.signedIn) unawaited(signOut());
  }

  void _startPolling() {
    _stopPolling();
    if (!poll) return;
    _badgeTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      if (_foreground) unawaited(refreshBadges());
    });
    _callTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (_foreground) unawaited(_checkIncomingCall());
    });
  }

  void _stopPolling() {
    _badgeTimer?.cancel();
    _callTimer?.cancel();
    _badgeTimer = null;
    _callTimer = null;
  }

  Future<void> _checkIncomingCall() async {
    if (status != AuthStatus.signedIn || incomingCall.value != null) return;
    try {
      final call = await api.incomingCall();
      if (call != null && _seenCalls.add(call.id)) incomingCall.value = call;
    } catch (_) {}
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    _foreground = state == AppLifecycleState.resumed;
    if (_foreground) {
      unawaited(refreshBadges());
      revision++;
      notifyListeners();
    }
  }

  @override
  void dispose() {
    _stopPolling();
    WidgetsBinding.instance.removeObserver(this);
    incomingCall.dispose();
    super.dispose();
  }
}

class AppScope extends InheritedNotifier<AppState> {
  const AppScope({super.key, required AppState state, required super.child}) : super(notifier: state);

  static AppState of(BuildContext context) => context.dependOnInheritedWidgetOfExactType<AppScope>()!.notifier!;

  /// Read without rebuilding on change (for callbacks).
  static AppState read(BuildContext context) => context.getInheritedWidgetOfExactType<AppScope>()!.notifier!;
}

String? formatBadge(int count) {
  if (count <= 0) return null;
  return count > 9 ? '9+' : '$count';
}

String formatMinutes(int total) {
  final h = total ~/ 60;
  final m = total % 60;
  if (h == 0) return '${m}m';
  return m > 0 ? '${h}h ${m}m' : '${h}h';
}
