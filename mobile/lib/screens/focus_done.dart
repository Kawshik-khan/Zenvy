import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../data/sample.dart';
import '../state/app_state.dart';
import '../theme/tokens.dart';
import '../theme/type.dart';
import '../widgets/widgets.dart';

const _ratings = ['Scattered', 'Okay', 'Locked in'];

class FocusDoneScreen extends StatefulWidget {
  const FocusDoneScreen({super.key, this.minutes});
  final int? minutes;

  @override
  State<FocusDoneScreen> createState() => _FocusDoneScreenState();
}

class _FocusDoneScreenState extends State<FocusDoneScreen> {
  String _rating = 'Locked in';
  bool _share = true;

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final banked = widget.minutes ?? 25;
    final goal = ((app.focusMinutesToday / Stats.goalMinutes).clamp(0.0, 1.0) * 100).round();
    final tiles = [
      (value: formatMinutes(app.focusMinutesToday).replaceAll(' ', ''), label: 'Today'),
      (value: '${Stats.streakDays + 1}d', label: 'Streak'),
      (value: '$goal%', label: 'Goal'),
    ];

    return Screen(
      safeTop: false,
      padding: const EdgeInsets.only(bottom: 28),
      gap: 0,
      children: [
        HeaderBand(
          color: Palette.focus,
          padding: const EdgeInsets.fromLTRB(24, 32, 24, 26),
          child: Column(
            children: [
              const Surface(
                tone: Tone.live,
                radius: Radii.pill,
                width: 92,
                height: 92,
                alignment: Alignment.center,
                child: Icon(LucideIcons.check, size: 50, color: Palette.ink),
              ),
              const SizedBox(height: 18),
              const ZText(
                'Session complete',
                variant: TextVariant.title,
                header: true,
                style: TextStyle(fontSize: 30, height: 34 / 30),
              ),
              Text.rich(
                TextSpan(
                  children: [
                    TextSpan(text: '$banked min', style: zStyle(context, TextVariant.mono).copyWith(fontSize: 16)),
                    TextSpan(text: " banked. That's ${app.sessionsToday} today."),
                  ],
                ),
                style: zStyle(context, TextVariant.body).copyWith(fontSize: 16),
              ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(24, 22, 24, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: 18,
            children: [
              Row(
                spacing: 10,
                children: [
                  for (final t in tiles)
                    Expanded(
                      child: Surface(
                        shadow: ShadowSize.sm,
                        radius: 12,
                        padding: const EdgeInsets.all(10),
                        child: Column(
                          children: [
                            Text(t.value, style: mono(FontWeight.w700, 21, 28).copyWith(color: Palette.ink)),
                            ZText(t.label, variant: TextVariant.small, muted: true, style: const TextStyle(fontSize: 12)),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
              const Field(label: 'What did you work on?', placeholder: 'Knapsack + LCS practice problems'),
              Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                spacing: 8,
                children: [
                  const ZText('How focused were you?', variant: TextVariant.h3, style: TextStyle(fontSize: 14)),
                  Row(
                    spacing: 8,
                    children: [
                      for (final r in _ratings)
                        Expanded(
                          child: ZChip(label: r, tone: Tone.focus, padding: 4, selected: _rating == r, onTap: () => setState(() => _rating = r)),
                        ),
                    ],
                  ),
                ],
              ),
              CheckRow(checked: _share, onChanged: (v) => setState(() => _share = v), label: 'Share progress with Algorithms Circle'),
              Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                spacing: 12,
                children: [
                  ZButton(label: 'Take a 5 min break', variant: ButtonVariant.live, size: ButtonSize.lg, onTap: () => goBack(context, '/focus')),
                  ZButton(label: 'Done for now', variant: ButtonVariant.secondary, size: ButtonSize.lg, onTap: () => context.go('/home')),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}
