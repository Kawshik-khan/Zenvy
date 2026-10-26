import 'package:flutter/material.dart';

import '../theme/tokens.dart';
import '../theme/type.dart';

Widget _dialog(BuildContext context, String title, String? message, List<Widget> actions) => AlertDialog(
  backgroundColor: Palette.white,
  shape: RoundedRectangleBorder(
    borderRadius: BorderRadius.circular(Radii.lg),
    side: const BorderSide(color: Palette.ink, width: 3),
  ),
  title: Text(title, style: variantStyle(TextVariant.h2).copyWith(color: Palette.ink)),
  content: message == null ? null : Text(message, style: variantStyle(TextVariant.body).copyWith(color: Palette.ink)),
  actions: actions,
);

Widget _action(String label, VoidCallback onPressed, {Color color = Palette.ink}) => TextButton(
  onPressed: onPressed,
  style: TextButton.styleFrom(minimumSize: const Size(kTouch, kTouch)),
  child: Text(
    label,
    style: variantStyle(TextVariant.strong).copyWith(color: color, fontWeight: FontWeight.w700),
  ),
);

Future<void> notify(BuildContext context, String title, [String? message]) =>
    showDialog<void>(context: context, builder: (ctx) => _dialog(ctx, title, message, [_action('OK', () => Navigator.of(ctx).pop())]));

Future<void> confirm(BuildContext context, String title, String message, String confirmLabel, VoidCallback onConfirm, {bool destructive = true}) async {
  final ok = await showDialog<bool>(
    context: context,
    builder: (ctx) => _dialog(ctx, title, message, [
      _action('Cancel', () => Navigator.of(ctx).pop(false)),
      _action(confirmLabel, () => Navigator.of(ctx).pop(true), color: destructive ? const Color(0xFFC0391B) : Palette.ink),
    ]),
  );
  if (ok == true) onConfirm();
}
