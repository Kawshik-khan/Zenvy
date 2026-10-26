import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../theme/tokens.dart';
import '../../util/dialogs.dart';
import '../../util/validation.dart';
import '../../widgets/widgets.dart';

class LogInScreen extends StatefulWidget {
  const LogInScreen({super.key});

  @override
  State<LogInScreen> createState() => _LogInScreenState();
}

class _LogInScreenState extends State<LogInScreen> {
  String _email = '';
  String _password = '';
  bool _show = false;
  bool _remember = true;
  String? _error;

  void _submit() {
    if (!isEmail(_email) || _password.length < 8) {
      setState(() => _error = 'Check your email and password and try again.');
      return;
    }
    setState(() => _error = null);
    context.go('/home');
  }

  @override
  Widget build(BuildContext context) {
    return Screen(
      safeTop: false,
      padding: const EdgeInsets.only(bottom: 28),
      gap: 0,
      children: [
        HeaderBand(
          color: Palette.chat,
          height: 210,
          padding: const EdgeInsets.fromLTRB(24, 8, 24, 0),
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              ZIconButton(icon: LucideIcons.chevronLeft, label: 'Back', onTap: () => goBack(context, '/welcome')),
              Positioned(
                right: 4,
                top: 32,
                child: const Surface(
                  tone: Tone.focus,
                  radius: Radii.pill,
                  width: 112,
                  height: 112,
                  alignment: Alignment.center,
                  child: Icon(LucideIcons.lock, size: 52, color: Palette.ink),
                ),
              ),
              const Positioned(left: 0, bottom: 22, child: ZText('Welcome\nback.', variant: TextVariant.display, header: true)),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: 18,
            children: [
              if (_error != null)
                Semantics(
                  liveRegion: true,
                  child: Surface(
                    tone: Tone.alert,
                    shadow: ShadowSize.sm,
                    padding: const EdgeInsets.all(12),
                    child: ZText(_error!, variant: TextVariant.strong),
                  ),
                ),
              Field(
                label: 'Email',
                placeholder: 'you@g.bracu.ac.bd',
                keyboardType: TextInputType.emailAddress,
                autofillHints: const [AutofillHints.email],
                capitalization: TextCapitalization.none,
                onChanged: (v) => _email = v,
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                spacing: 4,
                children: [
                  Field(
                    label: 'Password',
                    obscure: !_show,
                    autofillHints: const [AutofillHints.password],
                    capitalization: TextCapitalization.none,
                    onChanged: (v) => _password = v,
                    right: RevealButton(shown: _show, onToggle: () => setState(() => _show = !_show)),
                  ),
                  Align(
                    alignment: Alignment.centerRight,
                    child: TextButton(
                      onPressed: () => notify(context, 'Reset your password', 'Password reset emails come from the web app until the mobile flow is wired.'),
                      style: TextButton.styleFrom(minimumSize: const Size(kTouch, kTouch), foregroundColor: Palette.ink),
                      child: const ZText(
                        'Forgot password?',
                        variant: TextVariant.strong,
                        style: TextStyle(fontSize: 14, decoration: TextDecoration.underline),
                      ),
                    ),
                  ),
                ],
              ),
              CheckRow(checked: _remember, onChanged: (v) => setState(() => _remember = v), label: 'Keep me signed in'),
              ZButton(label: 'Log in', size: ButtonSize.lg, onTap: _submit),
              GoogleButton(onTap: () => context.go('/home')),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  ZText('New to Zenvy?', muted: true),
                  TextButton(
                    onPressed: () => context.pushReplacement('/sign-up'),
                    style: TextButton.styleFrom(minimumSize: const Size(kTouch, kTouch), foregroundColor: Palette.ink),
                    child: const ZText(
                      'Create an account',
                      variant: TextVariant.strong,
                      style: TextStyle(fontWeight: FontWeight.w700, decoration: TextDecoration.underline),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}
