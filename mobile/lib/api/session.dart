import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// The signed-in session: Auth.js session cookies minted by /api/mobile/auth/*.
class Session {
  const Session({required this.cookies, required this.expiresAt, required this.userId});

  final Map<String, String> cookies;
  final DateTime expiresAt;
  final String userId;

  factory Session.fromAuthResponse(Map<String, dynamic> json) {
    final session = json['session'] as Map<String, dynamic>;
    return Session(
      cookies: {for (final c in session['cookies'] as List) (c as Map)['name'] as String: c['value'] as String},
      expiresAt: DateTime.parse(session['expiresAt'] as String),
      userId: (json['user'] as Map)['id'] as String,
    );
  }

  String get cookieHeader => cookies.entries.map((e) => '${e.key}=${e.value}').join('; ');

  /// Refresh a week before expiry so active users never get signed out.
  bool get needsRefresh => expiresAt.difference(DateTime.now()) < const Duration(days: 7);

  Map<String, dynamic> toJson() => {'cookies': cookies, 'expiresAt': expiresAt.toIso8601String(), 'userId': userId};

  factory Session.fromJson(Map<String, dynamic> json) => Session(
    cookies: (json['cookies'] as Map).cast<String, String>(),
    expiresAt: DateTime.parse(json['expiresAt'] as String),
    userId: json['userId'] as String,
  );
}

abstract class SessionStore {
  Future<Session?> read();
  Future<void> write(Session session);
  Future<void> clear();
}

/// Keychain on iOS, encrypted shared preferences on Android.
class SecureSessionStore implements SessionStore {
  static const _key = 'zenvy.session';
  final _storage = const FlutterSecureStorage();

  @override
  Future<Session?> read() async {
    try {
      final raw = await _storage.read(key: _key);
      if (raw == null) return null;
      final session = Session.fromJson(jsonDecode(raw) as Map<String, dynamic>);
      return session.expiresAt.isAfter(DateTime.now()) ? session : null;
    } catch (_) {
      return null;
    }
  }

  @override
  Future<void> write(Session session) => _storage.write(key: _key, value: jsonEncode(session.toJson()));

  @override
  Future<void> clear() => _storage.delete(key: _key);
}

/// For tests.
class MemorySessionStore implements SessionStore {
  MemorySessionStore([this._session]);
  Session? _session;

  @override
  Future<Session?> read() async => _session;

  @override
  Future<void> write(Session session) async => _session = session;

  @override
  Future<void> clear() async => _session = null;
}
