import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../data/models.dart';
import '../state/app_state.dart';
import '../theme/tokens.dart';
import '../theme/type.dart';
import '../widgets/widgets.dart';
import 'tabs/home.dart' show dailyGoalMinutes;

class FocusDoneScreen extends StatelessWidget {
  const FocusDoneScreen({super.key, this.minutes, this.saved = true});
  final int? minutes;
  final bool saved;

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final banked = minutes ?? 25;
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
                    TextSpan(text: saved ? ' banked to your stats.' : ' focused, but not saved.'),
                  ],
                ),
                textAlign: TextAlign.center,
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
              Loader<StudyStats>(
                load: app.api.stats,
                frame: (context, body) => const SizedBox(height: 80),
                builder: (context, stats, _) {
                  final goal = ((stats.todayMinutes / dailyGoalMinutes).clamp(0.0, 1.0) * 100).round();
                  final tiles = [
                    (value: formatMinutes(stats.todayMinutes).replaceAll(' ', ''), label: 'Today'),
                    (value: '${stats.streakDays}d', label: 'Streak'),
                    (value: '$goal%', label: 'Daily goal'),
                  ];
                  return Row(
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
                  );
                },
              ),
              if (!saved) ZText("We couldn't reach Zenvy, so this round isn't in your stats.", variant: TextVariant.small, color: Palette.alert),
              Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                spacing: 12,
                children: [
                  ZButton(label: 'Take a 5 min break', variant: ButtonVariant.live, size: ButtonSize.lg, onTap: () => goBack(context, '/focus')),
                  ZButton(label: 'See my stats', variant: ButtonVariant.secondary, size: ButtonSize.lg, onTap: () => context.pushReplacement('/stats')),
                  ZButton(label: 'Done for now', variant: ButtonVariant.ghost, onTap: () => context.go('/home')),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}
