import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../state/app_state.dart';
import '../../theme/tokens.dart';
import '../../widgets/widgets.dart';

const _styles = ['Focused solo work', 'Pair programming', 'Group discussion', 'Exam prep', 'Project collaboration'];
const _topics = ['Algorithms', 'React', 'Data structures', 'Physics', 'Calculus', 'Machine learning', 'Databases', 'UI design'];
const _times = ['Morning', 'Day', 'Evening', 'Late'];

List<String> toggleIn(List<String> list, String item) => list.contains(item) ? list.where((x) => x != item).toList() : [...list, item];

class OnboardingStyleScreen extends StatelessWidget {
  const OnboardingStyleScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final p = app.profile;
    return Screen(
      header: const TopBar(fallback: '/onboarding-about', center: StepProgress(step: 2, total: 2)),
      footer: Padding(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
        child: ZButton(label: 'Finish setup', size: ButtonSize.lg, disabled: p.interests.isEmpty, onTap: () => context.go('/home')),
      ),
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          spacing: 6,
          children: [
            const ZText(
              'How do you like to study?',
              variant: TextVariant.title,
              header: true,
              style: TextStyle(fontSize: 30, height: 34 / 30),
            ),
            ZText('We use this to score matches. Change it anytime.', muted: true),
          ],
        ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          spacing: 10,
          children: [
            const ZText('Study style', variant: TextVariant.h3),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final s in _styles)
                  ZChip(
                    label: s,
                    selected: p.studyStyle == s,
                    onTap: () => app.updateProfile((p) => p.copyWith(studyStyle: s)),
                  ),
              ],
            ),
          ],
        ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          spacing: 10,
          children: [
            Text.rich(
              TextSpan(
                children: [
                  TextSpan(text: 'Interests ', style: zStyle(context, TextVariant.h3)),
                  TextSpan(text: '· pick a few', style: zStyle(context, TextVariant.small, muted: true)),
                ],
              ),
            ),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final t in _topics)
                  ZChip(
                    label: t,
                    tone: Tone.chat,
                    selected: p.interests.contains(t),
                    onTap: () => app.updateProfile((p) => p.copyWith(interests: toggleIn(p.interests, t))),
                  ),
              ],
            ),
          ],
        ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          spacing: 10,
          children: [
            const ZText('Best times', variant: TextVariant.h3),
            Row(
              spacing: 8,
              children: [
                for (final t in _times)
                  Expanded(
                    child: ZChip(
                      label: t,
                      tone: Tone.focus,
                      padding: 4,
                      selected: p.times.contains(t),
                      onTap: () => app.updateProfile((p) => p.copyWith(times: toggleIn(p.times, t))),
                    ),
                  ),
              ],
            ),
          ],
        ),
        Surface(
          shadow: ShadowSize.sm,
          padding: const EdgeInsets.all(14),
          child: Row(
            spacing: 14,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const ZText('Available for matching', variant: TextVariant.h3),
                    ZText('Classmates can find you and send requests.', variant: TextVariant.small, muted: true),
                  ],
                ),
              ),
              Toggle(
                value: p.available,
                label: 'Available for matching',
                onChanged: (v) => app.updateProfile((p) => p.copyWith(available: v)),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
