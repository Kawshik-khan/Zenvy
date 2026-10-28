import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:zenvy/api/client.dart';
import 'package:zenvy/api/session.dart';
import 'package:zenvy/api/zenvy_api.dart';
import 'package:zenvy/state/app_state.dart';

/// Responses captured from the real backend (scripts/seed-dev.mjs data), served by path.
Map<String, dynamic> fixture(String name) => jsonDecode(File('test/fixtures/$name.json').readAsStringSync()) as Map<String, dynamic>;

/// A recorded request, for asserting what the app sent.
class Sent {
  Sent(this.method, this.path, this.body);
  final String method;
  final String path;
  final Object? body;
}

class FakeBackend {
  final sent = <Sent>[];

  /// Overrides by "METHOD /path" (path without query); return null to fall through.
  final overrides = <String, Map<String, dynamic>? Function(http.Request)>{};

  late final client = MockClient((request) async {
    final path = request.url.path;
    final key = '${request.method} $path';
    Object? body;
    if (request.body.isNotEmpty) {
      try {
        body = jsonDecode(request.body);
      } catch (_) {
        body = request.body;
      }
    }
    sent.add(Sent(request.method, path, body));

    final override = overrides[key]?.call(request);
    if (override != null) return _json(override, status: (override['__status'] as int?) ?? 200);

    final response = _route(request.method, path, request.url.queryParameters, body);
    if (response == null) return _json({'error': 'Not found in fake backend: $key'}, status: 404);
    return _json(response);
  });

  static http.Response _json(Map<String, dynamic> data, {int status = 200}) =>
      http.Response(jsonEncode(data..remove('__status')), status, headers: {'content-type': 'application/json'});

  Map<String, dynamic>? _route(String method, String path, Map<String, String> query, Object? body) {
    final segments = path.split('/').where((s) => s.isNotEmpty).toList();
    if (method == 'GET') {
      switch (path) {
        case '/api/mobile/me':
          return fixture('me');
        case '/api/mobile/home':
          return fixture('home');
        case '/api/mobile/partners':
          return fixture('partners');
        case '/api/mobile/connections':
          return fixture('connections');
        case '/api/mobile/notifications':
          return fixture('notifications');
        case '/api/mobile/inbox':
          return fixture('inbox');
        case '/api/mobile/groups':
          return fixture('groups');
        case '/api/mobile/events':
          return fixture('events');
        case '/api/mobile/stats':
          return fixture('stats');
        case '/api/mobile/jobs':
          return fixture('jobs');
        case '/api/conversations/unread':
          return fixture('unread');
        case '/api/groups/messages':
          return fixture('group_messages');
        case '/api/channels/messages':
          return fixture('channel_messages');
        case '/api/mobile/calls/incoming':
          return {'call': null};
      }
      if (path.startsWith('/api/mobile/users/')) {
        return fixture(path.contains(fixture('person_sadia')['person']['id'] as String) ? 'person_sadia' : 'person_tanvir');
      }
      if (path.startsWith('/api/mobile/groups/')) return fixture('group');
      if (path.startsWith('/api/mobile/jobs/')) return fixture('job');
      if (segments.length == 4 && segments[1] == 'conversations' && segments[3] == 'messages') return fixture('dm_messages');
    }
    if (method == 'POST') {
      switch (path) {
        case '/api/mobile/auth/login':
        case '/api/mobile/auth/register':
        case '/api/mobile/auth/refresh':
          return fixture('login');
        case '/api/conversations/dm':
          return fixture('dm');
        case '/api/pomodoro-sessions':
          return {
            'session': {'id': 'new', 'completedMinutes': 25},
          };
        case '/api/mobile/notifications':
          return fixture('notifications');
      }
      if (segments.length == 4 && segments[1] == 'conversations' && segments[3] == 'messages') {
        return {
          'message': {
            'id': 'sent-${sent.length}',
            'senderId': 'me',
            'senderName': 'Nadia Rahman',
            'content': (body as Map)['content'],
            'timestamp': DateTime.now().toUtc().toIso8601String(),
            'isSelf': true,
            'status': 'SENT',
          },
        };
      }
      return {'ok': true};
    }
    if (method == 'PATCH') {
      if (path == '/api/mobile/me') return fixture('me');
      return {'success': true};
    }
    return null;
  }

  /// An app state wired to this backend; signed in unless [signedIn] is false.
  AppState appState({bool signedIn = true}) {
    final session = signedIn ? Session.fromAuthResponse(fixture('login')) : null;
    return AppState(
      api: ZenvyApi(ApiClient(baseUrl: 'https://zenvy.test', httpClient: client)),
      sessions: MemorySessionStore(session),
      poll: false,
    );
  }

  bool sentTo(String method, String path) => sent.any((s) => s.method == method && s.path == path);
}
