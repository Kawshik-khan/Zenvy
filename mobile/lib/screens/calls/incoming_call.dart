import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/sample.dart';
import '../../router.dart';
import '../../state/app_state.dart';
import '../../theme/tokens.dart';
import '../../theme/type.dart';
import '../../widgets/widgets.dart';

const _quick = ["Can't talk, text me", '5 min', 'In a session'];

class _CallButton extends StatelessWidget {
  const _CallButton({required this.label, required this.fill, required this.onTap, required this.child});
  final String label;
  final Color fill;
  final VoidCallback onTap;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Column(
      spacing: 10,
      children: [
        Semantics(
          button: true,
          label: label,
          excludeSemantics: true,
          child: GestureDetector(
            onTap: onTap,
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                Positioned(
                  left: 4,
                  top: 4,
                  child: Container(
                    width: 80,
                    height: 80,
                    decoration: const BoxDecoration(color: Palette.paper, shape: BoxShape.circle),
                  ),
                ),
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: fill,
                    shape: BoxShape.circle,
                    border: Border.all(color: Palette.paper, width: 3),
                  ),
                  child: child,
                ),
              ],
            ),
          ),
        ),
        ExcludeSemantics(
          child: ZText(label.split(' ').first, variant: TextVariant.strong, color: Palette.paper),
        ),
      ],
    );
  }
}

class IncomingCallScreen extends StatelessWidget {
  const IncomingCallScreen({super.key, required this.id});
  final String id;

  @override
  Widget build(BuildContext context) {
    final caller = person(id);
    final partner = partnerById(id);
    return Screen(
      background: Palette.ink,
      lightStatusBar: true,
      body: Stack(
        children: [
          const GridBackground(color: Palette.paper, opacity: 0.07),
          LayoutBuilder(
            builder: (context, c) => SingleChildScrollView(
              child: ConstrainedBox(
                constraints: BoxConstraints(minHeight: c.maxHeight),
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(28, 40, 28, 24),
                  // Fills the screen height without intrinsics: the call buttons sit at the bottom.
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(99),
                              border: Border.all(color: Palette.paper, width: 2),
                            ),
                            child: const ZText('Incoming video call', variant: TextVariant.label, color: Palette.paper),
                          ),
                          const SizedBox(height: 44),
                          ExcludeSemantics(
                            child: SizedBox(
                              width: 220,
                              height: 220,
                              child: Stack(
                                alignment: Alignment.center,
                                clipBehavior: Clip.none,
                                children: [
                                  CustomPaint(size: const Size(220, 220), painter: _DashedCircle()),
                                  Container(
                                    width: 176,
                                    height: 176,
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      border: Border.all(color: const Color(0xCC3DDC97), width: 3),
                                    ),
                                  ),
                                  Positioned(
                                    left: 48,
                                    top: 48,
                                    child: Container(
                                      width: 136,
                                      height: 136,
                                      decoration: const BoxDecoration(color: Palette.live, shape: BoxShape.circle),
                                    ),
                                  ),
                                  Container(
                                    width: 136,
                                    height: 136,
                                    alignment: Alignment.center,
                                    decoration: BoxDecoration(
                                      color: caller.color,
                                      shape: BoxShape.circle,
                                      border: Border.all(color: Palette.paper, width: 3),
                                    ),
                                    child: Text(caller.initials, style: grotesk(FontWeight.w700, 46, 54).copyWith(color: Palette.ink)),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 30),
                          ZText(
                            caller.name,
                            variant: TextVariant.title,
                            color: Palette.paper,
                            header: true,
                            style: const TextStyle(fontSize: 32, height: 36 / 32),
                          ),
                          ZText(partner != null ? 'Study partner · ${partner.inCommon}' : 'Classmate', color: Palette.quietShade),
                          const SizedBox(height: 32),
                          Wrap(
                            alignment: WrapAlignment.center,
                            spacing: 8,
                            runSpacing: 8,
                            children: [
                              for (final q in _quick)
                                Semantics(
                                  button: true,
                                  label: 'Decline and reply: $q',
                                  excludeSemantics: true,
                                  child: GestureDetector(
                                    onTap: () {
                                      AppScope.read(context).sendDm(caller.id, q);
                                      context.pushReplacement('/dm/${caller.id}');
                                    },
                                    child: Container(
                                      height: kTouch,
                                      padding: const EdgeInsets.symmetric(horizontal: 14),
                                      decoration: BoxDecoration(
                                        borderRadius: BorderRadius.circular(99),
                                        border: Border.all(color: Palette.paper, width: 2),
                                      ),
                                      child: Center(
                                        widthFactor: 1,
                                        child: ZText(q, variant: TextVariant.strong, color: Palette.paper, style: const TextStyle(fontSize: 14)),
                                      ),
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          _CallButton(
                            label: 'Decline call',
                            fill: Palette.alert,
                            onTap: () => goBack(context, '/messages'),
                            child: Transform.rotate(
                              angle: 135 * math.pi / 180,
                              child: const Icon(LucideIcons.phone, size: 32, color: Palette.ink),
                            ),
                          ),
                          _CallButton(
                            label: 'Accept call',
                            fill: Palette.live,
                            onTap: () => context.pushReplacement(withQuery('/call/active', {'title': caller.name})),
                            child: const Icon(LucideIcons.video, size: 32, color: Palette.ink),
                          ),
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

class _DashedCircle extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0x803DDC97)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;
    final r = size.width / 2 - 1;
    const segments = 48;
    for (var i = 0; i < segments; i++) {
      final a = i * 2 * math.pi / segments;
      canvas.drawArc(Rect.fromCircle(center: size.center(Offset.zero), radius: r), a, math.pi / segments, false, paint);
    }
  }

  @override
  bool shouldRepaint(_DashedCircle old) => false;
}
