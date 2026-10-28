import 'package:flutter/material.dart';

import '../data/models.dart';
import '../state/app_state.dart';
import '../theme/tokens.dart';
import '../theme/type.dart';
import '../widgets/widgets.dart';

const _heat = [Palette.heat0, Palette.heat1, Palette.heat2, Palette.heat3, Palette.heat4];
const double _barMax = 120;
const _goalHours = 2.0;

class StatsScreen extends StatefulWidget {
  const StatsScreen({super.key});

  @override
  State<StatsScreen> createState() => _StatsScreenState();
}

class _StatsScreenState extends State<StatsScreen> {
  String _period = 'week';

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    const header = TopBar(title: 'Study stats', fallback: '/more');
    return Loader<StudyStats>(
      load: app.api.stats,
      frame: (context, body) => Screen(header: header, body: body),
      builder: (context, s, reload) {
        final p = switch (_period) {
          'month' => s.month,
          'all' => s.all,
          _ => s.week,
        };
        final tiles = [
          (value: formatMinutes(p.focusMinutes), label: 'Focus time', fill: Palette.focus),
          (value: '${p.sessions}', label: 'Focus sessions', fill: Palette.white),
          (value: '${s.streakDays} day${s.streakDays == 1 ? '' : 's'}', label: 'Current streak', fill: Palette.white),
          (value: '${s.attendanceRate}%', label: 'RSVP follow-through', fill: Palette.live),
        ];
        final hours = s.lastSevenDays.map((d) => d.minutes / 60).toList();
        final maxHours = [3.0, ...hours].reduce((a, b) => a > b ? a : b);
        final active = s.heatmap.where((d) => d.minutes > 0).length;
        final numStyle = mono(FontWeight.w700, 22, 28).copyWith(color: Palette.ink);

        return Screen(
          header: header,
          onRefresh: reload,
          children: [
            Segmented<String>(
              label: 'Period',
              value: _period,
              onChanged: (v) => setState(() => _period = v),
              options: const [SegmentOption('week', 'This week'), SegmentOption('month', '4 weeks'), SegmentOption('all', 'All time')],
            ),
            Column(
              spacing: 10,
              children: [
                for (var i = 0; i < tiles.length; i += 2)
                  Row(
                    spacing: 10,
                    children: [
                      for (final t in tiles.skip(i).take(2))
                        Expanded(
                          child: Surface(
                            shadow: ShadowSize.sm,
                            radius: 12,
                            fill: t.fill,
                            padding: const EdgeInsets.all(12),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(t.value, style: numStyle),
                                ZText(t.label, variant: TextVariant.small, style: const TextStyle(fontSize: 12)),
                              ],
                            ),
                          ),
                        ),
                    ],
                  ),
              ],
            ),
            Surface(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                spacing: 10,
                children: [
                  const Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      ZText('Focus hours per day', variant: TextVariant.h3),
                      ZText('Goal 2h', variant: TextVariant.label),
                    ],
                  ),
                  Semantics(
                    label: 'Focus hours, last 7 days: ${[for (final d in s.lastSevenDays) '${weekdayShort(d.date)} ${formatMinutes(d.minutes)}'].join(', ')}',
                    excludeSemantics: true,
                    child: Container(
                      height: _barMax,
                      decoration: const BoxDecoration(
                        border: Border(bottom: BorderSide(color: Palette.ink, width: 3)),
                      ),
                      child: Stack(
                        children: [
                          Positioned(
                            left: 0,
                            right: 0,
                            bottom: _goalHours / maxHours * _barMax,
                            child: CustomPaint(size: const Size(double.infinity, 2), painter: _DashedLine()),
                          ),
                          Positioned.fill(
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              spacing: 10,
                              children: [
                                for (final h in hours)
                                  Expanded(
                                    child: Container(
                                      height: (h / maxHours * _barMax).clamp(h > 0 ? 6.0 : 0.0, _barMax),
                                      decoration: BoxDecoration(
                                        color: h >= _goalHours ? Palette.focus : Palette.white,
                                        borderRadius: const BorderRadius.vertical(top: Radius.circular(6)),
                                        border: h > 0
                                            ? const Border(
                                                top: BorderSide(color: Palette.ink, width: 3),
                                                left: BorderSide(color: Palette.ink, width: 3),
                                                right: BorderSide(color: Palette.ink, width: 3),
                                              )
                                            : null,
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  ExcludeSemantics(
                    child: Row(
                      spacing: 10,
                      children: [
                        for (final d in s.lastSevenDays)
                          Expanded(
                            child: ZText(
                              weekdayShort(d.date)[0],
                              variant: TextVariant.mono,
                              muted: true,
                              align: TextAlign.center,
                              style: const TextStyle(fontSize: 11),
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            Surface(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                spacing: 10,
                children: [
                  const Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      ZText('28-day focus', variant: TextVariant.h3),
                      ZText('Last 4 weeks', variant: TextVariant.label),
                    ],
                  ),
                  Semantics(
                    label: 'Focus over the last 28 days, $active active days',
                    excludeSemantics: true,
                    child: Column(
                      spacing: 5,
                      children: [
                        for (final start in const [0, 14])
                          Row(
                            spacing: 5,
                            children: [
                              for (final d in s.heatmap.skip(start).take(14))
                                Expanded(
                                  child: AspectRatio(
                                    aspectRatio: 1,
                                    child: DecoratedBox(
                                      decoration: BoxDecoration(
                                        color: _heat[d.level.clamp(0, 4)],
                                        borderRadius: BorderRadius.circular(4),
                                        border: Border.all(color: Palette.ink, width: 2),
                                      ),
                                    ),
                                  ),
                                ),
                            ],
                          ),
                      ],
                    ),
                  ),
                  ExcludeSemantics(
                    child: Row(
                      spacing: 6,
                      children: [
                        ZText('Less', variant: TextVariant.small, muted: true, style: const TextStyle(fontSize: 11)),
                        for (final c in _heat)
                          Container(
                            width: 14,
                            height: 14,
                            decoration: BoxDecoration(
                              color: c,
                              borderRadius: BorderRadius.circular(4),
                              border: Border.all(color: Palette.ink, width: 2),
                            ),
                          ),
                        ZText('More', variant: TextVariant.small, muted: true, style: const TextStyle(fontSize: 11)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            Surface(
              padding: const EdgeInsets.all(16),
              child: Row(
                spacing: 14,
                children: [
                  Container(
                    width: 52,
                    height: 52,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: Palette.career,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Palette.ink, width: 3),
                    ),
                    child: Text('${s.level}', style: numStyle),
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      spacing: 6,
                      children: [
                        ZText(s.levelTitle.isNotEmpty ? s.levelTitle : 'Level ${s.level}', variant: TextVariant.h3),
                        ProgressBar(value: s.levelProgress, label: 'Level progress', tone: Tone.career, height: 14),
                        ZText('${s.xpToNextLevel} XP to level ${s.level + 1}', variant: TextVariant.small, muted: true, style: const TextStyle(fontSize: 12)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            ZText('XP comes from focus time, sessions you attend, messages and resources you share.', variant: TextVariant.small, muted: true),
          ],
        );
      },
    );
  }
}

class _DashedLine extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final p = Paint()
      ..color = Palette.muted
      ..strokeWidth = 2;
    for (var x = 0.0; x < size.width; x += 10) {
      canvas.drawLine(Offset(x, 1), Offset(x + 6, 1), p);
    }
  }

  @override
  bool shouldRepaint(_DashedLine old) => false;
}
