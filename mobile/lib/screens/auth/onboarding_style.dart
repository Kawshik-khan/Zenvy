import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../state/app_state.dart';
import '../../theme/tokens.dart';
import '../../widgets/widgets.dart';

const studyStyles = ['Focused solo work', 'Pair programming', 'Group discussion', 'Exam prep', 'Project collaboration'];
const suggestedTopics = ['Algorithms', 'Data structures', 'React', 'Python', 'Databases', 'Machine learning', 'Calculus', 'Physics', 'UI design', 'Circuits'];
const studyTimes = ['Morning', 'Afternoons', 'Evenings', 'Late'];

List<String> toggleIn(List<String> list, String item) => list.contains(item) ? list.where((x) => x != item).toList() : [...list, item];

/// Availability is free text on the server; the app stores picked times as "Evenings & Late".
List<String> parseTimes(String? availability) => studyTimes.where((t) => (availability ?? '').toLowerCase().contains(t.toLowerCase())).toList();

class OnboardingStyleScreen extends StatefulWidget {
  const OnboardingStyleScreen({super.key});

  @override
  State<OnboardingStyleScreen> createState() => _OnboardingStyleScreenState();
}

class _OnboardingStyleScreenState extends State<OnboardingStyleScreen> {
  late final _me = AppScope.read(context).me;
  late String? _style = _me?.studyStyle;
  late List<String> _interests = [...?_me?.interests];
  late List<String> _times = parseTimes(_me?.availability);
  late bool _available = _me?.matchingAvailable ?? true;
  bool _busy = false;

  Future<void> _finish() async {
    setState(() => _busy = true);
    final ok = await attempt(
      context,
      () =>
          AppScope.read(context).updateMe({'studyStyle': _style, 'interests': _interests, 'availability': _times.join(' & '), 'matchingAvailable': _available}),
    );
    if (!mounted) return;
    setState(() => _busy = false);
    if (ok) context.go('/home');
  }

  @override
  Widget build(BuildContext context) {
    final topics = {...suggestedTopics, ..._interests}.toList();
    return Screen(
      header: const TopBar(fallback: '/onboarding-about', center: StepProgress(step: 2, total: 2)),
      footer: Padding(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
        child: ZButton(label: _busy ? 'Saving…' : 'Finish setup', size: ButtonSize.lg, disabled: _interests.isEmpty || _busy, onTap: _finish),
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
              children: [for (final s in studyStyles) ZChip(label: s, selected: _style == s, onTap: () => setState(() => _style = s))],
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
                for (final t in topics)
                  ZChip(label: t, tone: Tone.chat, selected: _interests.contains(t), onTap: () => setState(() => _interests = toggleIn(_interests, t))),
              ],
            ),
          ],
        ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          spacing: 10,
          children: [
            const ZText('Best times', variant: TextVariant.h3),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final t in studyTimes)
                  ZChip(label: t, tone: Tone.focus, selected: _times.contains(t), onTap: () => setState(() => _times = toggleIn(_times, t))),
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
              Toggle(value: _available, label: 'Available for matching', onChanged: (v) => setState(() => _available = v)),
            ],
          ),
        ),
      ],
    );
  }
}
