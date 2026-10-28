import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/models.dart';
import '../../state/app_state.dart';
import '../../theme/tokens.dart';
import '../../theme/type.dart';
import '../../widgets/widgets.dart';
import 'motion.dart';

const _days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/// Home's doorway into the weekly recap story.
class RecapTeaser extends StatelessWidget {
  const RecapTeaser({super.key, required this.weekMinutes});
  final int weekMinutes;

  @override
  Widget build(BuildContext context) {
    return Surface(
      tone: Tone.chat,
      href: '/recap',
      semanticLabel: 'Watch your week in review',
      padding: const EdgeInsets.all(16),
      child: Row(
        spacing: 14,
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: Palette.white,
              shape: BoxShape.circle,
              border: Border.all(color: Palette.ink, width: 3),
            ),
            child: const Icon(LucideIcons.play, color: Palette.ink, size: 22),
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const ZText('Your week in review', variant: TextVariant.h3),
                ZText('${formatMinutes(weekMinutes)} focused in 7 days · tap to watch', variant: TextVariant.small),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Story-style recap of the last seven days. Tap the right side to go on, the left to go back.
class RecapScreen extends StatefulWidget {
  const RecapScreen({super.key});

  @override
  State<RecapScreen> createState() => _RecapScreenState();
}

class _RecapScreenState extends State<RecapScreen> {
  int _i = 0;
  static const _fills = [Palette.chat, Palette.focus, Palette.ink, Palette.live];

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    return Loader<StudyStats>(
      load: app.api.stats,
      frame: (context, body) => Screen(
        header: const TopBar(title: 'Your week', close: true),
        body: body,
      ),
      builder: (context, stats, _) {
        final slides = _slides(stats);
        final dark = _fills[_i] == Palette.ink;
        final fg = dark ? Palette.paper : Palette.ink;
        return Material(
          type: MaterialType.transparency,
          child: AnimatedContainer(
            duration: motionOn(context) ? const Duration(milliseconds: 300) : Duration.zero,
            color: _fills[_i],
            child: SafeArea(
              child: Stack(
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      spacing: 14,
                      children: [
                        Row(
                          spacing: 6,
                          children: [
                            for (var k = 0; k < slides.length; k++)
                              Expanded(
                                child: AnimatedContainer(
                                  duration: const Duration(milliseconds: 250),
                                  height: 6,
                                  decoration: BoxDecoration(
                                    color: k <= _i ? (dark ? Palette.focus : Palette.ink) : const Color(0x00000000),
                                    borderRadius: BorderRadius.circular(4),
                                    border: Border.all(color: dark ? Palette.focus : Palette.ink, width: 2),
                                  ),
                                ),
                              ),
                          ],
                        ),
                        Row(
                          children: [
                            Expanded(
                              child: Text('LAST 7 DAYS', style: mono(FontWeight.w700, 11, 14, letterSpacing: 0.8).copyWith(color: fg)),
                            ),
                            ZIconButton(icon: LucideIcons.x, label: 'Close recap', round: true, onTap: () => goBack(context)),
                          ],
                        ),
                        Expanded(
                          child: AnimatedSwitcher(
                            duration: motionOn(context) ? const Duration(milliseconds: 280) : Duration.zero,
                            transitionBuilder: (child, a) => FadeTransition(
                              opacity: a,
                              child: SlideTransition(
                                position: Tween(begin: const Offset(0.08, 0), end: Offset.zero).animate(a),
                                child: child,
                              ),
                            ),
                            child: KeyedSubtree(
                              key: ValueKey(_i),
                              child: DefaultTextStyle.merge(
                                style: TextStyle(color: fg),
                                child: Align(alignment: Alignment.centerLeft, child: slides[_i]),
                              ),
                            ),
                          ),
                        ),
                        if (_i == slides.length - 1)
                          ZButton(label: 'Back to Home', variant: ButtonVariant.primary, size: ButtonSize.lg, onTap: () => goBack(context))
                        else
                          Text(
                            'Tap to continue',
                            textAlign: TextAlign.center,
                            style: mono(FontWeight.w500, 11, 14).copyWith(color: fg),
                          ),
                      ],
                    ),
                  ),
                  if (_i < slides.length - 1)
                    Positioned.fill(
                      top: 120,
                      bottom: 60,
                      child: Row(
                        children: [
                          Expanded(
                            flex: 35,
                            child: Semantics(
                              button: true,
                              label: 'Previous',
                              child: GestureDetector(behavior: HitTestBehavior.opaque, onTap: () => setState(() => _i = math.max(0, _i - 1))),
                            ),
                          ),
                          Expanded(
                            flex: 65,
                            child: Semantics(
                              button: true,
                              label: 'Next',
                              child: GestureDetector(behavior: HitTestBehavior.opaque, onTap: () => setState(() => _i++)),
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  List<Widget> _slides(StudyStats s) {
    final days = s.lastSevenDays;
    final best = days.isEmpty ? null : days.reduce((a, b) => b.minutes > a.minutes ? b : a);
    final max = math.max(1, best?.minutes ?? 1);
    final big = mono(FontWeight.w700, 88, 86, letterSpacing: -2);
    return [
      Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        spacing: 16,
        children: [
          Text('This week you focused for', style: grotesk(FontWeight.w500, 22, 28)),
          Text(formatMinutes(s.week.focusMinutes).replaceAll(' ', '\n'), style: big),
          ZBadge(label: '${s.week.sessions} session${s.week.sessions == 1 ? '' : 's'}', tone: Tone.card),
        ],
      ),
      Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: 14,
        children: [
          Text(best == null || best.minutes == 0 ? 'No focus days yet' : 'Your best day was', style: grotesk(FontWeight.w500, 22, 28)),
          if (best != null && best.minutes > 0) ...[
            Text(_days[best.date.weekday - 1], style: grotesk(FontWeight.w700, 54, 58)),
            Text(formatMinutes(best.minutes), style: mono(FontWeight.w700, 22, 26)),
          ],
          SizedBox(
            height: 170,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              spacing: 8,
              children: [
                for (final d in days)
                  Expanded(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.end,
                      spacing: 4,
                      children: [
                        TweenAnimationBuilder<double>(
                          tween: Tween(begin: 0, end: d.minutes / max),
                          duration: motionOn(context) ? const Duration(milliseconds: 700) : Duration.zero,
                          curve: Curves.easeOutBack,
                          builder: (_, v, _) => Container(
                            height: math.max(4, 140 * v),
                            decoration: BoxDecoration(
                              color: d == best ? Palette.ink : Palette.paper,
                              borderRadius: const BorderRadius.vertical(top: Radius.circular(6)),
                              border: Border.all(color: Palette.ink, width: 2),
                            ),
                          ),
                        ),
                        Text(_days[d.date.weekday - 1][0], style: mono(FontWeight.w700, 11, 14)),
                      ],
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
      Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        spacing: 14,
        children: [
          Text('Your sky', style: grotesk(FontWeight.w500, 22, 28)),
          Text(
            s.streakDays > 0 ? '${s.streakDays} night${s.streakDays == 1 ? '' : 's'} strong' : 'A fresh sky',
            style: grotesk(FontWeight.w700, 44, 48).copyWith(color: Palette.focus),
          ),
          Text(
            '${days.where((d) => d.minutes > 0).length} of 7 nights lit · ${s.levelTitle.isEmpty ? 'Level ${s.level}' : s.levelTitle}',
            style: grotesk(FontWeight.w500, 16, 22).copyWith(color: Palette.quietShade),
          ),
        ],
      ),
      Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Palette.paper,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Palette.ink, width: 3),
          boxShadow: const [BoxShadow(color: Palette.ink, offset: Offset(6, 6))],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          spacing: 12,
          children: [
            Text('YOUR WEEK ON ZENVY', style: mono(FontWeight.w700, 11, 14, letterSpacing: 0.8).copyWith(color: Palette.ink)),
            Row(
              spacing: 10,
              children: [
                Expanded(child: _Tile(formatMinutes(s.week.focusMinutes), 'focused', Palette.focus)),
                Expanded(child: _Tile('${s.streakDays}', 'day streak', Palette.match)),
              ],
            ),
            Row(
              spacing: 10,
              children: [
                Expanded(child: _Tile('${s.week.sessions}', 'sessions', Palette.chat)),
                Expanded(child: _Tile(best == null || best.minutes == 0 ? '–' : _days[best.date.weekday - 1].substring(0, 3), 'best day', Palette.career)),
              ],
            ),
          ],
        ),
      ),
    ];
  }
}

class _Tile extends StatelessWidget {
  const _Tile(this.value, this.label, this.fill);
  final String value;
  final String label;
  final Color fill;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(10),
    decoration: BoxDecoration(
      color: fill,
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: Palette.ink, width: 2),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(value, maxLines: 1, style: mono(FontWeight.w700, 22, 26).copyWith(color: Palette.ink)),
        Text(label, style: grotesk(FontWeight.w500, 12, 16).copyWith(color: Palette.ink)),
      ],
    ),
  );
}
