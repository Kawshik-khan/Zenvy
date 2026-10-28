import 'dart:async';

import 'package:flutter/foundation.dart';

enum FocusMode { focus, short, long }

const modeSeconds = {FocusMode.focus: 25 * 60, FocusMode.short: 5 * 60, FocusMode.long: 15 * 60};

String formatClock(num seconds) {
  final s = seconds.ceil().clamp(0, 1 << 31);
  return '${(s ~/ 60).toString().padLeft(2, '0')}:${(s % 60).toString().padLeft(2, '0')}';
}

/// Pomodoro timer. Counts against a wall-clock end time so it stays accurate when ticks
/// are delayed (app backgrounded, low-power mode).
class FocusTimer extends ChangeNotifier {
  FocusTimer({required this.onComplete});

  /// Called when a round runs out, with when it first started (for logging the session).
  final void Function(FocusMode mode, DateTime startedAt) onComplete;

  FocusMode mode = FocusMode.focus;
  double remaining = modeSeconds[FocusMode.focus]!.toDouble();
  DateTime? _endsAt;
  Timer? _ticker;

  /// When the current round was first started; pauses don't move it. Null before the first start.
  DateTime? roundStartedAt;

  int get total => modeSeconds[mode]!;
  bool get running => _endsAt != null;

  void _tick() {
    final end = _endsAt;
    if (end == null) return;
    final left = end.difference(DateTime.now()).inMilliseconds / 1000;
    if (left <= 0) {
      final startedAt = roundStartedAt ?? DateTime.now().subtract(Duration(seconds: total));
      _stop();
      roundStartedAt = null;
      remaining = total.toDouble();
      notifyListeners();
      onComplete(mode, startedAt);
    } else {
      remaining = left;
      notifyListeners();
    }
  }

  void _stop() {
    _endsAt = null;
    _ticker?.cancel();
    _ticker = null;
  }

  void start() {
    final left = remaining <= 0 ? total.toDouble() : remaining;
    remaining = left;
    roundStartedAt ??= DateTime.now();
    _endsAt = DateTime.now().add(Duration(milliseconds: (left * 1000).round()));
    _ticker?.cancel();
    _ticker = Timer.periodic(const Duration(milliseconds: 250), (_) => _tick());
    notifyListeners();
  }

  void pause() {
    _stop();
    notifyListeners();
  }

  void reset() {
    _stop();
    roundStartedAt = null;
    remaining = total.toDouble();
    notifyListeners();
  }

  void setMode(FocusMode next) {
    _stop();
    roundStartedAt = null;
    mode = next;
    remaining = total.toDouble();
    notifyListeners();
  }

  /// Ends the current round now, returning the elapsed minutes and when it started.
  ({int minutes, DateTime startedAt}) finish() {
    final elapsed = total - remaining;
    final startedAt = roundStartedAt ?? DateTime.now().subtract(Duration(seconds: elapsed.round()));
    _stop();
    roundStartedAt = null;
    remaining = total.toDouble();
    notifyListeners();
    return (minutes: (elapsed / 60).round().clamp(1, total ~/ 60), startedAt: startedAt);
  }

  @override
  void dispose() {
    _stop();
    super.dispose();
  }
}
