import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/models.dart';
import '../../router.dart';
import '../../theme/tokens.dart';
import '../../theme/type.dart';
import '../../widgets/widgets.dart';
import 'motion.dart';

/// Partners and groupmates who are in a group call or just finished a focus session.
/// Tap opens the call or their profile; long-press shows every shortcut.
class StudyingNowStrip extends StatelessWidget {
  const StudyingNowStrip({super.key, required this.people});
  final List<LivePerson> people;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      spacing: 10,
      children: [
        Row(
          spacing: 8,
          children: [
            _LiveDot(on: people.isNotEmpty),
            Expanded(
              child: Text(
                people.isEmpty ? 'STUDYING NOW' : 'STUDYING NOW · ${people.length}',
                style: mono(FontWeight.w700, 12, 16, letterSpacing: 0.8).copyWith(color: Palette.ink),
              ),
            ),
          ],
        ),
        SizedBox(
          height: 96,
          child: ListView(
            scrollDirection: Axis.horizontal,
            clipBehavior: Clip.none,
            children: [
              _Slot(
                label: 'Go live',
                status: 'Focus',
                onTap: () => context.push('/focus'),
                semanticLabel: 'Start a focus session so others see you studying',
                child: Container(
                  width: 58,
                  height: 58,
                  decoration: BoxDecoration(shape: BoxShape.circle, color: Palette.white, border: Border.all(color: Palette.ink, width: 3)),
                  child: const Icon(LucideIcons.plus, color: Palette.ink, size: 22),
                ),
              ),
              if (people.isEmpty)
                const Padding(
                  padding: EdgeInsets.only(left: 12, top: 14),
                  child: SizedBox(
                    width: 220,
                    child: ZText('Nobody from your circle is studying yet. Start a session and be the first.', variant: TextVariant.small, muted: true),
                  ),
                ),
              for (final p in people)
                _Slot(
                  label: p.user.firstName,
                  status: p.inCall ? 'In call' : 'Focused ${p.minutes}m',
                  semanticLabel: p.inCall ? '${p.user.name} is in a call in ${p.groupName ?? 'a group'}' : '${p.user.name} just focused for ${p.minutes} minutes',
                  onTap: () => _open(context, p),
                  onLongPress: () => _shortcuts(context, p),
                  child: _LiveAvatar(person: p),
                ),
            ],
          ),
        ),
      ],
    );
  }

  static void _open(BuildContext context, LivePerson p) {
    if (p.inCall && p.groupId != null) {
      context.push(withQuery('/call/active', {'groupId': p.groupId, 'title': p.groupName}));
    } else {
      context.push('/partner/${p.user.id}');
    }
  }

  static void _shortcuts(BuildContext context, LivePerson p) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Palette.paper,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        side: BorderSide(color: Palette.ink, width: 3),
      ),
      builder: (sheet) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: 10,
            children: [
              Row(
                spacing: 12,
                children: [
                  Avatar.of(p.user, size: 44),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        ZText(p.user.name, variant: TextVariant.h3, maxLines: 1),
                        ZText(p.inCall ? 'In a call · ${p.groupName ?? 'group'}' : 'Just focused for ${p.minutes} min', variant: TextVariant.small, muted: true),
                      ],
                    ),
                  ),
                ],
              ),
              if (p.inCall && p.groupId != null)
                ZButton(
                  label: 'Join ${p.groupName ?? 'the call'}',
                  variant: ButtonVariant.live,
                  icon: LucideIcons.video,
                  onTap: () {
                    Navigator.pop(sheet);
                    context.push(withQuery('/call/active', {'groupId': p.groupId, 'title': p.groupName}));
                  },
                )
              else
                ZButton(
                  label: 'Focus alongside them',
                  variant: ButtonVariant.focus,
                  icon: LucideIcons.play,
                  onTap: () {
                    Navigator.pop(sheet);
                    context.push('/focus');
                  },
                ),
              ZButton(
                label: 'Message',
                variant: ButtonVariant.chat,
                icon: LucideIcons.messageSquare,
                onTap: () {
                  Navigator.pop(sheet);
                  context.push('/dm/${p.user.id}');
                },
              ),
              ZButton(
                label: 'View profile',
                variant: ButtonVariant.secondary,
                onTap: () {
                  Navigator.pop(sheet);
                  context.push('/partner/${p.user.id}');
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Slot extends StatelessWidget {
  const _Slot({required this.label, required this.status, required this.child, required this.onTap, required this.semanticLabel, this.onLongPress});
  final String label;
  final String status;
  final Widget child;
  final VoidCallback onTap;
  final VoidCallback? onLongPress;
  final String semanticLabel;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: semanticLabel,
      excludeSemantics: true,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        onLongPress: onLongPress,
        child: SizedBox(
          width: 70,
          child: Column(
            spacing: 5,
            children: [
              child,
              Text(label, maxLines: 1, overflow: TextOverflow.ellipsis, style: grotesk(FontWeight.w700, 11, 13).copyWith(color: Palette.ink)),
              Text(status, maxLines: 1, overflow: TextOverflow.ellipsis, style: mono(FontWeight.w500, 9, 11).copyWith(color: Palette.muted)),
            ],
          ),
        ),
      ),
    );
  }
}

/// Avatar inside a green ring; people in a call get a slowly turning dashed ring.
class _LiveAvatar extends StatefulWidget {
  const _LiveAvatar({required this.person});
  final LivePerson person;

  @override
  State<_LiveAvatar> createState() => _LiveAvatarState();
}

class _LiveAvatarState extends State<_LiveAvatar> with SingleTickerProviderStateMixin, LoopTicker {
  @override
  Duration get loopLength => const Duration(seconds: 6);

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 58,
      height: 58,
      child: Stack(
        alignment: Alignment.center,
        children: [
          AnimatedBuilder(
            animation: loop,
            builder: (_, _) => Transform.rotate(
              angle: widget.person.inCall ? loop.value * 2 * math.pi : 0,
              child: CustomPaint(size: const Size.square(58), painter: _RingPainter(dashed: widget.person.inCall)),
            ),
          ),
          Avatar.of(widget.person.user, size: 46),
        ],
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  const _RingPainter({required this.dashed});
  final bool dashed;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Palette.live
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.5;
    final rect = Offset.zero & size;
    final r = rect.deflate(2);
    if (!dashed) {
      canvas.drawOval(r, paint);
      return;
    }
    const dashes = 14;
    const sweep = 2 * math.pi / dashes;
    for (var i = 0; i < dashes; i++) {
      canvas.drawArc(r, i * sweep, sweep * 0.62, false, paint);
    }
  }

  @override
  bool shouldRepaint(_RingPainter old) => old.dashed != dashed;
}

class _LiveDot extends StatefulWidget {
  const _LiveDot({required this.on});
  final bool on;

  @override
  State<_LiveDot> createState() => _LiveDotState();
}

class _LiveDotState extends State<_LiveDot> with SingleTickerProviderStateMixin, LoopTicker {
  @override
  Duration get loopLength => const Duration(milliseconds: 1600);

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: loop,
      builder: (_, _) {
        final pulse = widget.on ? math.sin(loop.value * math.pi) : 0.0;
        return Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: widget.on ? Palette.live : Palette.quietShade,
            border: Border.all(color: Palette.ink, width: 2),
            boxShadow: [BoxShadow(color: Palette.live.withValues(alpha: 0.5 * pulse), blurRadius: 0, spreadRadius: 4 * pulse)],
          ),
        );
      },
    );
  }
}
