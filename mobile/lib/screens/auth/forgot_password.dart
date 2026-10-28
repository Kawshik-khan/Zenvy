import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../api/client.dart';
import '../../state/app_state.dart';
import '../../theme/tokens.dart';
import '../../util/validation.dart';
import '../../widgets/widgets.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  String _email = '';
  String? _error;
  String? _sentTo;
  bool _busy = false;

  Future<void> _submit() async {
    if (!isEmail(_email)) {
      setState(() => _error = 'Enter the email you signed up with.');
      return;
    }
    setState(() {
      _error = null;
      _busy = true;
    });
    try {
      await AppScope.read(context).api.forgotPassword(_email);
      if (mounted) setState(() => _sentTo = _email.trim());
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final sent = _sentTo;
    return Screen(
      header: const TopBar(fallback: '/log-in'),
      children: [
        Center(
          child: Surface(
            tone: sent == null ? Tone.focus : Tone.live,
            radius: 18,
            width: 96,
            height: 96,
            alignment: Alignment.center,
            child: Icon(sent == null ? LucideIcons.lock : LucideIcons.mail, size: 46, color: Palette.ink),
          ),
        ),
        if (sent == null) ...[
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            spacing: 6,
            children: [
              const ZText('Reset your password', variant: TextVariant.title, header: true),
              ZText("We'll email you a link to choose a new one. It works once and expires in an hour.", muted: true),
            ],
          ),
          Field(
            label: 'Email',
            placeholder: 'you@g.bracu.ac.bd',
            keyboardType: TextInputType.emailAddress,
            autofillHints: const [AutofillHints.email],
            capitalization: TextCapitalization.none,
            onChanged: (v) => _email = v,
            error: _error,
          ),
          ZButton(label: _busy ? 'Sending…' : 'Send reset link', size: ButtonSize.lg, disabled: _busy, onTap: _submit),
        ] else ...[
          Semantics(
            liveRegion: true,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              spacing: 6,
              children: [
                const ZText('Check your inbox', variant: TextVariant.title, header: true),
                ZText('If an account uses $sent, a reset link is on its way. Open it on any device, then log in here with your new password.', muted: true),
              ],
            ),
          ),
          ZButton(label: 'Back to log in', size: ButtonSize.lg, onTap: () => goBack(context, '/log-in')),
        ],
      ],
    );
  }
}
