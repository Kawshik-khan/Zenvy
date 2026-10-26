import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../theme/tokens.dart';
import '../../theme/type.dart';
import '../../widgets/widgets.dart';

const _length = 6;

class VerifyScreen extends StatefulWidget {
  const VerifyScreen({super.key, this.email});
  final String? email;

  @override
  State<VerifyScreen> createState() => _VerifyScreenState();
}

class _VerifyScreenState extends State<VerifyScreen> {
  final _controllers = List.generate(_length, (_) => TextEditingController());
  final _nodes = List.generate(_length, (_) => FocusNode());
  int _focused = 0;
  int _seconds = 42;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    for (var i = 0; i < _length; i++) {
      _nodes[i].addListener(() {
        if (_nodes[i].hasFocus) setState(() => _focused = i);
      });
    }
    _startCountdown();
  }

  void _startCountdown() {
    _timer?.cancel();
    setState(() => _seconds = 42);
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (_seconds <= 1) t.cancel();
      setState(() => _seconds--);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    for (final c in _controllers) {
      c.dispose();
    }
    for (final n in _nodes) {
      n.dispose();
    }
    super.dispose();
  }

  void _setDigit(int i, String value) {
    final clean = value.replaceAll(RegExp(r'\D'), '');
    if (clean.length > 1) {
      // Pasted or autofilled code.
      final next = clean.substring(0, math.min(clean.length, _length)).split('');
      for (var j = 0; j < _length; j++) {
        _controllers[j].text = j < next.length ? next[j] : '';
      }
      _nodes[math.min(next.length, _length - 1)].requestFocus();
      setState(() {});
      return;
    }
    _controllers[i].text = clean;
    if (clean.isNotEmpty && i < _length - 1) _nodes[i + 1].requestFocus();
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final complete = _controllers.every((c) => c.text.isNotEmpty);
    return Screen(
      gap: 24,
      header: const TopBar(
        fallback: '/sign-up',
        right: ZText('Step 2 of 3', variant: TextVariant.label),
      ),
      children: [
        Padding(
          padding: const EdgeInsets.only(top: 12),
          child: Center(
            child: Transform.rotate(
              angle: -4 * math.pi / 180,
              child: const Surface(
                tone: Tone.match,
                radius: 18,
                width: 108,
                height: 108,
                alignment: Alignment.center,
                child: Icon(LucideIcons.mail, size: 54, color: Palette.ink),
              ),
            ),
          ),
        ),
        Column(
          spacing: 8,
          children: [
            const ZText('Check your inbox', variant: TextVariant.title, header: true),
            Text.rich(
              TextSpan(
                children: [
                  const TextSpan(text: 'We sent a 6-digit code to\n'),
                  TextSpan(text: widget.email?.isNotEmpty == true ? widget.email : 'your email', style: zStyle(context, TextVariant.strong)),
                ],
              ),
              textAlign: TextAlign.center,
              style: zStyle(context, TextVariant.body, muted: true),
            ),
          ],
        ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          spacing: 10,
          children: [
            const ZText('Verification code', variant: TextVariant.h3, style: TextStyle(fontSize: 14)),
            AutofillGroup(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  for (var i = 0; i < _length; i++)
                    SizedBox(
                      width: 50,
                      height: 64,
                      // Backspace on an empty box moves to the previous one (hardware keyboards).
                      child: Focus(
                        canRequestFocus: false,
                        skipTraversal: true,
                        onKeyEvent: (_, e) {
                          if (e is KeyDownEvent && e.logicalKey == LogicalKeyboardKey.backspace && _controllers[i].text.isEmpty && i > 0) {
                            _nodes[i - 1].requestFocus();
                            return KeyEventResult.handled;
                          }
                          return KeyEventResult.ignored;
                        },
                        child: TextField(
                          controller: _controllers[i],
                          focusNode: _nodes[i],
                          autofocus: i == 0,
                          onChanged: (t) => _setDigit(i, t),
                          keyboardType: TextInputType.number,
                          autofillHints: i == 0 ? const [AutofillHints.oneTimeCode] : null,
                          textAlign: TextAlign.center,
                          textAlignVertical: TextAlignVertical.center,
                          expands: true,
                          maxLines: null,
                          inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(i == 0 ? _length : 2)],
                          style: mono(FontWeight.w700, 26, 30).copyWith(color: Palette.ink),
                          cursorColor: Palette.ink,
                          decoration: InputDecoration(
                            semanticCounterText: 'Digit ${i + 1} of $_length',
                            counterText: '',
                            filled: true,
                            fillColor: _controllers[i].text.isNotEmpty ? Palette.focus : Palette.white,
                            contentPadding: EdgeInsets.zero,
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(10),
                              borderSide: BorderSide(color: _focused == i ? Palette.chat : Palette.ink, width: 3),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(10),
                              borderSide: const BorderSide(color: Palette.chat, width: 3),
                            ),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          spacing: 8,
          children: [
            const Icon(LucideIcons.clock, size: 18, color: Palette.muted),
            if (_seconds > 0)
              Text.rich(
                TextSpan(
                  children: [
                    const TextSpan(text: 'Resend code in '),
                    TextSpan(text: '0:${_seconds.toString().padLeft(2, '0')}', style: zStyle(context, TextVariant.mono)),
                  ],
                ),
                style: zStyle(context, TextVariant.small, muted: true),
              )
            else
              ZButton(label: 'Resend code', variant: ButtonVariant.ghost, size: ButtonSize.sm, onTap: _startCountdown),
          ],
        ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          spacing: 8,
          children: [
            ZButton(label: 'Verify and continue', size: ButtonSize.lg, disabled: !complete, onTap: () => context.go('/onboarding-about')),
            ZButton(label: 'Use a different email', variant: ButtonVariant.ghost, onTap: () => goBack(context, '/sign-up')),
          ],
        ),
      ],
    );
  }
}
