import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../theme/tokens.dart';
import '../../util/dialogs.dart';
import '../../util/focus_timer.dart';
import '../../widgets/widgets.dart';

const _tiles = [
  (id: 'tanvir', initials: 'TA', name: 'Tanvir', fill: Palette.chat, speaking: true, muted: false),
  (id: 'farhan', initials: 'FJ', name: 'Farhan', fill: Palette.focus, speaking: false, muted: false),
  (id: 'rafia', initials: 'RI', name: 'Rafia', fill: Palette.match, speaking: false, muted: true),
];

class _Control extends StatelessWidget {
  const _Control({required this.icon, required this.label, required this.onTap, this.active, this.danger = false});

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool? active;
  final bool danger;

  @override
  Widget build(BuildContext context) {
    final on = active ?? false;
    final bg = danger
        ? Palette.alert
        : on
        ? Palette.quietInk
        : Palette.quietCard;
    Widget glyph = Icon(icon, size: 22, color: on && !danger ? Palette.quietCard : Palette.quietInk);
    if (danger) glyph = Transform.rotate(angle: 135 * math.pi / 180, child: glyph);
    return Semantics(
      button: true,
      label: label,
      selected: active,
      excludeSemantics: true,
      child: GestureDetector(
        onTap: onTap,
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            Positioned(
              left: 3,
              top: 3,
              right: -3,
              bottom: -3,
              child: DecoratedBox(
                decoration: BoxDecoration(color: Palette.quietInk, borderRadius: BorderRadius.circular(14)),
              ),
            ),
            Container(
              width: danger ? 72 : 56,
              height: 56,
              decoration: BoxDecoration(
                color: bg,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: Palette.quietInk, width: 2),
              ),
              child: glyph,
            ),
          ],
        ),
      ),
    );
  }
}

class ActiveCallScreen extends StatefulWidget {
  const ActiveCallScreen({super.key, required this.title});
  final String title;

  @override
  State<ActiveCallScreen> createState() => _ActiveCallScreenState();
}

class _ActiveCallScreenState extends State<ActiveCallScreen> {
  int _elapsed = 0;
  int _focusLeft = 25 * 60;
  bool _mic = true;
  bool _cam = true;
  late final Timer _clock;

  @override
  void initState() {
    super.initState();
    _clock = Timer.periodic(
      const Duration(seconds: 1),
      (_) => setState(() {
        _elapsed++;
        _focusLeft = math.max(0, _focusLeft - 1);
      }),
    );
  }

  @override
  void dispose() {
    _clock.cancel();
    super.dispose();
  }

  void _leave() => confirm(context, 'Leave this call?', 'The call keeps going for everyone else.', 'Leave', () => goBack(context, '/messages'));

  @override
  Widget build(BuildContext context) {
    final everyone = [..._tiles, (id: 'me', initials: 'NR', name: 'You', fill: Palette.quietCard, speaking: false, muted: !_mic)];
    return Screen(
      volume: Volume.quiet,
      // Video tiles are placeholders: real media comes from LiveKit (app/api/livekit-token on the web).
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          spacing: 14,
          children: [
            Row(
              spacing: 10,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: Palette.live,
                    borderRadius: BorderRadius.circular(99),
                    border: Border.all(color: Palette.quietInk, width: 2),
                  ),
                  child: Row(
                    spacing: 6,
                    children: [
                      Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(color: Palette.quietInk, shape: BoxShape.circle),
                      ),
                      ZText(
                        formatClock(_elapsed),
                        variant: TextVariant.mono,
                        semanticsLabel: 'Call time ${formatClock(_elapsed)}',
                        style: const TextStyle(fontSize: 12),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      ZText(widget.title, variant: TextVariant.h3, maxLines: 1, style: const TextStyle(fontSize: 16)),
                      ZText('${everyone.length} in call', variant: TextVariant.small, muted: true, style: const TextStyle(fontSize: 12)),
                    ],
                  ),
                ),
                Surface(
                  tone: Tone.focus,
                  shadow: ShadowSize.sm,
                  radius: 10,
                  onTap: () => notify(context, 'Call notes', 'Shared notes save to the group chat when the call ends.'),
                  height: 44,
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    spacing: 6,
                    children: [
                      Icon(LucideIcons.fileText, size: 18, color: Palette.quietInk),
                      ZText('Notes', variant: TextVariant.h3, style: TextStyle(fontSize: 13)),
                    ],
                  ),
                ),
              ],
            ),
            Expanded(
              child: _TwoByTwo(
                children: [
                  for (final t in everyone)
                    Semantics(
                      label: '${t.name}${t.speaking ? ', speaking' : ''}${t.muted ? ', muted' : ''}${t.id == 'me' && !_cam ? ', camera off' : ''}',
                      excludeSemantics: true,
                      child: Container(
                        decoration: BoxDecoration(
                          color: t.fill,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: t.speaking ? Palette.live : Palette.quietInk, width: t.speaking ? 3 : 2),
                        ),
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            if (t.id == 'me' && !_cam)
                              const ZText('Camera off', variant: TextVariant.small, muted: true, style: TextStyle(fontSize: 13))
                            else
                              Avatar(initials: t.initials, color: t.id == 'me' ? Palette.career : Palette.quietCard, size: 72),
                            Positioned(
                              left: 8,
                              bottom: 8,
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: Palette.quietCard,
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: Palette.quietInk, width: 2),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  spacing: 5,
                                  children: [
                                    if (t.muted) const Icon(LucideIcons.micOff, size: 13, color: Palette.quietInk),
                                    ZText('${t.name}${t.speaking ? ' · speaking' : ''}', variant: TextVariant.h3, style: const TextStyle(fontSize: 12)),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),
            Surface(
              shadow: ShadowSize.none,
              radius: 12,
              padding: const EdgeInsets.all(10),
              child: Row(
                spacing: 10,
                children: [
                  const Icon(LucideIcons.timer, size: 18, color: Palette.quietInk),
                  Expanded(
                    child: Text.rich(
                      TextSpan(
                        children: [
                          TextSpan(text: 'Shared focus', style: zStyle(context, TextVariant.h3).copyWith(fontSize: 13)),
                          TextSpan(text: ' · ${formatClock(_focusLeft)} left in round 1'),
                        ],
                      ),
                      style: zStyle(context, TextVariant.small).copyWith(fontSize: 13),
                    ),
                  ),
                  SizedBox(
                    width: 80,
                    child: ProgressBar(value: 1 - _focusLeft / (25 * 60), label: 'Shared focus round', tone: Tone.focus, height: 10),
                  ),
                ],
              ),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _Control(
                  icon: _mic ? LucideIcons.mic : LucideIcons.micOff,
                  label: _mic ? 'Mute microphone' : 'Unmute microphone',
                  active: !_mic,
                  onTap: () => setState(() => _mic = !_mic),
                ),
                _Control(
                  icon: _cam ? LucideIcons.video : LucideIcons.videoOff,
                  label: _cam ? 'Turn camera off' : 'Turn camera on',
                  active: !_cam,
                  onTap: () => setState(() => _cam = !_cam),
                ),
                _Control(
                  icon: LucideIcons.monitorUp,
                  label: 'Share screen',
                  onTap: () => notify(context, 'Share screen', 'Screen sharing needs the LiveKit Flutter SDK.'),
                ),
                _Control(
                  icon: LucideIcons.ellipsis,
                  label: 'Call tools',
                  onTap: () => notify(context, 'Call tools', 'Notes, shared timer and whiteboard live here.'),
                ),
                _Control(icon: LucideIcons.phone, label: 'Leave call', danger: true, onTap: _leave),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// Four call tiles filling the space between the header and the controls.
class _TwoByTwo extends StatelessWidget {
  const _TwoByTwo({required this.children});
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    Widget row(int from) => Expanded(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: 10,
        children: [for (final c in children.skip(from).take(2)) Expanded(child: c)],
      ),
    );
    return Column(spacing: 10, children: [row(0), row(2)]);
  }
}
