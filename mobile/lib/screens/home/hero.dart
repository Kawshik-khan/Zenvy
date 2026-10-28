import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/models.dart';
import '../../router.dart';
import '../../state/app_state.dart';
import '../../theme/tokens.dart';
import '../../theme/type.dart';
import '../../widgets/widgets.dart';
import 'motion.dart';

/// The one next thing, picked from what is true right now: finish your profile, a session about
/// to start, a late-night wrap-up, or a nudge to focus.
enum HeroState { profile, session, windDown, focus }

HeroState pickHero({required Me? me, required HomeData home, required int goalMinutes, required DateTime now}) {
  if (me != null && !me.onboarded) return HeroState.profile;
  final next = home.nextEvent;
  if (next != null && now.isAfter(next.start.subtract(const Duration(hours: 1))) && now.isBefore(next.end)) return HeroState.session;
  if (now.hour >= 22 && home.todayMinutes > 0) return HeroState.windDown;
  return HeroState.focus;
}

class HomeHero extends StatefulWidget {
  const HomeHero({super.key, required this.home, required this.goalMinutes});
  final HomeData home;
  final int goalMinutes;

  @override
  State<HomeHero> createState() => _HomeHeroState();
}

class _HomeHeroState extends State<HomeHero> {
  Timer? _tick;
  DateTime _now = DateTime.now();

  @override
  void initState() {
    super.initState();
    // Once a second keeps the countdown honest and flips the hero when a session starts or ends.
    _tick = Timer.periodic(const Duration(seconds: 1), (_) => setState(() => _now = DateTime.now()));
  }

  @override
  void dispose() {
    _tick?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final me = AppScope.of(context).me;
    final state = pickHero(me: me, home: widget.home, goalMinutes: widget.goalMinutes, now: _now);
    final card = switch (state) {
      HeroState.profile => _ProfileHero(me: me!),
      HeroState.session => _SessionHero(event: widget.home.nextEvent!, now: _now),
      HeroState.windDown => _WindDownHero(home: widget.home),
      HeroState.focus => _FocusHero(home: widget.home, goalMinutes: widget.goalMinutes, now: _now),
    };
    return AnimatedSwitcher(
      duration: motionOn(context) ? const Duration(milliseconds: 260) : Duration.zero,
      switchInCurve: Curves.easeOutBack,
      transitionBuilder: (child, a) => FadeTransition(
        opacity: a,
        child: ScaleTransition(scale: Tween(begin: 0.96, end: 1.0).animate(a), child: child),
      ),
      child: KeyedSubtree(key: ValueKey(state), child: card),
    );
  }
}

class _HeroFrame extends StatelessWidget {
  const _HeroFrame({required this.fill, required this.tag, required this.children, this.dark = false});
  final Color fill;
  final String tag;
  final List<Widget> children;
  final bool dark;

  @override
  Widget build(BuildContext context) {
    final fg = dark ? Palette.paper : Palette.ink;
    return Container(
      decoration: BoxDecoration(
        color: fill,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Palette.ink, width: 3),
        boxShadow: [BoxShadow(color: dark ? Palette.focus : Palette.ink, offset: const Offset(5, 5))],
      ),
      padding: const EdgeInsets.all(18),
      child: DefaultTextStyle.merge(
        style: TextStyle(color: fg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          spacing: 10,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(color: dark ? Palette.focus : Palette.ink, borderRadius: BorderRadius.circular(6)),
              child: Text(tag.toUpperCase(), style: mono(FontWeight.w700, 11, 14, letterSpacing: 0.8).copyWith(color: dark ? Palette.ink : fill)),
            ),
            ...children,
          ],
        ),
      ),
    );
  }
}

String _countdown(Duration d) {
  final h = d.inHours;
  final m = (d.inMinutes % 60).toString().padLeft(2, '0');
  final s = (d.inSeconds % 60).toString().padLeft(2, '0');
  return h > 0 ? '$h:$m:$s' : '$m:$s';
}

class _SessionHero extends StatelessWidget {
  const _SessionHero({required this.event, required this.now});
  final EventItem event;
  final DateTime now;

  @override
  Widget build(BuildContext context) {
    final e = event;
    final started = !now.isBefore(e.start);
    final joinable = now.isAfter(e.start.subtract(const Duration(minutes: 10))) && e.group != null && !e.inPerson;
    final where = e.location ?? (e.inPerson ? 'In person' : 'Online');
    final lastMinute = !started && e.start.difference(now) <= const Duration(minutes: 1);
    return Breathe(
      on: lastMinute,
      child: _HeroFrame(
        fill: Palette.live,
        tag: started ? 'Live now' : 'Starts in',
        children: [
          Semantics(
            liveRegion: false,
            label: started
                ? 'Started ${formatMinutes(now.difference(e.start).inMinutes)} ago'
                : 'Starts in ${formatMinutes(e.start.difference(now).inMinutes + 1)}',
            child: ExcludeSemantics(
              child: RollingText(
                started ? _countdown(e.end.difference(now)) : _countdown(e.start.difference(now)),
                style: mono(FontWeight.w700, 52, 56, letterSpacing: -1).copyWith(color: Palette.ink, fontFeatures: const [FontFeature.tabularFigures()]),
              ),
            ),
          ),
          if (started) const ZText('left in this session', variant: TextVariant.small),
          ZText(e.title, variant: TextVariant.h2, maxLines: 2),
          ZText([clockTime(e.start), e.group?.name, where].whereType<String>().join(' · '), variant: TextVariant.small, maxLines: 2),
          Row(
            spacing: 10,
            children: [
              _Faces(people: e.going),
              Expanded(
                child: ZText(e.isGoing ? 'You + ${(e.goingCount - 1).clamp(0, 999)} going' : '${e.goingCount} going', variant: TextVariant.strong, maxLines: 1),
              ),
              if (joinable)
                ZButton(
                  label: 'Join',
                  variant: ButtonVariant.primary,
                  icon: LucideIcons.video,
                  onTap: () => context.push(withQuery('/call/active', {'groupId': e.group!.id, 'title': e.group!.name})),
                )
              else
                const ZButton(label: 'Details', variant: ButtonVariant.secondary, size: ButtonSize.sm, href: '/events'),
            ],
          ),
        ],
      ),
    );
  }
}

class _Faces extends StatelessWidget {
  const _Faces({required this.people});
  final List<UserRef> people;

  @override
  Widget build(BuildContext context) {
    final shown = people.take(3).toList();
    if (shown.isEmpty) return const SizedBox();
    return SizedBox(
      width: 34 + (shown.length - 1) * 24,
      height: 34,
      child: Stack(
        children: [for (var i = 0; i < shown.length; i++) Positioned(left: i * 24.0, child: Avatar.of(shown[i], size: 34))],
      ),
    );
  }
}

class _FocusHero extends StatelessWidget {
  const _FocusHero({required this.home, required this.goalMinutes, required this.now});
  final HomeData home;
  final int goalMinutes;
  final DateTime now;

  @override
  Widget build(BuildContext context) {
    final left = goalMinutes - home.todayMinutes;
    final endOfDay = DateTime(now.year, now.month, now.day + 1);
    final hoursLeft = endOfDay.difference(now).inHours;
    final (tag, title, detail) = home.todayMinutes == 0 && home.streakDays > 0
        ? ('${hoursLeft}h left today', 'Keep your ${home.streakDays}-day constellation glowing', "One 25 min focus adds tonight's star.")
        : home.todayMinutes == 0
        ? ('Fresh start', 'Light your first star today', 'Every focus session becomes a star. Join up days to draw a constellation.')
        : left > 0
        ? (
            '${formatMinutes(left)} to goal',
            "You're ${(home.todayMinutes * 100 / goalMinutes).round()}% of the way there",
            'Another round gets you to ${formatMinutes(goalMinutes)} today.',
          )
        : ('Goal done', 'Today\'s star is lit', 'Bonus rounds still count toward your level.');
    final next = home.nextEvent;
    return _HeroFrame(
      fill: Palette.focus,
      tag: tag,
      children: [
        ZText(
          title,
          variant: TextVariant.h2,
          header: true,
          style: const TextStyle(fontSize: 24, height: 28 / 24),
        ),
        ZText(detail, variant: TextVariant.body),
        if (next != null) ZText('Next up: ${next.title} · ${_dayAndTime(next.start, now)}', variant: TextVariant.small, maxLines: 1),
        const SizedBox(height: 2),
        const SizedBox(
          width: double.infinity,
          child: ZButton(label: 'Start 25 min focus', icon: LucideIcons.play, href: '/focus'),
        ),
      ],
    );
  }
}

String _dayAndTime(DateTime at, DateTime now) {
  final today = DateTime(now.year, now.month, now.day);
  final day = DateTime(at.year, at.month, at.day).difference(today).inDays;
  final label = day == 0
      ? 'today'
      : day == 1
      ? 'tomorrow'
      : '${monthShort(at)} ${at.day}';
  return '$label ${clockTime(at)}';
}

class _ProfileHero extends StatelessWidget {
  const _ProfileHero({required this.me});
  final Me me;

  @override
  Widget build(BuildContext context) {
    final steps = [
      ('Name and photo', me.image != null),
      ('College', me.college != null),
      ('Major and semester', me.major != null && me.semester != null),
      ('A few interests', me.interests.isNotEmpty),
    ];
    final done = steps.where((s) => s.$2).length;
    return _HeroFrame(
      fill: Palette.career,
      tag: '$done of ${steps.length} done',
      children: [
        const ZText(
          'Finish your profile to unlock matches',
          variant: TextVariant.h2,
          header: true,
          style: TextStyle(fontSize: 24, height: 28 / 24),
        ),
        for (final (label, ok) in steps)
          Row(
            spacing: 8,
            children: [
              Container(
                width: 20,
                height: 20,
                decoration: BoxDecoration(
                  color: ok ? Palette.ink : Palette.white,
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: Palette.ink, width: 2),
                ),
                child: ok ? const Icon(LucideIcons.check, size: 13, color: Palette.career) : null,
              ),
              ZText(label, variant: TextVariant.body),
            ],
          ),
        const SizedBox(
          width: double.infinity,
          child: ZButton(label: 'Finish profile', href: '/onboarding-about'),
        ),
      ],
    );
  }
}

class _WindDownHero extends StatelessWidget {
  const _WindDownHero({required this.home});
  final HomeData home;

  @override
  Widget build(BuildContext context) {
    return _HeroFrame(
      fill: Palette.ink,
      dark: true,
      tag: "Today's star is lit",
      children: [
        Text(formatMinutes(home.todayMinutes), style: mono(FontWeight.w700, 52, 56).copyWith(color: Palette.focus)),
        ZText('Nice work tonight', variant: TextVariant.h2, color: Palette.paper),
        ZText(
          '${home.sessionsToday} session${home.sessionsToday == 1 ? '' : 's'} · streak ${home.streakDays} day${home.streakDays == 1 ? '' : 's'}',
          variant: TextVariant.small,
          color: Palette.quietShade,
        ),
        const SizedBox(
          width: double.infinity,
          child: ZButton(label: 'See your week', variant: ButtonVariant.focus, href: '/recap'),
        ),
      ],
    );
  }
}
