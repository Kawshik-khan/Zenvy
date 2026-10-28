import '../data/models.dart';
import 'client.dart';
import 'session.dart';

/// Typed calls to the backend. Mobile-specific routes live under /api/mobile; DMs, focus
/// sessions and calls reuse the routes the web app calls.
class ZenvyApi {
  ZenvyApi(this.client);

  final ApiClient client;

  /// JavaScript-style UTC offset (UTC+6 is -360), so "today" means the device's day.
  String get _tz => '${-DateTime.now().timeZoneOffset.inMinutes}';

  // Auth

  Future<Session> login(String email, String password) async =>
      Session.fromAuthResponse(await client.post('/api/mobile/auth/login', {'email': email.trim(), 'password': password}));

  Future<Session> register(String name, String email, String password) async =>
      Session.fromAuthResponse(await client.post('/api/mobile/auth/register', {'name': name.trim(), 'email': email.trim(), 'password': password}));

  Future<Session> refreshSession() async => Session.fromAuthResponse(await client.post('/api/mobile/auth/refresh'));

  Future<void> forgotPassword(String email) => client.post('/api/mobile/auth/forgot-password', {'email': email.trim()});

  // Me

  Future<Me> me() async => Me.fromJson((await client.get('/api/mobile/me'))['me'] as Json);

  Future<Me> updateMe(Map<String, Object?> patch) async => Me.fromJson((await client.patch('/api/mobile/me', patch))['me'] as Json);

  Future<String> uploadPhoto(List<int> bytes, String filename, String contentType) async =>
      (await client.upload('/api/mobile/me/photo', field: 'file', bytes: bytes, filename: filename, contentType: contentType))['url'] as String;

  // Home and stats

  Future<HomeData> home() async => HomeData.fromJson(await client.get('/api/mobile/home', {'tz': _tz}));

  Future<StudyStats> stats() async => StudyStats.fromJson((await client.get('/api/mobile/stats', {'tz': _tz}))['stats'] as Json);

  Future<void> logFocusSession({
    required DateTime startedAt,
    required DateTime endedAt,
    required int plannedMinutes,
    required int completedMinutes,
    String? trackId,
  }) => client.post('/api/pomodoro-sessions', {
    'mode': 'FOCUS',
    'plannedMinutes': plannedMinutes,
    'completedMinutes': completedMinutes.clamp(1, plannedMinutes),
    'startedAt': startedAt.toUtc().toIso8601String(),
    'endedAt': endedAt.toUtc().toIso8601String(),
    'status': 'COMPLETED',
    'trackId': ?trackId,
  });

  // People

  Future<({List<Person> partners, List<StudyAd> studyAds})> partners({String query = ''}) async {
    final j = await client.get('/api/mobile/partners', {'q': query});
    return (
      partners: (j['partners'] as List).map((e) => Person.fromJson((e as Map).cast())).toList(),
      studyAds: (j['studyAds'] as List).map((e) => StudyAd.fromJson((e as Map).cast())).toList(),
    );
  }

  Future<List<Person>> connections() async =>
      ((await client.get('/api/mobile/connections'))['partners'] as List).map((e) => Person.fromJson((e as Map).cast())).toList();

  Future<Person> person(String id) async => Person.fromJson((await client.get('/api/mobile/users/$id'))['person'] as Json);

  Future<Person> connect(String id, {String? note}) async => Person.fromJson(
    (await client.post('/api/mobile/users/$id/connect', {if (note != null && note.trim().isNotEmpty) 'note': note.trim()}))['person'] as Json,
  );

  Future<Person> respondToRequest(String id, {required bool accept}) async =>
      Person.fromJson((await client.post('/api/mobile/users/$id/respond', {'accept': accept}))['person'] as Json);

  Future<void> block(String id) => client.post('/api/mobile/users/$id/block');

  Future<void> report(String id, String reason) => client.post('/api/mobile/users/$id/report', {'reason': reason});

  Future<void> postStudyAd({
    required String title,
    required String subjects,
    required String availability,
    required String description,
    required String mode,
  }) => client.post('/api/mobile/study-ads', {'title': title, 'subjects': subjects, 'availability': availability, 'description': description, 'mode': mode});

  // Notifications

  List<AppNotification> _notifications(Json j) => (j['notifications'] as List).map((e) => AppNotification.fromJson((e as Map).cast())).toList();

  Future<List<AppNotification>> notifications() async => _notifications(await client.get('/api/mobile/notifications'));

  Future<List<AppNotification>> markRead([String? id]) async => _notifications(await client.post('/api/mobile/notifications', {'id': ?id}));

  Future<List<AppNotification>> respondToNotification(String id, {required bool accept}) async =>
      _notifications(await client.post('/api/mobile/notifications/$id/respond', {'accept': accept}));

  // Messages

  Future<Inbox> inbox() async => Inbox.fromJson(await client.get('/api/mobile/inbox'));

  /// The DM conversation with someone; fails unless you're connected partners.
  Future<DirectConversation> openDm(String userId) async =>
      DirectConversation.fromJson((await client.post('/api/conversations/dm', {'targetUserId': userId}))['conversation'] as Json);

  List<ChatMessage> _messages(Json j) => (j['messages'] as List).map((e) => ChatMessage.fromJson((e as Map).cast())).toList();

  Future<List<ChatMessage>> dmMessages(String conversationId) async =>
      _messages(await client.get('/api/conversations/$conversationId/messages', {'limit': '100'}));

  Future<ChatMessage> sendDm(String conversationId, String content) async =>
      ChatMessage.fromJson((await client.post('/api/conversations/$conversationId/messages', {'content': content}))['message'] as Json);

  Future<void> markConversationRead(String conversationId) => client.patch('/api/conversations/$conversationId/read');

  Future<int> unreadMessages() async => ((await client.get('/api/conversations/unread'))['unreadCount'] as num?)?.toInt() ?? 0;

  Future<List<ChatMessage>> groupMessages(String groupId) async => _messages(await client.get('/api/groups/messages', {'groupId': groupId}));

  Future<ChatMessage> sendGroupMessage(String groupId, String content) async =>
      ChatMessage.fromJson((await client.post('/api/groups/messages', {'groupId': groupId, 'content': content}))['message'] as Json);

  Future<List<ChatMessage>> channelMessages(String channelId) async => _messages(await client.get('/api/channels/messages', {'channelId': channelId}));

  Future<ChatMessage> sendChannelMessage(String channelId, String content) async =>
      ChatMessage.fromJson((await client.post('/api/channels/messages', {'channelId': channelId, 'content': content}))['message'] as Json);

  Future<void> setChannelMembership(String channelId, {required bool join}) => client.post('/api/mobile/channels/$channelId/membership', {'join': join});

  // Groups and events

  Future<({List<GroupCard> mine, List<GroupCard> discover})> groups({String query = ''}) async {
    final j = await client.get('/api/mobile/groups', {'q': query});
    List<GroupCard> list(String key) => (j[key] as List).map((e) => GroupCard.fromJson((e as Map).cast())).toList();
    return (mine: list('mine'), discover: list('discover'));
  }

  Future<GroupDetail> group(String id) async => GroupDetail.fromJson((await client.get('/api/mobile/groups/$id'))['group'] as Json);

  Future<GroupDetail> setGroupMembership(String id, {required bool join}) async =>
      GroupDetail.fromJson((await client.post('/api/mobile/groups/$id/membership', {'join': join}))['group'] as Json);

  Future<String> createGroup({required String name, required String subject, String? description}) async =>
      (await client.post('/api/mobile/groups', {'name': name, 'subject': subject, 'description': ?description}))['id'] as String;

  Future<List<EventItem>> events({bool upcomingOnly = true}) async =>
      ((await client.get('/api/mobile/events', {'upcoming': upcomingOnly ? '1' : null}))['events'] as List)
          .map((e) => EventItem.fromJson((e as Map).cast()))
          .toList();

  Future<void> createEvent({
    required String title,
    required DateTime start,
    required DateTime end,
    String? groupId,
    required bool inPerson,
    String? location,
    String? description,
  }) => client.post('/api/mobile/events', {
    'title': title,
    'startTime': start.toUtc().toIso8601String(),
    'endTime': end.toUtc().toIso8601String(),
    'groupId': ?groupId,
    'type': inPerson ? 'IN_PERSON' : 'VIRTUAL',
    'location': ?location,
    'description': ?description,
  });

  Future<void> rsvp(String eventId, String status) => client.post('/api/mobile/events/$eventId/rsvp', {'status': status});

  Future<void> cancelEvent(String eventId) => client.delete('/api/mobile/events/$eventId');

  // Jobs

  Future<JobFeed> jobs({String tab = 'browse', String? query, String? type, String? mode, String? cursor}) async =>
      JobFeed.fromJson(await client.get('/api/mobile/jobs', {'tab': tab, 'q': query, 'type': type, 'mode': mode, 'cursor': cursor}));

  Future<Job> job(String id) async => Job.fromJson((await client.get('/api/mobile/jobs/$id'))['job'] as Json);

  Future<bool> toggleSaveJob(String id) async => (await client.post('/api/mobile/jobs/$id/save'))['saved'] == true;

  Future<void> reportJob(String id, String reason, {String? details}) => client.post('/api/mobile/jobs/$id/report', {'reason': reason, 'details': ?details});

  // Calls

  ({CallSession call, LiveKitCredentials liveKit}) _call(Json j) =>
      (call: CallSession.fromJson(j['call'] as Json), liveKit: LiveKitCredentials.fromJson(j['liveKit'] as Json));

  /// Starts (or re-opens) the call for a DM conversation or a group.
  Future<({CallSession call, LiveKitCredentials liveKit})> startCall({String? conversationId, String? groupId, required bool video}) async =>
      _call(await client.post('/api/calls/start', {'conversationId': ?conversationId, 'groupId': ?groupId, 'mediaType': video ? 'VIDEO' : 'AUDIO'}));

  Future<({CallSession call, LiveKitCredentials liveKit})> joinCall(String callId) async => _call(await client.post('/api/calls/join', {'callId': callId}));

  Future<void> leaveCall(String callId) => client.post('/api/calls/leave', {'callId': callId});

  Future<void> declineCall(String callId) => client.post('/api/calls/decline', {'callId': callId});

  Future<CallSession?> incomingCall() async {
    final j = await client.get('/api/mobile/calls/incoming');
    return j['call'] is Map ? CallSession.fromJson((j['call'] as Map).cast()) : null;
  }
}
