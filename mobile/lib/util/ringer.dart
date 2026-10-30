import 'package:flutter/services.dart';
import 'package:vibration/vibration.dart';

/// Rings the phone for an incoming call: the device's own ringtone on a loop (MainActivity.kt on
/// Android; iOS has no ringtone API, so it only vibrates) plus a steady long-buzz vibration.
/// It rings during focus sessions too; a call is never held back.
class Ringer {
  Ringer._();

  static const _channel = MethodChannel('zenvy/ringer');
  static bool _ringing = false;

  /// Buzz, pause, buzz, then a longer rest, repeated until [stop].
  static const _pattern = [0, 700, 400, 700, 1400];

  static Future<void> start() async {
    if (_ringing) return;
    _ringing = true;
    try {
      await _channel.invokeMethod<void>('start');
    } catch (_) {
      // No ringtone here (tests, iOS): the screen and vibration still announce the call.
    }
    try {
      if (await Vibration.hasVibrator()) await Vibration.vibrate(pattern: _pattern, repeat: 0);
    } catch (_) {}
  }

  static Future<void> stop() async {
    if (!_ringing) return;
    _ringing = false;
    try {
      await _channel.invokeMethod<void>('stop');
    } catch (_) {}
    try {
      await Vibration.cancel();
    } catch (_) {}
  }
}
