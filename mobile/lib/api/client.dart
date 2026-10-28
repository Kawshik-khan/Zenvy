import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import 'session.dart';

/// An error the server (or the network) reported, with a message safe to show.
class ApiException implements Exception {
  ApiException(this.message, {this.status = 0, this.fieldErrors = const {}, this.timedOut = false});

  final String message;
  final int status;
  final Map<String, String> fieldErrors;

  /// The server was reachable but slow, which isn't the device being offline.
  final bool timedOut;

  bool get unauthorized => status == 401;
  bool get offline => status == 0 && !timedOut;

  @override
  String toString() => message;
}

/// JSON over HTTP with the session cookie attached.
class ApiClient {
  ApiClient({required this.baseUrl, http.Client? httpClient}) : _http = httpClient ?? http.Client();

  final String baseUrl;
  final http.Client _http;

  Session? session;

  /// Called when the server rejects the session, so the app can sign out.
  void Function()? onUnauthorized;

  static const _timeout = Duration(seconds: 25);

  Uri uri(String path, [Map<String, String?>? query]) {
    final q = {
      for (final e in (query ?? const {}).entries)
        if (e.value != null && e.value!.isNotEmpty) e.key: e.value!,
    };
    return Uri.parse('$baseUrl$path').replace(queryParameters: q.isEmpty ? null : q);
  }

  Map<String, String> get _headers => {'accept': 'application/json', if (session != null) 'cookie': session!.cookieHeader};

  Future<Map<String, dynamic>> get(String path, [Map<String, String?>? query]) => _send(() => _http.get(uri(path, query), headers: _headers));

  Future<Map<String, dynamic>> post(String path, [Object? body]) =>
      _send(() => _http.post(uri(path), headers: {..._headers, 'content-type': 'application/json'}, body: jsonEncode(body ?? const {})));

  Future<Map<String, dynamic>> patch(String path, [Object? body]) =>
      _send(() => _http.patch(uri(path), headers: {..._headers, 'content-type': 'application/json'}, body: jsonEncode(body ?? const {})));

  Future<Map<String, dynamic>> delete(String path, [Object? body]) => _send(
    () => body == null
        ? _http.delete(uri(path), headers: _headers)
        : _http.delete(uri(path), headers: {..._headers, 'content-type': 'application/json'}, body: jsonEncode(body)),
  );

  Future<Map<String, dynamic>> upload(String path, {required String field, required List<int> bytes, required String filename, required String contentType}) {
    return _send(() async {
      final request = http.MultipartRequest('POST', uri(path))
        ..headers.addAll(_headers)
        ..files.add(http.MultipartFile.fromBytes(field, bytes, filename: filename, contentType: http.MediaType.parse(contentType)));
      return http.Response.fromStream(await _http.send(request));
    });
  }

  Future<Map<String, dynamic>> _send(Future<http.Response> Function() run) async {
    http.Response res;
    try {
      res = await run().timeout(_timeout);
    } on TimeoutException {
      throw ApiException('Zenvy is taking too long to answer. Try again in a moment.', timedOut: true);
    } catch (_) {
      throw ApiException("Can't reach Zenvy. Check your connection and try again.");
    }

    Map<String, dynamic> body;
    try {
      final decoded = res.body.isEmpty ? const <String, dynamic>{} : jsonDecode(res.body);
      body = decoded is Map<String, dynamic> ? decoded : {'data': decoded};
    } catch (_) {
      body = const {};
    }

    if (res.statusCode >= 200 && res.statusCode < 300) return body;

    if (res.statusCode == 401) onUnauthorized?.call();
    final fieldErrors = (body['fieldErrors'] as Map?)?.map((k, v) => MapEntry(k.toString(), v.toString())) ?? const <String, String>{};
    final message = body['error'] is String && (body['error'] as String).isNotEmpty
        ? body['error'] as String
        : res.statusCode == 404
        ? "That's no longer available."
        : res.statusCode >= 500
        ? 'Something went wrong on our side. Try again in a moment.'
        : 'Something went wrong.';
    throw ApiException(message, status: res.statusCode, fieldErrors: fieldErrors);
  }
}
