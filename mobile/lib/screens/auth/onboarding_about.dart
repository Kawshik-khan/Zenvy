import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../theme/tokens.dart';
import '../../util/dialogs.dart';
import '../../widgets/widgets.dart';

const _semesters = ['1', '2', '3', '4', '5', '6', '7', '8'];

class OnboardingAboutScreen extends StatefulWidget {
  const OnboardingAboutScreen({super.key});

  @override
  State<OnboardingAboutScreen> createState() => _OnboardingAboutScreenState();
}

class _OnboardingAboutScreenState extends State<OnboardingAboutScreen> {
  String _semester = '5';

  @override
  Widget build(BuildContext context) {
    return Screen(
      header: const TopBar(fallback: '/verify', center: StepProgress(step: 1, total: 2)),
      footer: const Padding(
        padding: EdgeInsets.fromLTRB(20, 8, 20, 12),
        child: Row(
          spacing: 12,
          children: [
            Expanded(
              child: ZButton(label: 'Skip', variant: ButtonVariant.secondary, size: ButtonSize.lg, href: '/home'),
            ),
            Expanded(
              flex: 2,
              child: ZButton(label: 'Next', size: ButtonSize.lg, iconRight: LucideIcons.arrowRight, href: '/onboarding-style'),
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
        Row(
          spacing: 16,
          children: [
            // Photo picking needs image_picker; wire it when uploads go to Supabase Storage.
            Semantics(
              button: true,
              label: 'Add profile photo',
              excludeSemantics: true,
              child: GestureDetector(
                onTap: () => notify(context, 'Profile photo', 'Photo upload uses Supabase Storage, as on the web.'),
                child: CustomPaint(
                  foregroundPainter: DashedBorderPainter(color: Palette.ink, width: 3, radius: 48),
                  child: Container(
                    width: 96,
                    height: 96,
                    decoration: const BoxDecoration(color: Palette.white, shape: BoxShape.circle),
                    child: const Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      spacing: 2,
                      children: [
                        Icon(LucideIcons.upload, size: 26, color: Palette.ink),
                        ZText('Add photo', variant: TextVariant.small, style: TextStyle(fontSize: 12)),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            Expanded(child: ZText('Optional. JPG or PNG up to 5 MB. Without one we show your initials.', variant: TextVariant.small, muted: true)),
          ],
        ),
        const Field(label: 'College', initialValue: 'BRAC University', placeholder: 'Your university', capitalization: TextCapitalization.words),
        const Field(label: 'Major', placeholder: 'Computer Science', capitalization: TextCapitalization.words),
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
                    child: ZChip(label: s, selected: _semester == s, tone: Tone.focus, padding: 4, onTap: () => setState(() => _semester = s)),
                  ),
              ],
            ),
          ],
        ),
      ],
    );
  }
}
