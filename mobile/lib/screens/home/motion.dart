import 'dart:math' as math;

import 'package:flutter/material.dart';

/// False when the system asks for reduced motion; loops and entrances are skipped then.
bool motionOn(BuildContext context) => !(MediaQuery.maybeDisableAnimationsOf(context) ?? false);

/// Home sections slide up 12px and fade in, one after another.
class Enter extends StatefulWidget {
  const Enter({super.key, required this.index, required this.child});

  /// Set once Home has shown; later visits skip the entrance.
  static bool played = false;
  final int index;
  final Widget child;

  @override
  State<Enter> createState() => _EnterState();
}

class _EnterState extends State<Enter> with SingleTickerProviderStateMixin {
  static const _step = 50;
  static const _length = 320;

  late final _c = AnimationController(
    vsync: this,
    duration: Duration(milliseconds: widget.index * _step + _length),
  );
  late final _t = CurvedAnimation(
    parent: _c,
    curve: Interval(widget.index * _step / (widget.index * _step + _length), 1, curve: Curves.easeOutCubic),
  );

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_c.isDismissed) motionOn(context) && !Enter.played ? _c.forward() : _c.value = 1;
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: _t,
    child: widget.child,
    builder: (_, child) => Opacity(
      opacity: _t.value,
      child: Transform.translate(offset: Offset(0, 12 * (1 - _t.value)), child: child),
    ),
  );
}

/// A repeating 0→1 clock for ambient loops (twinkle, flicker, pulse). Stays still under reduced motion.
mixin LoopTicker<T extends StatefulWidget> on State<T>, SingleTickerProviderStateMixin<T> {
  Duration get loopLength;
  late final AnimationController loop = AnimationController(vsync: this, duration: loopLength);

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (motionOn(context)) {
      if (!loop.isAnimating) loop.repeat();
    } else {
      loop.stop();
    }
  }

  @override
  void dispose() {
    loop.dispose();
    super.dispose();
  }
}

/// Text whose characters roll like an odometer when they change (countdowns, counters).
class RollingText extends StatelessWidget {
  const RollingText(this.text, {super.key, required this.style});
  final String text;
  final TextStyle style;

  @override
  Widget build(BuildContext context) {
    final animate = motionOn(context);
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        for (var i = 0; i < text.length; i++)
          ClipRect(
            child: AnimatedSwitcher(
              duration: animate ? const Duration(milliseconds: 260) : Duration.zero,
              switchInCurve: Curves.easeOutCubic,
              switchOutCurve: Curves.easeInCubic,
              transitionBuilder: (child, a) {
                final incoming = child.key == ValueKey('$i${text[i]}');
                return SlideTransition(
                  position: Tween(begin: Offset(0, incoming ? -1 : 1), end: Offset.zero).animate(a),
                  child: child,
                );
              },
              layoutBuilder: (current, previous) => Stack(alignment: Alignment.center, children: [...previous, ?current]),
              child: Text(text[i], key: ValueKey('$i${text[i]}'), style: style),
            ),
          ),
      ],
    );
  }
}

/// A slow scale-and-glow loop that says "this is about to happen".
class Breathe extends StatefulWidget {
  const Breathe({super.key, required this.on, required this.child});
  final bool on;
  final Widget child;

  @override
  State<Breathe> createState() => _BreatheState();
}

class _BreatheState extends State<Breathe> with SingleTickerProviderStateMixin, LoopTicker {
  @override
  Duration get loopLength => const Duration(milliseconds: 1800);

  @override
  Widget build(BuildContext context) {
    if (!widget.on) return widget.child;
    return AnimatedBuilder(
      animation: loop,
      child: widget.child,
      builder: (_, child) {
        final t = 0.5 - 0.5 * math.cos(loop.value * 2 * math.pi);
        return Transform.scale(scale: 1 + 0.018 * t, child: child);
      },
    );
  }
}

/// Pops a newly arrived item in with a small overshoot. Key it by the item's id.
class PopIn extends StatelessWidget {
  const PopIn({super.key, required this.child, this.delay = 0});
  final Widget child;
  final int delay;

  @override
  Widget build(BuildContext context) {
    if (!motionOn(context)) return child;
    const length = 420;
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: Duration(milliseconds: length + delay),
      curve: Interval(delay / (length + delay), 1, curve: Curves.elasticOut),
      builder: (_, t, child) => Transform.scale(scale: t, child: child),
      child: child,
    );
  }
}

/// Grey placeholder blocks for Home while it loads, swept by a hard-edged stripe.
class HomeSkeleton extends StatefulWidget {
  const HomeSkeleton({super.key});

  @override
  State<HomeSkeleton> createState() => _HomeSkeletonState();
}

class _HomeSkeletonState extends State<HomeSkeleton> with SingleTickerProviderStateMixin, LoopTicker {
  @override
  Duration get loopLength => const Duration(milliseconds: 1400);

  Widget _block(double h, {double? w, double radius = 18}) => SizedBox(
    width: w,
    height: h,
    child: AnimatedBuilder(
      animation: loop,
      builder: (_, _) => CustomPaint(painter: _StripePainter(loop.value, radius)),
    ),
  );

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Loading',
      liveRegion: true,
      child: ExcludeSemantics(
        child: ListView(
          physics: const NeverScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(20, 48, 20, 20),
          children: [
            Row(
              spacing: 12,
              children: [
                _block(48, w: 48, radius: 24),
                Expanded(child: _block(34, radius: 8)),
                _block(44, w: 44, radius: 10),
              ],
            ),
            const SizedBox(height: 20),
            Row(spacing: 12, children: [for (var i = 0; i < 4; i++) _block(58, w: 58, radius: 29)]),
            const SizedBox(height: 24),
            _block(220),
            const SizedBox(height: 20),
            _block(260),
          ],
        ),
      ),
    );
  }
}

class _StripePainter extends CustomPainter {
  _StripePainter(this.t, this.radius);
  final double t;
  final double radius;

  @override
  void paint(Canvas canvas, Size size) {
    final rr = RRect.fromRectAndRadius(Offset.zero & size, Radius.circular(radius));
    canvas.drawRRect(rr, Paint()..color = const Color(0xFFE8DFCC));
    canvas.save();
    canvas.clipRRect(rr);
    // A solid, slanted band; no soft gradient, to match the flat brutal style.
    final x = -60 + (size.width + 120) * t;
    final band = Path()
      ..moveTo(x, 0)
      ..lineTo(x + 34, 0)
      ..lineTo(x + 14, size.height)
      ..lineTo(x - 20, size.height)
      ..close();
    canvas.drawPath(band, Paint()..color = const Color(0xFFF4EEE2));
    canvas.restore();
    canvas.drawRRect(
      rr.deflate(1),
      Paint()
        ..color = const Color(0xFF111111)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2,
    );
  }

  @override
  bool shouldRepaint(_StripePainter old) => old.t != t;
}
