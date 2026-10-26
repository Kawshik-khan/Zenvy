import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../router.dart';
import '../../state/app_state.dart';
import '../../theme/tokens.dart';
import '../../theme/type.dart';
import '../../util/focus_timer.dart';
import '../../widgets/widgets.dart';

const _sounds = ['Lofi focus', 'Soft rain', 'Deep night'];

class FocusScreen extends StatefulWidget {
  const FocusScreen({super.key});

  @override
  State<FocusScreen> createState() => _FocusScreenState();
}

class _FocusScreenState extends State<FocusScreen> {
  String _sound = 'Lofi focus';
  int _round = 1;
  late final FocusTimer _timer = FocusTimer(
    onComplete: (mode) {
      if (mode != FocusMode.focus || !mounted) return;
      AppScope.read(context).completeSession(25);
      setState(() => _round = _round % 4 + 1);
      context.push(withQuery('/focus-done', {'minutes': '25'}));
    },
  );

  @override
  void dispose() {
    _timer.dispose();
    super.dispose();
  }

  void _skip() {
    if (_timer.mode != FocusMode.focus) return _timer.setMode(FocusMode.focus);
    final minutes = _timer.finish();
    AppScope.read(context).completeSession(minutes);
    context.push(withQuery('/focus-done', {'minutes': '$minutes'}));
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
                ZIconButton(icon: LucideIcons.skipForward, label: 'Finish session', size: 48, onTap: _skip),
              ],
            ),
            Row(
              spacing: 12,
              children: [
                Expanded(
                  child: _Stat(value: '${app.sessionsToday}', label: 'Sessions done'),
                ),
                Expanded(
                  child: _Stat(value: '${app.focusMinutesToday}', label: 'Minutes focused'),
                ),
              ],
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              spacing: 10,
              children: [
                const Row(
                  spacing: 8,
                  children: [
                    Icon(LucideIcons.headphones, size: 18, color: Palette.quietInk),
                    ZText('Background sound', variant: TextVariant.h3),
                  ],
                ),
                // Playback needs just_audio and the tracks from public/audio in the web app.
                Row(
                  spacing: 8,
                  children: [
                    for (final s in _sounds)
                      Expanded(
                        child: ZChip(label: s, tone: Tone.focus, padding: 6, selected: _sound == s, onTap: () => setState(() => _sound = s)),
                      ),
                  ],
                ),
              ],
            ),
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
