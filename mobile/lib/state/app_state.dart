import 'package:flutter/widgets.dart';

import '../data/models.dart';
import '../data/sample.dart' as sample;

class Profile {
  const Profile({required this.studyStyle, required this.interests, required this.times, required this.available, required this.push});

  final String studyStyle;
  final List<String> interests;
  final List<String> times;
  final bool available;
  final bool push;

  Profile copyWith({String? studyStyle, List<String>? interests, List<String>? times, bool? available, bool? push}) => Profile(
    studyStyle: studyStyle ?? this.studyStyle,
    interests: interests ?? this.interests,
    times: times ?? this.times,
    available: available ?? this.available,
    push: push ?? this.push,
  );
}

enum Flag { requested, joinedGroups, rsvp, savedJobs, appliedJobs }

String _nowLabel() {
  final d = DateTime.now();
  final h = d.hour % 12 == 0 ? 12 : d.hour % 12;
  final m = d.minute.toString().padLeft(2, '0');
  return '$h:$m ${d.hour < 12 ? 'AM' : 'PM'}';
}

/// In-memory app state for the prototype. Replace the setters with API calls when wiring the backend.
class AppState extends ChangeNotifier {
  final Map<Flag, Map<String, bool>> _flags = {
    Flag.requested: {},
    Flag.joinedGroups: {for (final g in sample.groups) g.id: g.joined},
    Flag.rsvp: {'e1': true},
    Flag.savedJobs: {'nh-data': true},
    Flag.appliedJobs: {},
  };
  final Map<String, bool> _connected = {'tanvir': false};
  final Map<String, List<ChatMessage>> dms = {
    for (final e in sample.dmThreads.entries) e.key: [...e.value],
  };
  final Map<String, List<ChatMessage>> groupChats = {
    for (final e in sample.groupThreads.entries) e.key: [...e.value],
  };
  List<AppNotification> notifications = [...sample.notifications];
  int focusMinutesToday = sample.Stats.todayMinutes;
  int sessionsToday = sample.Stats.sessionsToday;
  Profile profile = Profile(
    studyStyle: 'Pair programming',
    interests: sample.me.interests.take(3).toList(),
    times: const ['Evening', 'Late'],
    available: true,
    push: true,
  );

  bool flag(Flag f, String id) => _flags[f]![id] ?? false;
  bool connected(String id) => _connected[id] ?? false;

  int get unreadNotifications => notifications.where((n) => n.unread).length;

  void toggle(Flag f, String id) {
    _flags[f]![id] = !flag(f, id);
    notifyListeners();
  }

  void connect(String id) {
    _connected[id] = true;
    _flags[Flag.requested]![id] = false;
    notifyListeners();
  }

  ChatMessage _local(String text) => ChatMessage(id: 'local-${DateTime.now().microsecondsSinceEpoch}', authorId: 'me', text: text, time: _nowLabel());

  void sendDm(String personId, String text) {
    dms.putIfAbsent(personId, () => []).add(_local(text));
    notifyListeners();
  }

  void sendGroup(String groupId, String text) {
    groupChats.putIfAbsent(groupId, () => []).add(_local(text));
    notifyListeners();
  }

  void markAllRead() {
    notifications = [for (final n in notifications) n.copyWith(unread: false)];
    notifyListeners();
  }

  void resolveRequest(String notificationId, bool accept) {
    notifications = [
      for (final n in notifications)
        if (n.id == notificationId)
          n.copyWith(
            kind: NotificationKind.match,
            unread: false,
            body: accept ? 'is now your study partner.' : 'request declined.',
            time: 'Just now',
            refId: () => accept ? n.refId : null,
          )
        else
          n,
    ];
    final ref = notifications.firstWhere((n) => n.id == notificationId).refId;
    if (accept && ref != null) _connected[ref] = true;
    notifyListeners();
  }

  void completeSession(int minutes) {
    focusMinutesToday += minutes;
    sessionsToday += 1;
    notifyListeners();
  }

  void updateProfile(Profile Function(Profile p) patch) {
    profile = patch(profile);
    notifyListeners();
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
