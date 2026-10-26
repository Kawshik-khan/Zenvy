import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/sample.dart';
import '../../theme/tokens.dart';
import '../../widgets/widgets.dart';
import '../missing.dart';

class _Step extends StatelessWidget {
  const _Step({required this.icon, required this.fill, required this.title, required this.detail, required this.onTap});

  final IconData icon;
  final Color fill;
  final String title;
  final String detail;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Surface(
    shadow: ShadowSize.sm,
    radius: 12,
    onTap: onTap,
    semanticLabel: '$title. $detail',
    padding: const EdgeInsets.all(12),
    child: Row(
      spacing: 12,
      children: [
        IconTile(icon: icon, fill: fill, size: 40),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ZText(title, variant: TextVariant.h3),
              ZText(detail, variant: TextVariant.small, muted: true),
            ],
          ),
        ),
        const Icon(LucideIcons.chevronRight, size: 20, color: Palette.ink),
      ],
    ),
  );
}

class MatchedScreen extends StatelessWidget {
  const MatchedScreen({super.key, required this.id});
  final String id;

  @override
  Widget build(BuildContext context) {
    final p = partnerById(id);
    if (p == null) return const Missing(to: '/partners');

    Widget tilted(double deg, Widget child) => Transform.rotate(angle: deg * math.pi / 180, child: child);

    return Screen(
      background: Palette.match,
      body: Stack(
        children: [
          const GridBackground(opacity: 0.12),
          SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(24, 40, 24, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              spacing: 22,
              children: [
                ExcludeSemantics(
                  child: SizedBox(
                    height: 160,
                    child: Stack(
                      alignment: Alignment.topCenter,
                      children: [
                        Positioned(
                          left: 40,
                          top: 10,
                          child: tilted(
                            -6,
                            Surface(
                              radius: Radii.pill,
                              borderWidth: 0,
                              fill: const Color(0x00000000),
                              child: Avatar(initials: me.initials, color: Palette.focus, size: 128),
                            ),
                          ),
                        ),
                        Positioned(
                          right: 40,
                          top: 10,
                          child: tilted(
                            6,
                            Surface(
                              radius: Radii.pill,
                              borderWidth: 0,
                              fill: const Color(0x00000000),
                              child: Avatar(initials: p.initials, color: p.color, size: 128),
                            ),
                          ),
                        ),
                        Positioned(
                          top: 46,
                          child: Container(
                            width: 56,
                            height: 56,
                            decoration: BoxDecoration(
                              color: Palette.white,
                              shape: BoxShape.circle,
                              border: Border.all(color: Palette.ink, width: 3),
                            ),
                            child: const Icon(LucideIcons.check, size: 30, color: Palette.ink),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                Column(
                  spacing: 10,
                  children: [
                    ZBadge(label: '${p.score}% match', tone: Tone.card),
                    ZText('You and ${p.firstName} are study partners', variant: TextVariant.display, header: true, align: TextAlign.center),
                    const ZText('You can now message, call and plan sessions together.', align: TextAlign.center, style: TextStyle(fontSize: 16)),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  spacing: 10,
                  children: [
                    _Step(
                      icon: LucideIcons.calendar,
                      fill: Palette.live,
                      title: 'Plan your first session',
                      detail: 'Both free Tue & Thu after 8 PM',
                      onTap: () => context.push('/events/new'),
                    ),
                    _Step(
                      icon: LucideIcons.timer,
                      fill: Palette.focus,
                      title: 'Focus together',
                      detail: 'Start a shared 25 min timer',
                      onTap: () => context.go('/focus'),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                ZButton(label: 'Say hi to ${p.firstName}', size: ButtonSize.lg, onTap: () => context.pushReplacement('/dm/${p.id}')),
                ZButton(label: 'Keep browsing', variant: ButtonVariant.secondary, size: ButtonSize.lg, onTap: () => context.go('/partners')),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
