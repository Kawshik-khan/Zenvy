import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../theme/tokens.dart';
import '../../theme/type.dart';
import 'motion.dart';

/// A tab at the top of Home: drag it down past the line and let go to start a focus session.
/// Tapping it does the same, so the gesture is never the only way in.
class PullToFocus extends StatefulWidget {
  const PullToFocus({super.key});

  @override
  State<PullToFocus> createState() => _PullToFocusState();
}

class _PullToFocusState extends State<PullToFocus> with SingleTickerProviderStateMixin {
  static const _release = 140.0;
  late final _back = AnimationController(vsync: this, duration: const Duration(milliseconds: 320));
  double _drag = 0;
  double _from = 0;
  bool _armed = false;

  @override
  void initState() {
    super.initState();
    // Springs the tab back up after a release.
    _back.addListener(() => setState(() => _drag = _from * (1 - Curves.easeOutCubic.transform(_back.value))));
  }

  @override
  void dispose() {
    _back.dispose();
    super.dispose();
  }

  void _update(DragUpdateDetails d) {
    _back.stop();
    setState(() => _drag = math.max(0, _drag + d.delta.dy * (_drag > _release ? 0.35 : 0.8)));
    final armed = _drag >= _release;
    if (armed != _armed) {
      _armed = armed;
      HapticFeedback.selectionClick();
    }
  }

  void _end([DragEndDetails? _]) {
    if (_armed) {
      HapticFeedback.mediumImpact();
      context.push('/focus');
    }
    _armed = false;
    _from = _drag;
    if (motionOn(context)) {
      _back.forward(from: 0);
    } else {
      setState(() => _drag = 0);
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = (_drag / _release).clamp(0.0, 1.0);
    return Semantics(
      button: true,
      label: 'Start a focus session. Drag down or tap.',
      excludeSemantics: true,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () => context.push('/focus'),
        onVerticalDragUpdate: _update,
        onVerticalDragEnd: _end,
        onVerticalDragCancel: _end,
        child: AnimatedContainer(
          duration: motionOn(context) && _drag == 0 ? const Duration(milliseconds: 200) : Duration.zero,
          height: 36 + _drag,
          margin: const EdgeInsets.only(bottom: 4),
          decoration: BoxDecoration(
            color: Color.lerp(const Color(0x00FFD23F), Palette.focus, p),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Palette.ink.withValues(alpha: p), width: 3),
          ),
          child: _drag < 40
              ? Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  spacing: 6,
                  children: [
                    const Icon(LucideIcons.arrowDown, size: 14, color: Palette.muted),
                    Text('PULL DOWN TO START FOCUS', style: mono(FontWeight.w500, 11, 14, letterSpacing: 0.6).copyWith(color: Palette.muted)),
                  ],
                )
              : ClipRect(
                  child: OverflowBox(
                    maxHeight: double.infinity,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      spacing: 8,
                      children: [
                        SizedBox(
                          width: 72,
                          height: 72,
                          child: Stack(
                            alignment: Alignment.center,
                            children: [
                              CircularProgressIndicator(
                                value: p,
                                strokeWidth: 7,
                                color: Palette.ink,
                                backgroundColor: Palette.paper,
                              ),
                              Text('25:00', style: mono(FontWeight.w700, 15, 18).copyWith(color: Palette.ink)),
                            ],
                          ),
                        ),
                        Text(
                          _armed ? 'RELEASE TO START' : 'KEEP PULLING',
                          style: mono(FontWeight.w700, 12, 14, letterSpacing: 0.8).copyWith(color: Palette.ink),
                        ),
                      ],
                    ),
                  ),
                ),
        ),
      ),
    );
  }
}
