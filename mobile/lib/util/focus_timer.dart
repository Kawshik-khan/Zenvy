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

  final void Function(FocusMode mode) onComplete;

  FocusMode mode = FocusMode.focus;
  double remaining = modeSeconds[FocusMode.focus]!.toDouble();
  DateTime? _endsAt;
  Timer? _ticker;

  int get total => modeSeconds[mode]!;
  bool get running => _endsAt != null;

  void _tick() {
    final end = _endsAt;
    if (end == null) return;
    final left = end.difference(DateTime.now()).inMilliseconds / 1000;
    if (left <= 0) {
      _stop();
      remaining = total.toDouble();
      notifyListeners();
      onComplete(mode);
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
    remaining = total.toDouble();
    notifyListeners();
  }

  void setMode(FocusMode next) {
    _stop();
    mode = next;
    remaining = total.toDouble();
    notifyListeners();
  }

  /// Ends the current round now, returning the elapsed minutes.
  int finish() {
    final elapsed = total - remaining;
    _stop();
    remaining = total.toDouble();
    notifyListeners();
    return (elapsed / 60).round().clamp(1, 1 << 31);
  }

  @override
  void dispose() {
    _stop();
    super.dispose();
  }
}
