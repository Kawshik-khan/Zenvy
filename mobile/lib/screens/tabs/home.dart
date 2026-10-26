import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/sample.dart';
import '../../state/app_state.dart';
import '../../theme/tokens.dart';
import '../../theme/type.dart';
import '../../widgets/widgets.dart';

String _greeting() {
  final h = DateTime.now().hour;
  return h < 12
      ? 'Good morning'
      : h < 18
      ? 'Good afternoon'
      : 'Good evening';
}

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final next = events.where((e) => app.flag(Flag.rsvp, e.id)).firstOrNull;
    final nextGroup = groupById(next?.groupId);
    final myGroups = groups.where((g) => app.flag(Flag.joinedGroups, g.id)).take(2);
    final goal = (app.focusMinutesToday / Stats.goalMinutes).clamp(0.0, 1.0);

    return Screen(
      tabBar: true,
      children: [
        Row(
          spacing: 12,
          children: [
            const Surface(
              shadow: ShadowSize.none,
              radius: Radii.pill,
              borderWidth: 0,
              fill: Color(0x00000000),
              href: '/profile',
              semanticLabel: 'Your profile',
              child: Avatar(initials: 'NR', color: Palette.match, size: 48),
            ),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ZText(_greeting(), variant: TextVariant.small, muted: true),
                  const ZText(
                    'Nadia',
                    variant: TextVariant.title,
                    header: true,
                    style: TextStyle(fontSize: 22, height: 26 / 22),
                  ),
                ],
              ),
            ),
            const ZIconButton(icon: LucideIcons.search, label: 'Search people', href: '/partners'),
            ZIconButton(icon: LucideIcons.bell, label: 'Notifications', href: '/notifications', badge: formatBadge(app.unreadNotifications)),
          ],
        ),
        Surface(
          tone: Tone.focus,
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: 14,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const ZText("Today's focus", variant: TextVariant.label, color: Palette.ink),
                        Padding(
                          padding: const EdgeInsets.only(top: 2),
                          child: Text(formatMinutes(app.focusMinutesToday), style: mono(FontWeight.w700, 38, 44).copyWith(color: Palette.ink)),
                        ),
                        ZText('of ${formatMinutes(Stats.goalMinutes)} goal · ${app.sessionsToday} sessions', variant: TextVariant.small),
                      ],
                    ),
                  ),
                  const ZBadge(label: '${Stats.streakDays} days', icon: LucideIcons.flame, tone: Tone.card),
                ],
              ),
              ProgressBar(value: goal, label: 'Daily focus goal'),
              const ZButton(label: 'Start a 25 min session', icon: LucideIcons.play, href: '/focus'),
            ],
          ),
        ),
        if (next != null && nextGroup != null)
          Surface(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  decoration: const BoxDecoration(
                    color: Palette.live,
                    border: Border(bottom: BorderSide(color: Palette.ink, width: 3)),
                  ),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      ZText('Next up', variant: TextVariant.h3),
                      ZButton(label: 'All sessions', variant: ButtonVariant.ghost, size: ButtonSize.sm, href: '/events'),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(14),
                  child: Row(
                    spacing: 14,
                    children: [
                      Container(
                        width: 56,
                        clipBehavior: Clip.antiAlias,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: Palette.ink, width: 3),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Container(
                              color: Palette.ink,
                              child: Text(
                                'OCT',
                                textAlign: TextAlign.center,
                                style: mono(FontWeight.w700, 10, 16).copyWith(color: Palette.paper),
                              ),
                            ),
                            Text(
                              '${next.day}',
                              textAlign: TextAlign.center,
                              style: mono(FontWeight.w700, 22, 30).copyWith(color: Palette.ink),
                            ),
                          ],
                        ),
                      ),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            ZText(next.title, variant: TextVariant.h3),
                            ZText('${next.start} · ${nextGroup.name} · ${next.goingIds.length} going', variant: TextVariant.small, muted: true),
                          ],
                        ),
                      ),
                      const ZButton(label: 'Join', variant: ButtonVariant.live, size: ButtonSize.sm, href: '/call/active'),
                    ],
                  ),
                ),
              ],
            ),
          ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          spacing: 6,
          children: [
            const SectionHeader(
              title: 'Partners for you',
              action: ZButton(label: 'See all', variant: ButtonVariant.ghost, size: ButtonSize.sm, href: '/partners'),
            ),
            Row(
              spacing: 12,
              children: [
                for (final p in partners)
                  Expanded(
                    child: Surface(
                      onTap: () => context.push('/partner/${p.id}'),
                      semanticLabel: '${p.name}, ${p.score}% match',
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        spacing: 6,
                        children: [
                          Avatar(initials: p.initials, color: p.color, size: 48),
                          ZText('${p.firstName} ${p.name.split(' ')[1][0]}.', variant: TextVariant.h3, maxLines: 1),
                          ZBadge(label: '${p.score}%', tone: Tone.match),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          ],
        ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          spacing: 10,
          children: [
            const SectionHeader(
              title: 'Your groups',
              action: ZButton(label: 'All groups', variant: ButtonVariant.ghost, size: ButtonSize.sm, href: '/groups'),
            ),
            for (final g in myGroups)
              Surface(
                shadow: ShadowSize.sm,
                onTap: () => context.push('/group-room/${g.id}'),
                semanticLabel: 'Open ${g.name}',
                padding: const EdgeInsets.all(12),
                child: Row(
                  spacing: 12,
                  children: [
                    Avatar(initials: g.initials, color: g.color, square: true),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          ZText(g.name, variant: TextVariant.h3),
                          ZText(g.status ?? '${g.memberIds.length} members', variant: TextVariant.small, muted: true, maxLines: 1),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ],
    );
  }
}
