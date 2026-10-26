import 'package:flutter/material.dart';

import '../data/sample.dart';
import '../theme/tokens.dart';
import '../theme/type.dart';
import '../widgets/widgets.dart';

const _heat = [Palette.heat0, Palette.heat1, Palette.heat2, Palette.heat3, Palette.heat4];
const _days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const double _barMax = 120;
const double _maxHours = 3;

class StatsScreen extends StatefulWidget {
  const StatsScreen({super.key});

  @override
  State<StatsScreen> createState() => _StatsScreenState();
}

class _StatsScreenState extends State<StatsScreen> {
  String _period = 'week';

  @override
  Widget build(BuildContext context) {
    final s = Stats.periods[_period]!;
    final tiles = [
      (value: s.hours, label: 'Study hours', fill: Palette.focus),
      (value: '${s.sessions}', label: 'Sessions finished', fill: Palette.white),
      (value: s.streak, label: _period == 'all' ? 'Longest streak' : 'Current streak', fill: Palette.white),
      (value: s.attendance, label: 'RSVP follow-through', fill: Palette.live),
    ];
    final active = Stats.heat.where((h) => h > 0).length;
    final numStyle = mono(FontWeight.w700, 22, 28).copyWith(color: Palette.ink);

    return Screen(
      header: const TopBar(title: 'Study stats', fallback: '/more'),
      children: [
        Segmented<String>(
          label: 'Period',
          value: _period,
          onChanged: (p) => setState(() => _period = p),
          options: const [SegmentOption('week', 'This week'), SegmentOption('month', 'Month'), SegmentOption('all', 'All time')],
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
                  ZText('Hours per day', variant: TextVariant.h3),
                  ZText('Goal 2h', variant: TextVariant.label),
                ],
              ),
              Semantics(
                label: 'Hours per day this week: ${[for (var i = 0; i < 7; i++) '${_days[i]} ${Stats.dailyHours[i]}'].join(', ')}',
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
                        bottom: 2 / _maxHours * _barMax,
                        child: CustomPaint(size: const Size(double.infinity, 2), painter: _DashedLine()),
                      ),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        spacing: 10,
                        children: [
                          for (final h in Stats.dailyHours)
                            Expanded(
                              child: Container(
                                height: h / _maxHours * _barMax,
                                decoration: BoxDecoration(
                                  color: h >= 2 ? Palette.focus : Palette.white,
                                  borderRadius: const BorderRadius.vertical(top: Radius.circular(6)),
                                  border: const Border(
                                    top: BorderSide(color: Palette.ink, width: 3),
                                    left: BorderSide(color: Palette.ink, width: 3),
                                    right: BorderSide(color: Palette.ink, width: 3),
                                  ),
                                ),
                              ),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              ExcludeSemantics(
                child: Row(
                  spacing: 10,
                  children: [
                    for (final d in _days)
                      Expanded(
                        child: ZText(d[0], variant: TextVariant.mono, muted: true, align: TextAlign.center, style: const TextStyle(fontSize: 11)),
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
                  ZText('28-day activity', variant: TextVariant.h3),
                  ZText('Last 4 weeks', variant: TextVariant.label),
                ],
              ),
              Semantics(
                label: 'Activity for the last 28 days, $active active days',
                excludeSemantics: true,
                child: Column(
                  spacing: 5,
                  children: [
                    for (final start in const [0, 14])
                      Row(
                        spacing: 5,
                        children: [
                          for (final h in Stats.heat.skip(start).take(14))
                            Expanded(
                              child: AspectRatio(
                                aspectRatio: 1,
                                child: DecoratedBox(
                                  decoration: BoxDecoration(
                                    color: _heat[h],
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
                child: Text('${Stats.level}', style: numStyle),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  spacing: 6,
                  children: [
                    const ZText('Level ${Stats.level} · ${Stats.levelTitle}', variant: TextVariant.h3),
                    const ProgressBar(value: Stats.levelProgress, label: 'Level progress', tone: Tone.career, height: 14),
                    ZText('${Stats.toNextLevel} to level ${Stats.level + 1}', variant: TextVariant.small, muted: true, style: const TextStyle(fontSize: 12)),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
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
