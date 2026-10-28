import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../state/app_state.dart';
import '../../theme/tokens.dart';
import '../../widgets/widgets.dart';

const _semesters = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

class OnboardingAboutScreen extends StatefulWidget {
  const OnboardingAboutScreen({super.key});

  @override
  State<OnboardingAboutScreen> createState() => _OnboardingAboutScreenState();
}

class _OnboardingAboutScreenState extends State<OnboardingAboutScreen> {
  late final _college = TextEditingController(text: AppScope.read(context).me?.college ?? '');
  late final _major = TextEditingController(text: AppScope.read(context).me?.major ?? '');
  late int? _semester = AppScope.read(context).me?.semester;
  bool _busy = false;
  String? _majorError;

  @override
  void dispose() {
    _college.dispose();
    _major.dispose();
    super.dispose();
  }

  Future<void> _next() async {
    if (_major.text.trim().isEmpty) {
      setState(() => _majorError = 'Add your major so we can match you.');
      return;
    }
    setState(() {
      _majorError = null;
      _busy = true;
    });
    final ok = await attempt(
      context,
      () => AppScope.read(context).updateMe({'college': _college.text.trim(), 'major': _major.text.trim(), 'semester': _semester}),
    );
    if (!mounted) return;
    setState(() => _busy = false);
    if (ok) context.push('/onboarding-style');
  }

  @override
  Widget build(BuildContext context) {
    return Screen(
      header: const TopBar(fallback: '/home', center: StepProgress(step: 1, total: 2)),
      footer: Padding(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
        child: Row(
          spacing: 12,
          children: [
            Expanded(
              child: ZButton(label: 'Skip', variant: ButtonVariant.secondary, size: ButtonSize.lg, onTap: () => context.go('/home')),
            ),
            Expanded(
              flex: 2,
              child: ZButton(label: _busy ? 'Saving…' : 'Next', size: ButtonSize.lg, iconRight: LucideIcons.arrowRight, disabled: _busy, onTap: _next),
            ),
          ],
        ),
      ),
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          spacing: 6,
          children: [
            const ZText(
              'Tell classmates who you are',
              variant: TextVariant.title,
              header: true,
              style: TextStyle(fontSize: 30, height: 34 / 30),
            ),
            ZText('This is what partners see before they connect.', muted: true),
          ],
        ),
        Field(label: 'College', controller: _college, placeholder: 'Your university', capitalization: TextCapitalization.words),
        Field(label: 'Major', controller: _major, placeholder: 'Computer Science', capitalization: TextCapitalization.words, error: _majorError),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          spacing: 8,
          children: [
            const ZText('Semester', variant: TextVariant.h3, style: TextStyle(fontSize: 14)),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final s in _semesters)
                  SizedBox(
                    width: 52,
                    child: ZChip(
                      label: '$s',
                      selected: _semester == s,
                      tone: Tone.focus,
                      padding: 4,
                      onTap: () => setState(() => _semester = _semester == s ? null : s),
                    ),
                  ),
              ],
            ),
          ],
        ),
        ZText('You can add a photo from your profile later.', variant: TextVariant.small, muted: true),
      ],
    );
  }
}
