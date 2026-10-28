import 'package:flutter/material.dart';

/// False when the system asks for reduced motion; loops and entrances are skipped then.
bool motionOn(BuildContext context) => !(MediaQuery.maybeDisableAnimationsOf(context) ?? false);

/// Home sections slide up 12px and fade in, one after another.
class Enter extends StatefulWidget {
  const Enter({super.key, required this.index, required this.child});
  final int index;
  final Widget child;

  @override
  State<Enter> createState() => _EnterState();
}

class _EnterState extends State<Enter> with SingleTickerProviderStateMixin {
  static const _step = 50;
  static const _length = 320;

  late final _c = AnimationController(vsync: this, duration: Duration(milliseconds: widget.index * _step + _length));
  late final _t = CurvedAnimation(parent: _c, curve: Interval(widget.index * _step / (widget.index * _step + _length), 1, curve: Curves.easeOutCubic));

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_c.isDismissed) motionOn(context) ? _c.forward() : _c.value = 1;
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
