// Runs the app's API layer against a real Zenvy backend seeded with scripts/seed-dev.mjs.
// Skipped unless ZENVY_LIVE_API is set, e.g.:
//   ZENVY_LIVE_API=http://localhost:3000 flutter test test/live
@Tags(['live'])
library;

import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:zenvy/api/client.dart';
import 'package:zenvy/api/zenvy_api.dart';

final base = Platform.environment['ZENVY_LIVE_API'];
const password = 'Zenvy-dev-1';

Future<ZenvyApi> signedIn(String email) async {
  final api = ZenvyApi(ApiClient(baseUrl: base!));
  api.client.session = await api.login(email, password);
  return api;
}

void main() {
  // flutter_test blocks real HTTP by default; this suite talks to a real server.
  setUpAll(() => HttpOverrides.global = null);

  final skip = base == null ? 'Set ZENVY_LIVE_API to run against a backend' : null;

  test('sign up, set up a profile, and see suggestions', () async {
    final api = ZenvyApi(ApiClient(baseUrl: base!));
    final email = 'live.${DateTime.now().millisecondsSinceEpoch}@zenvy.dev';
    await expectLater(
      api.register('Live Test', email, 'weak'),
      throwsA(isA<ApiException>().having((e) => e.fieldErrors['password'], 'password error', isNotNull)),
    );

    api.client.session = await api.register('Live Test', email, 'Password123');
    var me = await api.me();
    expect(me.name, 'Live Test');
    expect(me.onboarded, isFalse);

    me = await api.updateMe({
      'college': 'BRAC University',
      'major': 'Computer Science',
      'semester': 3,
      'interests': ['Algorithms', 'React'],
      'availability': 'Evenings',
      'studyStyle': 'Pair programming',
    });
    expect(me.onboarded, isTrue);
    expect(me.interests, ['Algorithms', 'React']);

    final partners = await api.partners();
    expect(partners.partners, isNotEmpty);
    expect(partners.partners.first.reasons, contains('Same major'));

    final refreshed = await api.refreshSession();
    expect(refreshed.userId, me.id);
  }, skip: skip);

  test('a partner request goes both ways and opens a DM', () async {
    final nadia = await signedIn('nadia@zenvy.dev');
    final mahin = await signedIn('mahin@zenvy.dev');
    final mahinMe = await mahin.me();
    final nadiaMe = await nadia.me();

    var person = await nadia.person(mahinMe.id);
    if (person.connection == null) person = await nadia.connect(mahinMe.id, note: 'Calc II together?');
    expect(person.connection?.status, anyOf('PENDING', 'ACCEPTED'));

    if (person.connection!.status == 'PENDING') {
      final notifications = await mahin.notifications();
      final request = notifications.firstWhere((n) => n.type == 'MATCH_REQUEST' && n.actor?.id == nadiaMe.id);
      expect(request.actionable, isTrue);
      await mahin.respondToNotification(request.id, accept: true);
    }
    expect((await nadia.person(mahinMe.id)).connection?.accepted, isTrue);

    final conversation = await nadia.openDm(mahinMe.id);
    final text = 'live check ${DateTime.now().microsecondsSinceEpoch}';
    final sent = await nadia.sendDm(conversation.id, text);
    expect(sent.isSelf, isTrue);

    expect(await mahin.unreadMessages(), greaterThan(0));
    final received = await mahin.dmMessages(conversation.id);
    expect(received.last.content, text);
    expect(received.last.isSelf, isFalse);
    await mahin.markConversationRead(conversation.id);

    final inbox = await mahin.inbox();
    expect(inbox.direct.any((c) => c.peerId == nadiaMe.id), isTrue);
  }, skip: skip);

  test('groups, group chat, channels and sessions', () async {
    final nadia = await signedIn('nadia@zenvy.dev');
    final groups = await nadia.groups();
    final circle = groups.mine.firstWhere((g) => g.name == 'Algorithms Circle');

    final detail = await nadia.group(circle.id);
    expect(detail.isMember, isTrue);
    expect(detail.members.length, greaterThanOrEqualTo(5));
    expect(detail.resources, isNotEmpty);

    final text = 'group live ${DateTime.now().microsecondsSinceEpoch}';
    await nadia.sendGroupMessage(circle.id, text);
    expect((await nadia.groupMessages(circle.id)).last.content, text);

    final discover = groups.discover.firstWhere((g) => g.name == 'ML Paper Club');
    expect((await nadia.setGroupMembership(discover.id, join: true)).isMember, isTrue);
    expect((await nadia.setGroupMembership(discover.id, join: false)).isMember, isFalse);

    final inbox = await nadia.inbox();
    final channel = inbox.channels.first;
    await nadia.sendChannelMessage(channel.id, 'channel live');
    expect((await nadia.channelMessages(channel.id)).last.content, 'channel live');

    final start = DateTime.now().add(const Duration(days: 3)).copyWith(hour: 18, minute: 30, second: 0, millisecond: 0, microsecond: 0);
    await nadia.createEvent(
      title: 'Live mock exam',
      start: start,
      end: start.add(const Duration(hours: 1)),
      groupId: circle.id,
      inPerson: true,
      location: 'Room 3',
    );
    final events = await nadia.events();
    final created = events.firstWhere((e) => e.title == 'Live mock exam');
    expect(created.start, start, reason: 'times round-trip in local time');
    expect(created.isGoing, isTrue);
    await nadia.rsvp(created.id, 'DECLINED');
    expect((await nadia.events()).firstWhere((e) => e.id == created.id).isGoing, isFalse);
    expect(created.canCancel, isTrue);
    await nadia.cancelEvent(created.id);
    expect((await nadia.events()).any((e) => e.id == created.id), isFalse);
  }, skip: skip);

  test('focus sessions count toward today', () async {
    final nadia = await signedIn('nadia@zenvy.dev');
    final before = await nadia.stats();
    final end = DateTime.now();
    await nadia.logFocusSession(startedAt: end.subtract(const Duration(minutes: 25)), endedAt: end, plannedMinutes: 25, completedMinutes: 25);
    final after = await nadia.stats();
    expect(after.todayMinutes, before.todayMinutes + 25);
    expect(after.todaySessions, before.todaySessions + 1);
    expect(after.lastSevenDays, hasLength(7));
    expect(after.heatmap, hasLength(28));
    final home = await nadia.home();
    expect(home.todayMinutes, after.todayMinutes);
  }, skip: skip);

  test('jobs: feed, detail, save and the saved tab', () async {
    final nadia = await signedIn('nadia@zenvy.dev');
    final feed = await nadia.jobs();
    expect(feed.enabled, isTrue);
    expect(feed.jobs, isNotEmpty);
    final job = await nadia.job(feed.jobs.first.id);
    expect(job.description, isNotEmpty);
    expect(job.applyMethod, isIn(['LINK', 'EMAIL', 'MESSAGE']));

    final saved = await nadia.toggleSaveJob(job.id);
    final savedTab = await nadia.jobs(tab: 'saved');
    expect(savedTab.jobs.any((j) => j.id == job.id), saved);
    if (saved) await nadia.toggleSaveJob(job.id);

    final filtered = await nadia.jobs(type: 'INTERNSHIP');
    expect(filtered.jobs.every((j) => j.type == 'INTERNSHIP'), isTrue);
  }, skip: skip);

  test('a rejected session reports 401', () async {
    final api = ZenvyApi(ApiClient(baseUrl: base!));
    var signedOut = false;
    api.client.onUnauthorized = () => signedOut = true;
    await expectLater(api.home(), throwsA(isA<ApiException>().having((e) => e.unauthorized, 'unauthorized', isTrue)));
    expect(signedOut, isTrue);
    await expectLater(api.login('nadia@zenvy.dev', 'wrong-password'), throwsA(isA<ApiException>().having((e) => e.status, 'status', 401)));
  }, skip: skip);
}
