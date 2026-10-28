import 'package:flutter/material.dart';

import '../../api/client.dart';
import '../../state/app_state.dart';
import '../../theme/tokens.dart';
import '../../util/validation.dart';
import '../../widgets/widgets.dart';

class SignUpScreen extends StatefulWidget {
  const SignUpScreen({super.key});

  @override
  State<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends State<SignUpScreen> {
  String _name = '';
  String _email = '';
  String _password = '';
  bool _show = false;
  bool _submitted = false;
  bool _busy = false;
  String? _error;
  Map<String, String> _serverErrors = const {};

  String? get _nameError => _name.trim().isEmpty ? 'Enter your name.' : null;
  String? get _emailError => !isEmail(_email) ? 'Enter a valid email address.' : null;

  Future<void> _submit() async {
    final valid = _nameError == null && _emailError == null && passwordProblem(_password) == null;
    setState(() {
      _submitted = true;
      _serverErrors = const {};
      _error = null;
    });
    if (!valid || _busy) return;
    setState(() => _busy = true);
    try {
      // On success the router moves on to profile setup.
      await AppScope.read(context).signUp(_name, _email, _password);
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _serverErrors = e.fieldErrors;
        _error = e.fieldErrors.isEmpty ? e.message : null;
      });
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final strength = passwordStrength(_password);
    final nameError = _nameError;
    final emailError = _emailError;
    final passwordError = passwordProblem(_password);

    return Screen(
      header: const TopBar(
        fallback: '/welcome',
        right: ZText('Step 1 of 3', variant: TextVariant.label),
      ),
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          spacing: 6,
          children: [
            const ZText(
              'Create your account',
              variant: TextVariant.title,
              header: true,
              style: TextStyle(fontSize: 30, height: 34 / 30),
            ),
            ZText('Takes a minute. Your university email helps classmates trust you.', muted: true),
          ],
        ),
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
          label: 'Full name',
          placeholder: 'Nadia Rahman',
          autofillHints: const [AutofillHints.name],
          capitalization: TextCapitalization.words,
          onChanged: (v) => setState(() => _name = v),
          error: _serverErrors['name'] ?? (_submitted ? nameError : null),
        ),
        Field(
          label: 'Email',
          placeholder: 'you@g.bracu.ac.bd',
          keyboardType: TextInputType.emailAddress,
          autofillHints: const [AutofillHints.email],
          capitalization: TextCapitalization.none,
          onChanged: (v) => setState(() => _email = v),
          error: _serverErrors['email'] ?? (_submitted ? emailError : null),
        ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          spacing: 8,
          children: [
            Field(
              label: 'Password',
              obscure: !_show,
              autofillHints: const [AutofillHints.newPassword],
              capitalization: TextCapitalization.none,
              onChanged: (v) => setState(() => _password = v),
              error: _serverErrors['password'] ?? (_submitted ? passwordError : null),
              right: RevealButton(shown: _show, onToggle: () => setState(() => _show = !_show)),
            ),
            ExcludeSemantics(
              child: Row(
                spacing: 6,
                children: [
                  for (var i = 0; i < 4; i++)
                    Expanded(
                      child: Container(
                        height: 8,
                        decoration: BoxDecoration(
                          color: i < strength.score ? strength.color : Palette.white,
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(color: Palette.ink, width: 2),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            Semantics(
              liveRegion: true,
              child: ZText(
                '${strength.label.isNotEmpty ? '${strength.label}. ' : ''}8+ characters with an uppercase letter and a number.',
                variant: TextVariant.small,
                muted: true,
                style: const TextStyle(fontSize: 12),
              ),
            ),
          ],
        ),
        ZButton(label: _busy ? 'Creating account…' : 'Create account', size: ButtonSize.lg, disabled: _busy, onTap: _submit),
        ZText(
          'By continuing you agree to the Terms and Privacy Policy.',
          variant: TextVariant.small,
          muted: true,
          align: TextAlign.center,
          style: const TextStyle(fontSize: 12),
        ),
      ],
    );
  }
}
