import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../api/client.dart';
import '../state/app_state.dart';
import '../theme/tokens.dart';
import '../widgets/widgets.dart';

/// Permanent account deletion (required by the Play Store). Signing out afterwards returns to the welcome screen.
class DeleteAccountScreen extends StatefulWidget {
  const DeleteAccountScreen({super.key});

  @override
  State<DeleteAccountScreen> createState() => _DeleteAccountScreenState();
}

class _DeleteAccountScreenState extends State<DeleteAccountScreen> {
  static const _word = 'DELETE';

  String _confirmation = '';
  String _password = '';
  String? _error;
  bool _busy = false;

  Future<void> _submit(bool hasPassword) async {
    if (_confirmation.trim() != _word) {
      setState(() => _error = 'Type $_word to confirm.');
      return;
    }
    if (hasPassword && _password.isEmpty) {
      setState(() => _error = 'Enter your password.');
      return;
    }
    setState(() {
      _error = null;
      _busy = true;
    });
    try {
      await AppScope.read(context).deleteAccount(_confirmation.trim(), hasPassword ? _password : null);
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final hasPassword = AppScope.of(context).me?.hasPassword ?? true;
    return Screen(
      header: const TopBar(fallback: '/more'),
      children: [
        Center(
          child: Surface(
            tone: Tone.alert,
            radius: 18,
            width: 96,
            height: 96,
            alignment: Alignment.center,
            child: const Icon(LucideIcons.trash2, size: 46, color: Palette.ink),
          ),
        ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          spacing: 6,
          children: [
            const ZText('Delete your account', variant: TextVariant.title, header: true),
            ZText(
              'This permanently deletes your account, profile, messages, focus history and everything else tied to it. '
              "Study groups and channels you run pass to their longest-standing member. This can't be undone.",
              muted: true,
            ),
          ],
        ),
        Field(
          label: 'Type $_word to confirm',
          placeholder: _word,
          capitalization: TextCapitalization.characters,
          onChanged: (v) => _confirmation = v,
          error: hasPassword ? null : _error,
        ),
        if (hasPassword)
          Field(
            label: 'Your password',
            obscure: true,
            autofillHints: const [AutofillHints.password],
            capitalization: TextCapitalization.none,
            onChanged: (v) => _password = v,
            error: _error,
          ),
        ZButton(
          label: _busy ? 'Deleting…' : 'Delete permanently',
          variant: ButtonVariant.danger,
          size: ButtonSize.lg,
          disabled: _busy,
          onTap: () => _submit(hasPassword),
        ),
      ],
    );
  }
}
