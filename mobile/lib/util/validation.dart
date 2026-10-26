import 'dart:ui';

import '../theme/tokens.dart';

final _email = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');

bool isEmail(String value) => _email.hasMatch(value.trim());

class PasswordStrength {
  const PasswordStrength(this.score, this.label, this.color);
  final int score;
  final String label;
  final Color color;
}

/// 0–4. Two or more is the minimum the web app accepts (8+ characters with a number).
PasswordStrength passwordStrength(String pw) {
  var score = 0;
  if (pw.length >= 8) score++;
  if (RegExp(r'\d').hasMatch(pw) && pw.length >= 8) score++;
  if (RegExp('[A-Z]').hasMatch(pw) && RegExp('[a-z]').hasMatch(pw)) score++;
  if (RegExp('[^A-Za-z0-9]').hasMatch(pw) || pw.length >= 14) score++;
  final label = score <= 1
      ? 'Too weak'
      : score == 2
      ? 'Okay'
      : score == 3
      ? 'Strong'
      : 'Very strong';
  final color = score <= 1
      ? Palette.alert
      : score == 2
      ? Palette.focus
      : Palette.live;
  return PasswordStrength(score, label, color);
}
