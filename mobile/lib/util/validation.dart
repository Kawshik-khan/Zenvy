import 'dart:ui';

import '../theme/tokens.dart';

final _email = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');

bool isEmail(String value) => _email.hasMatch(value.trim());

class PasswordStrength {
  const PasswordStrength(this.score, this.label, this.color, {required this.acceptable});
  final int score;
  final String label;
  final Color color;

  /// True when the server will accept it.
  final bool acceptable;
}

/// Same rules as lib/password.ts on the server: 8+ characters with an uppercase letter and a
/// number are required; a symbol makes it stronger. Score 0 (empty) to 4.
PasswordStrength passwordStrength(String pw) {
  final long = pw.length >= 8;
  final upper = RegExp('[A-Z]').hasMatch(pw);
  final number = RegExp(r'\d').hasMatch(pw);
  final symbol = RegExp('[^A-Za-z0-9]').hasMatch(pw);
  final acceptable = long && upper && number && pw.length <= 200;
  if (pw.isEmpty) return PasswordStrength(0, '', Palette.alert, acceptable: false);
  if (!long) return PasswordStrength(1, 'Too short', Palette.alert, acceptable: false);
  final score = (1 + [upper, number, symbol].where((x) => x).length).clamp(1, 4);
  const labels = ['', 'Weak', 'Okay', 'Good', 'Strong'];
  final color = score <= 1
      ? Palette.alert
      : score == 2
      ? Palette.focus
      : Palette.live;
  return PasswordStrength(score, labels[score], color, acceptable: acceptable);
}

/// The first rule the password still breaks, worded like the server's message.
String? passwordProblem(String pw) {
  if (pw.isEmpty) return 'Choose a password.';
  if (pw.length < 8) return 'Use at least 8 characters.';
  if (!RegExp('[A-Z]').hasMatch(pw)) return 'Add at least one uppercase letter.';
  if (!RegExp(r'\d').hasMatch(pw)) return 'Add at least one number.';
  return null;
}
