import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/models.dart';
import '../../state/app_state.dart';
import '../../theme/tokens.dart';
import '../../theme/type.dart';
import '../../widgets/widgets.dart';
import '../home/campfires.dart';
import '../home/constellation.dart';
import '../home/day_plan.dart';
import '../home/hero.dart';
import '../home/live_strip.dart';
import '../home/match_card.dart';
import '../home/motion.dart';
import '../home/pull_focus.dart';
import '../home/quests.dart';
import '../home/recap.dart';

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
    final now = DateTime.now();
    var i = 0;
    Widget enter(Widget child) => Enter(index: i++, child: child);

    return Screen(
      tabBar: true,
      onRefresh: reload,
      gap: 20,
      children: [
        const PullToFocus(),
        enter(
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
        ),
        enter(StudyingNowStrip(people: home.studyingNow)),
        enter(HomeHero(home: home, goalMinutes: dailyGoalMinutes)),
        enter(ConstellationCard(home: home, goalMinutes: dailyGoalMinutes)),
        enter(QuestsCard(home: home, goalMinutes: dailyGoalMinutes, now: now)),
        enter(DayBarCard(home: home, now: now)),
        enter(MatchOfTheDay(partners: home.partners)),
        enter(GroupCampfires(groups: home.groups, activity: home.groupActivity)),
        enter(RecapTeaser(weekMinutes: home.progress.week.focusMinutes)),
      ],
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
