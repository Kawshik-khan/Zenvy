import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../theme/tokens.dart';
import '../../theme/type.dart';
import '../../widgets/widgets.dart';

Widget _tilt(double degrees, Widget child) => Transform.rotate(angle: degrees * math.pi / 180, child: child);

class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Screen(
      body: Stack(
        children: [
          const GridBackground(),
          LayoutBuilder(
            builder: (context, c) => SingleChildScrollView(
              child: ConstrainedBox(
                constraints: BoxConstraints(minHeight: c.maxHeight),
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
                  // Fills the screen height without intrinsics: free space goes around the headline.
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          const Align(alignment: Alignment.centerLeft, child: Logo()),
                          const SizedBox(height: 24),
                          ExcludeSemantics(
                            child: SizedBox(
                              height: 300,
                              child: Stack(
                                clipBehavior: Clip.none,
                                children: [
                                  Positioned(
                                    left: 0,
                                    top: 6,
                                    width: 220,
                                    child: _tilt(
                                      -4,
                                      Surface(
                                        padding: const EdgeInsets.all(14),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.stretch,
                                          spacing: 12,
                                          children: [
                                            const Row(
                                              spacing: 10,
                                              children: [
                                                Avatar(initials: 'NR', color: Palette.match),
                                                Expanded(
                                                  child: Column(
                                                    crossAxisAlignment: CrossAxisAlignment.start,
                                                    children: [
                                                      ZText('Nadia R.', variant: TextVariant.h3, maxLines: 1),
                                                      ZText('CSE · Semester 5', variant: TextVariant.small, muted: true, maxLines: 1),
                                                    ],
                                                  ),
                                                ),
                                              ],
                                            ),
                                            Row(
                                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                              children: [
                                                const ZBadge(label: '92% match', tone: Tone.match),
                                                Flexible(
                                                  child: ZText(
                                                    'Algorithms',
                                                    variant: TextVariant.mono,
                                                    muted: true,
                                                    maxLines: 1,
                                                    style: const TextStyle(fontSize: 11),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ),
                                  Positioned(
                                    right: 0,
                                    top: 112,
                                    width: 170,
                                    child: _tilt(
                                      3,
                                      Surface(
                                        tone: Tone.focus,
                                        padding: const EdgeInsets.all(14),
                                        child: Column(
                                          children: [
                                            const ZText('Focus', variant: TextVariant.label, color: Palette.ink),
                                            Text('24:59', style: mono(FontWeight.w700, 38, 44).copyWith(color: Palette.ink)),
                                            const ZText('Deep work · round 2', variant: TextVariant.small),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ),
                                  Positioned(
                                    left: 20,
                                    top: 206,
                                    width: 230,
                                    child: _tilt(
                                      -1.5,
                                      const Surface(
                                        tone: Tone.chat,
                                        padding: EdgeInsets.all(12),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            ZText('Tanvir A.', variant: TextVariant.h3),
                                            ZText(
                                              'Library room 3 at 7? Bringing the DP notes.',
                                              variant: TextVariant.small,
                                              style: TextStyle(fontSize: 14, height: 19 / 14),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const ZText(
                              'Find your people.\nDo the work.',
                              variant: TextVariant.display,
                              header: true,
                              style: TextStyle(fontSize: 38, height: 40 / 38),
                            ),
                            const SizedBox(height: 12),
                            ZText(
                              'Match with classmates who study like you, focus together, and talk it through in one place.',
                              muted: true,
                              style: const TextStyle(fontSize: 16, height: 1.5),
                            ),
                          ],
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          const ZButton(label: 'Create free account', size: ButtonSize.lg, iconRight: LucideIcons.arrowRight, href: '/sign-up'),
                          const SizedBox(height: 14),
                          const ZButton(label: 'I already have an account', variant: ButtonVariant.secondary, size: ButtonSize.lg, href: '/log-in'),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
