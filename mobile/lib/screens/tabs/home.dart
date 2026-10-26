import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/models.dart';
import '../../router.dart';
import '../../state/app_state.dart';
import '../../theme/tokens.dart';
import '../../theme/type.dart';
import '../../widgets/widgets.dart';

/// Daily focus goal shown on Home. The web app has no per-user goal yet.
const dailyGoalMinutes = 120;

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
    return Loader<HomeData>(
      load: app.api.home,
      frame: (context, body) => Screen(tabBar: true, body: body),
      builder: (context, home, reload) => _HomeBody(home: home, reload: reload),
    );
  }
}

class _HomeBody extends StatelessWidget {
  const _HomeBody({required this.home, required this.reload});
  final HomeData home;
  final Future<void> Function() reload;

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final me = app.me;
    final name = me?.name ?? home.name ?? 'there';
    final goal = (home.todayMinutes / dailyGoalMinutes).clamp(0.0, 1.0);
    final next = home.nextEvent;

    return Screen(
      tabBar: true,
      onRefresh: reload,
      children: [
        Row(
          spacing: 12,
          children: [
            Surface(
              shadow: ShadowSize.none,
              radius: Radii.pill,
              borderWidth: 0,
              fill: const Color(0x00000000),
              href: '/profile',
              semanticLabel: 'Your profile',
              child: me != null ? Avatar.of(me, size: 48) : Avatar(initials: initialsFor(name), color: Palette.match, size: 48),
            ),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ZText(_greeting(), variant: TextVariant.small, muted: true),
                  ZText(
                    name.split(' ').first,
                    variant: TextVariant.title,
                    header: true,
                    maxLines: 1,
                    style: const TextStyle(fontSize: 22, height: 26 / 22),
                  ),
                ],
              ),
            ),
            const ZIconButton(icon: LucideIcons.search, label: 'Find study partners', href: '/partners'),
            ZIconButton(icon: LucideIcons.bell, label: 'Notifications', href: '/notifications', badge: formatBadge(app.unreadNotifications)),
          ],
        ),
        if (me != null && !me.onboarded)
          Surface(
            tone: Tone.match,
            shadow: ShadowSize.sm,
            href: '/onboarding-about',
            semanticLabel: 'Finish your profile to get matched',
            padding: const EdgeInsets.all(14),
            child: const Row(
              spacing: 12,
              children: [
                Icon(LucideIcons.userPlus, color: Palette.ink),
                Expanded(child: ZText('Add your major and interests so classmates can find you.', variant: TextVariant.strong)),
                Icon(LucideIcons.chevronRight, color: Palette.ink),
              ],
            ),
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
                          child: Text(formatMinutes(home.todayMinutes), style: mono(FontWeight.w700, 38, 44).copyWith(color: Palette.ink)),
                        ),
                        ZText(
                          'of ${formatMinutes(dailyGoalMinutes)} goal · ${home.sessionsToday} session${home.sessionsToday == 1 ? '' : 's'}',
                          variant: TextVariant.small,
                        ),
                      ],
                    ),
                  ),
                  ZBadge(label: '${home.streakDays} day${home.streakDays == 1 ? '' : 's'}', icon: LucideIcons.flame, tone: Tone.card),
                ],
              ),
              ProgressBar(value: goal, label: 'Daily focus goal'),
              const ZButton(label: 'Start a 25 min session', icon: LucideIcons.play, href: '/focus'),
            ],
          ),
        ),
        if (next != null)
          _NextUp(event: next)
        else
          const EmptyCard(
            title: 'No sessions coming up',
            detail: 'Schedule one with a group, or RSVP to one.',
            action: ZButton(label: 'See sessions', variant: ButtonVariant.live, size: ButtonSize.sm, href: '/events'),
          ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          spacing: 6,
          children: [
            const SectionHeader(
              title: 'Partners for you',
              action: ZButton(label: 'See all', variant: ButtonVariant.ghost, size: ButtonSize.sm, href: '/partners'),
            ),
            if (home.partners.isEmpty)
              const EmptyCard(title: 'No suggestions yet', detail: 'Add interests to your profile to get better matches.')
            else
              IntrinsicHeight(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  spacing: 12,
                  children: [
                    for (final p in home.partners)
                      Expanded(
                        child: Surface(
                          onTap: () => context.push('/partner/${p.id}'),
                          semanticLabel: '${p.name}, ${p.score}% match',
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            spacing: 6,
                            children: [
                              Avatar.of(p, size: 48),
                              ZText(_shortName(p.name), variant: TextVariant.h3, maxLines: 1),
                              ZBadge(label: '${p.score}%', tone: Tone.match),
                            ],
                          ),
                        ),
                      ),
                    for (var i = home.partners.length; i < 3; i++) const Expanded(child: SizedBox()),
                  ],
                ),
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
            if (home.groups.isEmpty)
              const EmptyCard(
                title: "You're not in a group yet",
                detail: 'Join one to chat, share notes and plan sessions.',
                action: ZButton(label: 'Find a group', variant: ButtonVariant.chat, size: ButtonSize.sm, href: '/groups'),
              ),
            for (final g in home.groups)
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
                          ZText(g.name, variant: TextVariant.h3, maxLines: 1),
                          ZText(
                            g.lastMessage != null ? '${g.lastMessage!.senderName}: ${g.lastMessage!.content}' : '${g.memberCount} members',
                            variant: TextVariant.small,
                            muted: true,
                            maxLines: 1,
                          ),
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

String _shortName(String name) {
  final parts = name.split(' ');
  return parts.length > 1 && parts[1].isNotEmpty ? '${parts.first} ${parts[1][0]}.' : parts.first;
}

class _NextUp extends StatelessWidget {
  const _NextUp({required this.event});
  final EventItem event;

  @override
  Widget build(BuildContext context) {
    final e = event;
    final live = DateTime.now().isAfter(e.start.subtract(const Duration(minutes: 10))) && DateTime.now().isBefore(e.end);
    return Surface(
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
                Expanded(child: ZText('Next up', variant: TextVariant.h3)),
                ZButton(label: 'All sessions', variant: ButtonVariant.ghost, size: ButtonSize.sm, href: '/events'),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              spacing: 14,
              children: [
                DateBlock(date: e.start),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      ZText(e.title, variant: TextVariant.h3),
                      ZText(
                        [clockTime(e.start), e.group?.name, '${e.goingCount} going'].whereType<String>().join(' · '),
                        variant: TextVariant.small,
                        muted: true,
                      ),
                    ],
                  ),
                ),
                if (live && e.group != null && !e.inPerson)
                  ZButton(
                    label: 'Join',
                    variant: ButtonVariant.live,
                    size: ButtonSize.sm,
                    onTap: () => context.push(withQuery('/call/active', {'groupId': e.group!.id, 'title': e.group!.name})),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// "OCT / 26" calendar block.
class DateBlock extends StatelessWidget {
  const DateBlock({super.key, required this.date, this.fill = Palette.white, this.size = 56});
  final DateTime date;
  final Color fill;
  final double size;

  @override
  Widget build(BuildContext context) {
    return ExcludeSemantics(
      child: Container(
        width: size,
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          color: fill,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Palette.ink, width: 3),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              color: Palette.ink,
              child: Text(
                monthShort(date).toUpperCase(),
                textAlign: TextAlign.center,
                style: mono(FontWeight.w700, 10, 16).copyWith(color: Palette.paper),
              ),
            ),
            Text(
              '${date.day}',
              textAlign: TextAlign.center,
              style: mono(FontWeight.w700, size * 0.39, size * 0.54).copyWith(color: Palette.ink),
            ),
          ],
        ),
      ),
    );
  }
}
