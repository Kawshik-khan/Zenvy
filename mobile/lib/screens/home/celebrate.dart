import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../../theme/tokens.dart';
import '../../theme/type.dart';
import '../../widgets/widgets.dart';
import 'motion.dart';

const _confettiColors = [Palette.focus, Palette.match, Palette.chat, Palette.live, Palette.career, Palette.alert];

/// Chunky ink-outlined confetti flying out from the centre, with an optional "+XP" floating up.
/// Plays once when [play] is true at mount.
class Burst extends StatefulWidget {
  const Burst({super.key, required this.play, required this.child, this.label, this.pieces = 14, this.spread = 70});
  final bool play;
  final Widget child;
  final String? label;
  final int pieces;
  final double spread;

  @override
  State<Burst> createState() => _BurstState();
}

class _BurstState extends State<Burst> with SingleTickerProviderStateMixin {
  late final _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 1100));

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (widget.play && _c.isDismissed && motionOn(context)) {
      HapticFeedback.mediumImpact();
      _c.forward();
    }
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      alignment: Alignment.center,
      children: [
        widget.child,
        Positioned.fill(
          child: IgnorePointer(
            child: AnimatedBuilder(
              animation: _c,
              builder: (_, _) => _c.isAnimating
                  ? CustomPaint(
                      painter: ConfettiPainter(t: _c.value, pieces: widget.pieces, spread: widget.spread),
                    )
                  : const SizedBox(),
            ),
          ),
        ),
        if (widget.label != null)
          Positioned(
            right: 0,
            child: IgnorePointer(
              child: AnimatedBuilder(
                animation: _c,
                builder: (_, _) {
                  if (!_c.isAnimating) return const SizedBox();
                  final t = Curves.easeOutCubic.transform(_c.value);
                  return Opacity(
                    opacity: (1 - _c.value).clamp(0, 1),
                    child: Transform.translate(
                      offset: Offset(0, -46 * t),
                      child: Text(widget.label!, style: mono(FontWeight.w700, 14, 16).copyWith(color: Palette.ink)),
                    ),
                  );
                },
              ),
            ),
          ),
      ],
    );
  }
}

class ConfettiPainter extends CustomPainter {
  ConfettiPainter({required this.t, required this.pieces, required this.spread, this.seed = 3});
  final double t;
  final int pieces;
  final double spread;
  final int seed;

  @override
  void paint(Canvas canvas, Size size) {
    final rnd = math.Random(seed);
    final c = size.center(Offset.zero);
    final out = Curves.easeOutCubic.transform(t);
    final fade = (1 - t).clamp(0.0, 1.0);
    final outline = Paint()
      ..color = Palette.ink.withValues(alpha: fade)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;
    for (var i = 0; i < pieces; i++) {
      final angle = i / pieces * 2 * math.pi + rnd.nextDouble() * 0.5;
      final dist = spread * (0.6 + rnd.nextDouble() * 0.6) * out;
      // Pieces fly out, then gravity pulls them down.
      final p = c + Offset(math.cos(angle) * dist, math.sin(angle) * dist + 40 * t * t);
      final s = 5 + rnd.nextDouble() * 4;
      final fill = Paint()..color = _confettiColors[i % _confettiColors.length].withValues(alpha: fade);
      canvas.save();
      canvas.translate(p.dx, p.dy);
      canvas.rotate(angle + t * 6 * (rnd.nextBool() ? 1 : -1));
      final rect = Rect.fromCenter(center: Offset.zero, width: s, height: i.isEven ? s : s * 1.8);
      canvas.drawRect(rect, fill);
      canvas.drawRect(rect, outline);
      canvas.restore();
    }
  }

  @override
  bool shouldRepaint(ConfettiPainter old) => old.t != t;
}

/// Remembers the level the user last saw, so reaching a new one is celebrated exactly once.
abstract final class LevelWatch {
  static const _key = 'zenvy.lastSeenLevel';
  static int? _seen;
  static bool _checking = false;

  /// Shows the level-up takeover when [level] is above the last level this device saw.
  static Future<void> check(BuildContext context, int level) async {
    if (_checking || level <= 0) return;
    _checking = true;
    try {
      _seen ??= await _read();
      final seen = _seen;
      _seen = level;
      if (seen == null || level <= seen) {
        if (seen != level) await _write(level);
        return;
      }
      await _write(level);
      if (!context.mounted) return;
      await showGeneralDialog<void>(
        context: context,
        barrierDismissible: true,
        barrierLabel: 'Close',
        barrierColor: const Color(0xF5111111),
        transitionDuration: motionOn(context) ? const Duration(milliseconds: 200) : Duration.zero,
        pageBuilder: (_, _, _) => LevelUpTakeover(level: level),
      );
    } finally {
      _checking = false;
    }
  }

  static Future<int?> _read() async {
    try {
      return int.tryParse(await const FlutterSecureStorage().read(key: _key) ?? '');
    } catch (_) {
      return null;
    }
  }

  static Future<void> _write(int level) async {
    try {
      await const FlutterSecureStorage().write(key: _key, value: '$level');
    } catch (_) {}
  }
}

/// Full-screen "Level up" moment: the badge slams in, the screen shakes, confetti flies.
class LevelUpTakeover extends StatefulWidget {
  const LevelUpTakeover({super.key, required this.level});
  final int level;

  @override
  State<LevelUpTakeover> createState() => _LevelUpTakeoverState();
}

class _LevelUpTakeoverState extends State<LevelUpTakeover> with SingleTickerProviderStateMixin {
  late final _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 1600));

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_c.isDismissed) {
      HapticFeedback.heavyImpact();
      motionOn(context) ? _c.forward() : _c.value = 1;
    }
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      type: MaterialType.transparency,
      child: SafeArea(
        child: AnimatedBuilder(
          animation: _c,
          builder: (context, _) {
            final t = _c.value;
            final slam = Curves.easeOutBack.transform((t / 0.3).clamp(0, 1));
            final scale = 2.2 - 1.2 * slam;
            // A short shake right as the badge lands.
            final shakeT = ((t - 0.25) / 0.2).clamp(0.0, 1.0);
            final shake = shakeT > 0 && shakeT < 1 ? math.sin(shakeT * math.pi * 6) * 8 * (1 - shakeT) : 0.0;
            return Transform.translate(
              offset: Offset(shake, 0),
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.all(28),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    spacing: 18,
                    children: [
                      Text('LEVEL UP', style: mono(FontWeight.w700, 14, 18, letterSpacing: 2).copyWith(color: Palette.focus)),
                      SizedBox(
                        width: 220,
                        height: 220,
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            if (t > 0.25 && t < 1)
                              Positioned.fill(
                                child: CustomPaint(painter: ConfettiPainter(t: ((t - 0.25) / 0.75).clamp(0, 1), pieces: 26, spread: 140, seed: 11)),
                              ),
                            Opacity(
                              opacity: slam.clamp(0, 1),
                              child: Transform.scale(
                                scale: scale,
                                child: CustomPaint(
                                  size: const Size(120, 132),
                                  painter: _BigHex(),
                                  child: SizedBox(
                                    width: 120,
                                    height: 132,
                                    child: Column(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Text('LVL', style: mono(FontWeight.w700, 14, 16).copyWith(color: Palette.ink)),
                                        Text('${widget.level}', style: mono(FontWeight.w700, 52, 56).copyWith(color: Palette.ink)),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      Opacity(
                        opacity: ((t - 0.35) / 0.3).clamp(0, 1),
                        child: Column(
                          spacing: 10,
                          children: [
                            Text(
                              'Level ${widget.level} Scholar',
                              textAlign: TextAlign.center,
                              style: grotesk(FontWeight.w700, 30, 34).copyWith(color: Palette.paper),
                            ),
                            Text(
                              'Every focused hour and every session you join got you here.',
                              textAlign: TextAlign.center,
                              style: grotesk(FontWeight.w500, 15, 21).copyWith(color: Palette.quietShade),
                            ),
                            const SizedBox(height: 6),
                            SizedBox(
                              width: 220,
                              child: ZButton(label: 'Keep going', variant: ButtonVariant.focus, size: ButtonSize.lg, onTap: () => Navigator.pop(context)),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

class _BigHex extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    final path = Path()
      ..moveTo(w / 2, 3)
      ..lineTo(w - 3, h * 0.26)
      ..lineTo(w - 3, h * 0.74)
      ..lineTo(w / 2, h - 3)
      ..lineTo(3, h * 0.74)
      ..lineTo(3, h * 0.26)
      ..close();
    canvas.drawPath(path.shift(const Offset(6, 6)), Paint()..color = Palette.focus.withValues(alpha: 0.35));
    canvas.drawPath(path, Paint()..color = Palette.focus);
    canvas.drawPath(
      path,
      Paint()
        ..color = Palette.ink
        ..style = PaintingStyle.stroke
        ..strokeWidth = 5
        ..strokeJoin = StrokeJoin.round,
    );
  }

  @override
  bool shouldRepaint(_BigHex old) => false;
}
