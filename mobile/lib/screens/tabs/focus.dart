import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/models.dart';
import '../../router.dart';
import '../../state/app_state.dart';
import '../../theme/tokens.dart';
import '../../theme/type.dart';
import '../../util/focus_timer.dart';
import '../../widgets/widgets.dart';

class FocusScreen extends StatefulWidget {
  const FocusScreen({super.key});

  @override
  State<FocusScreen> createState() => _FocusScreenState();
}

class _FocusScreenState extends State<FocusScreen> {
  int _round = 1;
  late final FocusTimer _timer = FocusTimer(
    onComplete: (mode, startedAt) {
      if (mode != FocusMode.focus || !mounted) return;
      setState(() => _round = _round % 4 + 1);
      _log(minutes: 25, startedAt: startedAt);
    },
  );

  @override
  void dispose() {
    _timer.dispose();
    super.dispose();
  }

  /// Saves a finished focus round to the server (it counts toward stats, streaks and XP),
  /// then shows the session summary.
  Future<void> _log({required int minutes, required DateTime startedAt}) async {
    final app = AppScope.read(context);
    var saved = true;
    try {
      await app.api.logFocusSession(startedAt: startedAt, endedAt: DateTime.now(), plannedMinutes: 25, completedMinutes: minutes);
      app.touch();
    } catch (error) {
      saved = false;
      if (mounted) showError(context, error);
    }
    if (mounted) context.push(withQuery('/focus-done', {'minutes': '$minutes', 'saved': saved ? '1' : '0'}));
  }

  void _skip() {
    if (_timer.mode != FocusMode.focus) return _timer.setMode(FocusMode.focus);
    if (_timer.roundStartedAt == null) return showMessage(context, 'Start the timer first.');
    final elapsed = _timer.total - _timer.remaining;
    if (elapsed < 60) {
      _timer.reset();
      return showMessage(context, 'Under a minute, so this round wasn\'t saved.');
    }
    final round = _timer.finish();
    _log(minutes: round.minutes, startedAt: round.startedAt);
  }

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    return ListenableBuilder(
      listenable: _timer,
      builder: (context, _) {
        final t = _timer;
        final progress = 1 - t.remaining / t.total;
        final ring = t.mode == FocusMode.focus ? Palette.focus : Palette.live;
        final status = t.running ? (t.mode == FocusMode.focus ? 'Deep work · in progress' : 'Breathe. Stretch.') : 'Paused · ready when you are';
        final clock = formatClock(t.remaining);

        return Screen(
          volume: Volume.quiet,
          tabBar: true,
          gap: 20,
          children: [
            ConstrainedBox(
              constraints: const BoxConstraints(minHeight: 44),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const ZText('Focus', variant: TextVariant.title, header: true, style: TextStyle(fontSize: 22)),
                  ZText('Round $_round of 4', variant: TextVariant.label),
                ],
              ),
            ),
            Segmented<FocusMode>(
              label: 'Timer mode',
              value: t.mode,
              onChanged: t.setMode,
              options: const [
                SegmentOption(FocusMode.focus, 'Focus'),
                SegmentOption(FocusMode.short, 'Short break'),
                SegmentOption(FocusMode.long, 'Long break'),
              ],
            ),
            Center(
              child: SizedBox(
                width: 300,
                height: 300,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    Positioned.fill(
                      child: ExcludeSemantics(child: CustomPaint(painter: _RingPainter(progress, ring))),
                    ),
                    Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          clock,
                          semanticsLabel: 'Time remaining $clock',
                          style: mono(FontWeight.w700, 62, 70, letterSpacing: -1).copyWith(color: Palette.quietInk),
                        ),
                        ZText(status, variant: TextVariant.small, muted: true),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              spacing: 22,
              children: [
                ZIconButton(icon: LucideIcons.rotateCcw, label: 'Reset timer', onTap: t.reset, size: 48),
                _PlayButton(running: t.running, onTap: t.running ? t.pause : t.start),
                ZIconButton(
                  icon: LucideIcons.skipForward,
                  label: t.mode == FocusMode.focus ? 'Finish and save this round' : 'Back to focus',
                  size: 48,
                  onTap: _skip,
                ),
              ],
            ),
            Loader<StudyStats>(
              load: app.api.stats,
              frame: (context, body) => const SizedBox(height: 72),
              builder: (context, stats, _) => IntrinsicHeight(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  spacing: 12,
                  children: [
                    Expanded(
                      child: _Stat(value: '${stats.todaySessions}', label: 'Sessions today'),
                    ),
                    Expanded(
                      child: _Stat(value: formatMinutes(stats.todayMinutes), label: 'Focused today'),
                    ),
                    Expanded(
                      child: _Stat(value: '${stats.streakDays}d', label: 'Streak'),
                    ),
                  ],
                ),
              ),
            ),
            ZText('Finished rounds are saved to your study stats.', variant: TextVariant.small, muted: true, align: TextAlign.center),
          ],
        );
      },
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({required this.value, required this.label});
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) => Surface(
    shadow: ShadowSize.none,
    padding: const EdgeInsets.all(12),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(value, style: mono(FontWeight.w700, 22, 28).copyWith(color: Palette.quietInk)),
        ZText(label, variant: TextVariant.small, muted: true, style: const TextStyle(fontSize: 12)),
      ],
    ),
  );
}

class _PlayButton extends StatefulWidget {
  const _PlayButton({required this.running, required this.onTap});
  final bool running;
  final VoidCallback onTap;

  @override
  State<_PlayButton> createState() => _PlayButtonState();
}

class _PlayButtonState extends State<_PlayButton> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: widget.running ? 'Pause timer' : 'Start timer',
      excludeSemantics: true,
      child: GestureDetector(
        onTapDown: (_) => setState(() => _pressed = true),
        onTapUp: (_) => setState(() => _pressed = false),
        onTapCancel: () => setState(() => _pressed = false),
        onTap: widget.onTap,
        child: Transform.translate(
          offset: _pressed ? const Offset(3, 3) : Offset.zero,
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              Positioned(
                left: 4,
                top: 4,
                child: Container(
                  width: 88,
                  height: 88,
                  decoration: const BoxDecoration(color: Palette.quietInk, shape: BoxShape.circle),
                ),
              ),
              Container(
                width: 88,
                height: 88,
                decoration: BoxDecoration(
                  color: Palette.focus,
                  shape: BoxShape.circle,
                  border: Border.all(color: Palette.quietInk, width: 2),
                ),
                child: Icon(widget.running ? Icons.pause_rounded : Icons.play_arrow_rounded, size: 44, color: Palette.quietInk),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  _RingPainter(this.progress, this.color);
  final double progress;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    const r = 120.0;
    final c = size.center(Offset.zero);
    canvas.drawCircle(c, r, Paint()..color = Palette.quietCard);
    canvas.drawCircle(
      c,
      r,
      Paint()
        ..color = Palette.quietInk
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2,
    );
    final track = Paint()
      ..color = Palette.quietShade
      ..style = PaintingStyle.stroke
      ..strokeWidth = 22;
    canvas.drawCircle(c, r, track);
    if (progress > 0) {
      canvas.drawArc(
        Rect.fromCircle(center: c, radius: r),
        -math.pi / 2,
        2 * math.pi * progress.clamp(0.0, 1.0),
        false,
        track
          ..color = color
          ..strokeCap = StrokeCap.round,
      );
    }
  }

  @override
  bool shouldRepaint(_RingPainter old) => old.progress != progress || old.color != color;
}
