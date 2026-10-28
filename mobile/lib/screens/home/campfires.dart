import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../data/models.dart';
import '../../theme/tokens.dart';
import '../../theme/type.dart';
import '../../widgets/widgets.dart';
import 'motion.dart';

/// Each group is a campfire: the busier it was this week, the bigger the flame.
/// A live call makes it burn red; a quiet group's fire is out.
class GroupCampfires extends StatelessWidget {
  const GroupCampfires({super.key, required this.groups, required this.activity});
  final List<GroupCard> groups;
  final Map<String, GroupActivity> activity;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      spacing: 10,
      children: [
        const SectionHeader(
          title: 'Group campfires',
          action: ZButton(label: 'All groups', variant: ButtonVariant.ghost, size: ButtonSize.sm, href: '/groups'),
        ),
        if (groups.isEmpty)
          const EmptyCard(
            title: "You're not in a group yet",
            detail: 'Join one to chat, share notes and plan sessions.',
            action: ZButton(label: 'Find a group', variant: ButtonVariant.chat, size: ButtonSize.sm, href: '/groups'),
          )
        else
          IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              spacing: 10,
              children: [
                for (final g in groups.take(3)) Expanded(child: _Campfire(group: g, activity: activity[g.id])),
                for (var i = groups.length; i < 3; i++) const Expanded(child: SizedBox()),
              ],
            ),
          ),
      ],
    );
  }
}

class _Campfire extends StatelessWidget {
  const _Campfire({required this.group, required this.activity});
  final GroupCard group;
  final GroupActivity? activity;

  @override
  Widget build(BuildContext context) {
    final live = activity?.live ?? false;
    final msgs = activity?.messagesThisWeek ?? 0;
    // 0 = out, 1–3 = growing flame.
    final heat = live
        ? 3
        : msgs >= 30
        ? 3
        : msgs >= 10
        ? 2
        : msgs > 0
        ? 1
        : 0;
    final meta = live
        ? 'Call live'
        : msgs > 0
        ? '$msgs msg${msgs == 1 ? '' : 's'} this week'
        : 'Quiet this week';
    return Surface(
      tone: heat == 0 ? Tone.paper : Tone.card,
      shadow: ShadowSize.sm,
      onTap: () => context.push('/group-room/${group.id}'),
      semanticLabel: 'Open ${group.name}. $meta',
      padding: const EdgeInsets.fromLTRB(8, 12, 8, 12),
      child: Column(
        spacing: 6,
        children: [
          SizedBox(height: 58, child: Align(alignment: Alignment.bottomCenter, child: _Flame(heat: heat, live: live))),
          ZText(group.name, variant: TextVariant.strong, align: TextAlign.center, maxLines: 2, style: const TextStyle(fontSize: 13, height: 15 / 13)),
          Text(
            meta,
            textAlign: TextAlign.center,
            maxLines: 2,
            style: mono(live ? FontWeight.w700 : FontWeight.w500, 10, 12).copyWith(color: live ? Palette.ink : Palette.muted),
          ),
        ],
      ),
    );
  }
}

class _Flame extends StatefulWidget {
  const _Flame({required this.heat, required this.live});
  final int heat;
  final bool live;

  @override
  State<_Flame> createState() => _FlameState();
}

class _FlameState extends State<_Flame> with SingleTickerProviderStateMixin, LoopTicker {
  // Busier fires flicker faster.
  @override
  Duration get loopLength => Duration(milliseconds: 1400 - widget.heat * 250);

  @override
  Widget build(BuildContext context) {
    final size = const [26.0, 32.0, 42.0, 54.0][widget.heat];
    final color = widget.heat == 0
        ? Palette.quietShade
        : widget.live || widget.heat == 3
        ? Palette.alert
        : Palette.focus;
    return AnimatedBuilder(
      animation: loop,
      builder: (_, _) {
        final t = loop.value * 2 * math.pi;
        final flicker = widget.heat == 0 ? 0.0 : 1.0;
        return Transform(
          alignment: Alignment.bottomCenter,
          transform: Matrix4.identity()
            ..scaleByDouble(1 + 0.04 * flicker * math.sin(t * 2), 1 + 0.08 * flicker * math.sin(t), 1, 1)
            ..setEntry(0, 1, 0.06 * flicker * math.sin(t * 1.5)),
          child: CustomPaint(size: Size(size, size), painter: _FlamePainter(color)),
        );
      },
    );
  }
}

class _FlamePainter extends CustomPainter {
  const _FlamePainter(this.color);
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final s = size.width / 24;
    // The lucide-style flame used in the design, on a 24-unit grid.
    final path = Path()
      ..moveTo(12 * s, 2 * s)
      ..cubicTo(13 * s, 6 * s, 18 * s, 8 * s, 18 * s, 14 * s)
      ..arcToPoint(Offset(6 * s, 14 * s), radius: Radius.circular(6 * s))
      ..cubicTo(6 * s, 11 * s, 8 * s, 9 * s, 9 * s, 7 * s)
      ..cubicTo(9 * s, 9 * s, 10 * s, 10 * s, 11 * s, 10 * s)
      ..cubicTo(11 * s, 7 * s, 10 * s, 5 * s, 12 * s, 2 * s)
      ..close();
    canvas.drawPath(path, Paint()..color = color);
    canvas.drawPath(
      path,
      Paint()
        ..color = Palette.ink
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.6 * s
        ..strokeJoin = StrokeJoin.round,
    );
  }

  @override
  bool shouldRepaint(_FlamePainter old) => old.color != color;
}
