import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';

import '../../data/models.dart';
import '../../theme/tokens.dart';
import '../../theme/type.dart';
import '../../widgets/widgets.dart';
import '../partners/connect.dart';
import 'motion.dart';

/// One suggested partner at a time, with why they fit. Skip deals the next card.
class MatchOfTheDay extends StatefulWidget {
  const MatchOfTheDay({super.key, required this.partners});
  final List<Person> partners;

  @override
  State<MatchOfTheDay> createState() => _MatchOfTheDayState();
}

class _MatchOfTheDayState extends State<MatchOfTheDay> with SingleTickerProviderStateMixin {
  late List<Person> _people = [...widget.partners];
  int _index = 0;

  /// Horizontal drag of the card; past [_throw] a release skips it.
  double _dx = 0;
  double _from = 0;
  static const _throw = 110.0;
  late final AnimationController _spring = AnimationController(vsync: this, duration: const Duration(milliseconds: 380))
    ..addListener(() => setState(() => _dx = _from * (1 - Curves.elasticOut.transform(_spring.value))));

  /// The card flips to say "request sent" right after Connect.
  bool _flipped = false;

  @override
  void didUpdateWidget(MatchOfTheDay old) {
    super.didUpdateWidget(old);
    if (old.partners != widget.partners) {
      _people = [...widget.partners];
      _index = 0;
      _flipped = false;
    }
  }

  @override
  void dispose() {
    _spring.dispose();
    super.dispose();
  }

  void _skip() => setState(() {
    _index++;
    _dx = 0;
    _flipped = false;
  });

  void _dragEnd(DragEndDetails d) {
    if (_dx.abs() > _throw || d.primaryVelocity!.abs() > 900) {
      HapticFeedback.lightImpact();
      _skip();
    } else {
      _from = _dx;
      motionOn(context) ? _spring.forward(from: 0) : setState(() => _dx = 0);
    }
  }

  @override
  Widget build(BuildContext context) {
    final done = _index >= _people.length;
    return AnimatedSwitcher(
      duration: motionOn(context) ? const Duration(milliseconds: 320) : Duration.zero,
      transitionBuilder: (child, a) {
        final leaving = child.key != ValueKey(_index);
        return FadeTransition(
          opacity: a,
          child: SlideTransition(
            position: Tween(begin: leaving ? const Offset(-0.25, 0) : const Offset(0.25, 0), end: Offset.zero).animate(a),
            child: RotationTransition(
              turns: Tween(begin: leaving ? -0.02 : 0.02, end: 0.0).animate(a),
              child: child,
            ),
          ),
        );
      },
      child: done
          ? KeyedSubtree(
              key: ValueKey(_index),
              child: _AllCaughtUp(onRestart: _people.isEmpty ? null : () => setState(() => _index = 0)),
            )
          : KeyedSubtree(
              key: ValueKey(_index),
              child: GestureDetector(
                onHorizontalDragUpdate: _flipped ? null : (d) => setState(() => _dx += d.delta.dx),
                onHorizontalDragEnd: _flipped ? null : _dragEnd,
                child: Transform.translate(
                  offset: Offset(_dx, 0),
                  child: Transform.rotate(
                    angle: _dx / 900,
                    child: Opacity(opacity: (1 - _dx.abs() / 400).clamp(0.4, 1), child: _flipCard(_people[_index])),
                  ),
                ),
              ),
            ),
    );
  }

  Widget _flipCard(Person p) {
    return TweenAnimationBuilder<double>(
      tween: Tween(end: _flipped ? 1 : 0),
      duration: motionOn(context) ? const Duration(milliseconds: 520) : Duration.zero,
      curve: Curves.easeInOutBack,
      builder: (_, t, _) {
        final back = t >= 0.5;
        return Transform(
          alignment: Alignment.center,
          transform: Matrix4.identity()
            ..setEntry(3, 2, 0.0012)
            ..rotateY(math.pi * t),
          child: Stack(
            children: [
              // The front always lays out, so both faces are the same size.
              Opacity(
                opacity: back ? 0 : 1,
                child: IgnorePointer(ignoring: back, child: _card(p)),
              ),
              if (back)
                Positioned.fill(
                  child: Transform(alignment: Alignment.center, transform: Matrix4.rotationY(math.pi), child: _sent(p)),
                ),
            ],
          ),
        );
      },
    );
  }

  Widget _sent(Person p) {
    return Container(
      decoration: BoxDecoration(
        color: Palette.match,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Palette.ink, width: 3),
        boxShadow: const [BoxShadow(color: Palette.ink, offset: Offset(5, 5))],
      ),
      padding: const EdgeInsets.all(18),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        spacing: 12,
        children: [
          Avatar.of(p, size: 64),
          ZText('Request sent to ${p.firstName}', variant: TextVariant.h2, align: TextAlign.center),
          const ZText("You'll get a notification when they answer.", variant: TextVariant.body, align: TextAlign.center),
          ZButton(label: 'Next match', variant: ButtonVariant.primary, onTap: _skip),
        ],
      ),
    );
  }

  Widget _card(Person p) {
    return Container(
      decoration: BoxDecoration(
        color: Palette.match,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Palette.ink, width: 3),
        boxShadow: const [BoxShadow(color: Palette.ink, offset: Offset(5, 5))],
      ),
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: 12,
        children: [
          Row(
            children: [
              Expanded(
                child: Text('MATCH OF THE DAY', style: mono(FontWeight.w700, 11, 14, letterSpacing: 0.8).copyWith(color: Palette.ink)),
              ),
              if (_people.length > 1) Text('${_index + 1} of ${_people.length}', style: mono(FontWeight.w500, 11, 14).copyWith(color: Palette.ink)),
            ],
          ),
          Semantics(
            button: true,
            label: 'View ${p.name}\'s profile, ${p.score}% match',
            excludeSemantics: true,
            child: GestureDetector(
              onTap: () => context.push('/partner/${p.id}'),
              child: Row(
                spacing: 14,
                children: [
                  Avatar.of(p, size: 68),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        ZText(p.name, variant: TextVariant.h2, maxLines: 1),
                        ZText(
                          [p.college, p.major, if (p.semester != null) 'Sem ${p.semester}'].whereType<String>().join(' · '),
                          variant: TextVariant.small,
                          maxLines: 2,
                        ),
                      ],
                    ),
                  ),
                  _ScoreRing(score: p.score),
                ],
              ),
            ),
          ),
          if (p.reasons.isNotEmpty)
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [for (final r in p.reasons.take(3)) ZBadge(label: r, tone: Tone.card)],
            ),
          if (p.bio != null) ZText('“${p.bio}”', variant: TextVariant.body, maxLines: 3),
          Row(
            spacing: 10,
            children: [
              Expanded(
                child: ConnectButton(
                  person: p,
                  size: ButtonSize.md,
                  onChanged: (updated) => setState(() {
                    _flipped = updated.connection?.pendingOutgoing == true && p.connection?.pendingOutgoing != true;
                    _people[_index] = updated;
                  }),
                ),
              ),
              ZButton(label: 'Skip', variant: ButtonVariant.secondary, onTap: _skip),
            ],
          ),
        ],
      ),
    );
  }
}

class _AllCaughtUp extends StatelessWidget {
  const _AllCaughtUp({required this.onRestart});
  final VoidCallback? onRestart;

  @override
  Widget build(BuildContext context) {
    return EmptyCard(
      title: onRestart == null ? 'No suggestions yet' : "That's everyone for today",
      detail: onRestart == null ? 'Add interests to your profile to get better matches.' : 'New matches show up as classmates join.',
      action: Wrap(
        spacing: 8,
        children: [
          const ZButton(label: 'Find partners', variant: ButtonVariant.match, size: ButtonSize.sm, href: '/partners'),
          if (onRestart != null) ZButton(label: 'See again', variant: ButtonVariant.ghost, size: ButtonSize.sm, onTap: onRestart),
        ],
      ),
    );
  }
}

class _ScoreRing extends StatelessWidget {
  const _ScoreRing({required this.score});
  final int score;

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: score / 100),
      duration: motionOn(context) ? const Duration(milliseconds: 900) : Duration.zero,
      curve: Curves.easeOutCubic,
      builder: (_, v, _) => SizedBox(
        width: 72,
        height: 72,
        child: CustomPaint(
          painter: _RingPainter(v),
          child: Center(
            child: Text('${(v * 100).round()}%', style: mono(FontWeight.w700, 17, 20).copyWith(color: Palette.ink)),
          ),
        ),
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  const _RingPainter(this.value);
  final double value;

  @override
  void paint(Canvas canvas, Size size) {
    final c = size.center(Offset.zero);
    final r = size.width / 2 - 4;
    canvas.drawCircle(c, r, Paint()..color = Palette.white);
    canvas.drawCircle(
      c,
      r,
      Paint()
        ..color = Palette.ink
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2,
    );
    canvas.drawArc(
      Rect.fromCircle(center: c, radius: r),
      -math.pi / 2,
      2 * math.pi * value.clamp(0, 1),
      false,
      Paint()
        ..color = Palette.ink
        ..style = PaintingStyle.stroke
        ..strokeWidth = 7
        ..strokeCap = StrokeCap.round,
    );
  }

  @override
  bool shouldRepaint(_RingPainter old) => old.value != value;
}
