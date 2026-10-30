import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/models.dart';
import '../../router.dart';
import '../../state/app_state.dart';
import '../../theme/tokens.dart';
import '../../theme/type.dart';
import '../../util/ringer.dart';
import '../../widgets/widgets.dart';

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

class IncomingCallScreen extends StatefulWidget {
  const IncomingCallScreen({super.key, required this.callId, this.callerId, required this.callerName, this.video = false});
  final String callId;
  final String? callerId;
  final String callerName;
  final bool video;

  @override
  State<IncomingCallScreen> createState() => _IncomingCallScreenState();
}

class _IncomingCallScreenState extends State<IncomingCallScreen> {
  bool _busy = false;
  Timer? _ringCheck;

  @override
  void initState() {
    super.initState();
    _ringCheck = Timer.periodic(const Duration(seconds: 3), (_) => _checkStillRinging());
    unawaited(Ringer.start());
  }

  @override
  void dispose() {
    _ringCheck?.cancel();
    unawaited(Ringer.stop());
    super.dispose();
  }

  /// Stops ringing once the caller hangs up (or the ring times out) instead of ringing on.
  Future<void> _checkStillRinging() async {
    if (_busy) return;
    final app = AppScope.read(context);
    try {
      final ringing = await app.api.incomingCall();
      if (!mounted || _busy || ringing?.id == widget.callId) return;
    } catch (_) {
      return; // A missed check just waits for the next one.
    }
    _ringCheck?.cancel();
    unawaited(Ringer.stop());
    app.dismissIncomingCall();
    showMessage(context, 'Missed call from ${widget.callerName}');
    goBack(context, '/home');
  }

  Future<void> _decline({String? reply}) async {
    final app = AppScope.read(context);
    setState(() => _busy = true);
    unawaited(Ringer.stop());
    await app.api.declineCall(widget.callId).catchError((_) {});
    app.dismissIncomingCall();
    if (!mounted) return;
    if (reply != null && widget.callerId != null) {
      // Opens the DM; the quick reply is sent from there so it lands in the right conversation.
      try {
        final conversation = await app.api.openDm(widget.callerId!);
        await app.api.sendDm(conversation.id, reply);
      } catch (error) {
        if (mounted) showError(context, error);
      }
      if (mounted) context.pushReplacement('/dm/${widget.callerId}');
    } else {
      goBack(context, '/home');
    }
  }

  void _accept() {
    _busy = true;
    _ringCheck?.cancel();
    // Stop before the call screen opens its microphone.
    unawaited(Ringer.stop());
    AppScope.read(context).dismissIncomingCall();
    context.pushReplacement(withQuery('/call/active', {'callId': widget.callId, 'title': widget.callerName, 'video': widget.video ? '1' : null}));
  }

  @override
  Widget build(BuildContext context) {
    final caller = UserRef(id: widget.callerId ?? widget.callId, name: widget.callerName);
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
                            child: ZText(widget.video ? 'Incoming video call' : 'Incoming call', variant: TextVariant.label, color: Palette.paper),
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
                            align: TextAlign.center,
                            style: const TextStyle(fontSize: 32, height: 36 / 32),
                          ),
                          const ZText('Study partner', color: Palette.quietShade),
                          const SizedBox(height: 32),
                          if (widget.callerId != null)
                            Wrap(
                              alignment: WrapAlignment.center,
                              spacing: 8,
                              runSpacing: 8,
                              children: [
                                for (final q in const ["Can't talk, text me", 'Call you in 5 min', 'In a focus session'])
                                  Semantics(
                                    button: true,
                                    label: 'Decline and reply: $q',
                                    excludeSemantics: true,
                                    child: GestureDetector(
                                      onTap: _busy ? null : () => _decline(reply: q),
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
                            onTap: _busy ? () {} : () => _decline(),
                            child: Transform.rotate(
                              angle: 135 * math.pi / 180,
                              child: const Icon(LucideIcons.phone, size: 32, color: Palette.ink),
                            ),
                          ),
                          _CallButton(
                            label: 'Accept call',
                            fill: Palette.live,
                            onTap: _busy ? () {} : _accept,
                            child: Icon(widget.video ? LucideIcons.video : LucideIcons.phone, size: 32, color: Palette.ink),
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
