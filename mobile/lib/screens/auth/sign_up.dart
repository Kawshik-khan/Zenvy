import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../router.dart';
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

  @override
  Widget build(BuildContext context) {
    final strength = passwordStrength(_password);
    final nameError = _name.trim().isEmpty ? 'Enter your name.' : null;
    final emailError = !isEmail(_email) ? 'Enter a valid email address.' : null;
    final passwordError = strength.score < 2 ? 'Use at least 8 characters with a number.' : null;
    final valid = nameError == null && emailError == null && passwordError == null;

    void submit() {
      setState(() => _submitted = true);
      if (valid) context.push(withQuery('/verify', {'email': _email.trim()}));
    }

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
        GoogleButton(onTap: () => context.push('/onboarding-about')),
        const OrDivider(),
        Field(
          label: 'Full name',
          placeholder: 'Nadia Rahman',
          autofillHints: const [AutofillHints.name],
          capitalization: TextCapitalization.words,
          onChanged: (v) => setState(() => _name = v),
          error: _submitted ? nameError : null,
        ),
        Field(
          label: 'Email',
          placeholder: 'you@g.bracu.ac.bd',
          keyboardType: TextInputType.emailAddress,
          autofillHints: const [AutofillHints.email],
          capitalization: TextCapitalization.none,
          onChanged: (v) => setState(() => _email = v),
          error: _submitted ? emailError : null,
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
              error: _submitted ? passwordError : null,
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
                '${_password.isNotEmpty ? '${strength.label}. ' : ''}At least 8 characters with a number.',
                variant: TextVariant.small,
                muted: true,
                style: const TextStyle(fontSize: 12),
              ),
            ),
          ],
        ),
        ZButton(label: 'Create account', size: ButtonSize.lg, onTap: submit),
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
