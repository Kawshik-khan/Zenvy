// Zenvy Brutal tokens for Flutter. Mirrors app/globals.css and components/ui/tokens.ts
// in the web app: each accent carries one meaning, text on every accent is ink.
import 'package:flutter/widgets.dart';

abstract final class Palette {
  static const paper = Color(0xFFFFF8EC);
  static const ink = Color(0xFF111111);
  static const white = Color(0xFFFFFFFF);
  static const match = Color(0xFFFF6B9D);
  static const chat = Color(0xFF4D96FF);
  static const focus = Color(0xFFFFD23F);
  static const live = Color(0xFF3DDC97);
  static const alert = Color(0xFFFF5A36);
  static const career = Color(0xFFB794F6);
  static const muted = Color(0xFF4A4A4A);
  static const quietPaper = Color(0xFFF4EEE2);
  static const quietCard = Color(0xFFFBF8F1);
  static const quietInk = Color(0xFF2B2B2B);
  static const quietMuted = Color(0xFF4F4A42);
  static const quietShade = Color(0xFFE8DFCC);
  static const heat0 = Color(0xFFEFE8D8);
  static const heat1 = Color(0xFFFFE9A3);
  static const heat2 = Color(0xFFFFD23F);
  static const heat3 = Color(0xFFE0A800);
  static const heat4 = Color(0xFF111111);
  static const softCard = Color(0xFFFFFDF8);
}

enum Tone { match, chat, focus, live, alert, career, card, paper, ink }

/// Loud volume for connecting with people; quiet for doing the work (focus, calls, threads).
enum Volume { loud, quiet }

class VolumeTokens {
  const VolumeTokens({
    required this.canvas,
    required this.card,
    required this.line,
    required this.fg,
    required this.fgMuted,
    required this.border,
    required this.offset,
  });

  final Color canvas;
  final Color card;
  final Color line;
  final Color fg;
  final Color fgMuted;
  final double border;
  final double offset;

  static const loud = VolumeTokens(
    canvas: Palette.paper,
    card: Palette.white,
    line: Palette.ink,
    fg: Palette.ink,
    fgMuted: Palette.muted,
    border: 3,
    offset: 4,
  );

  static const quiet = VolumeTokens(
    canvas: Palette.quietPaper,
    card: Palette.quietCard,
    line: Palette.quietInk,
    fg: Palette.quietInk,
    fgMuted: Palette.quietMuted,
    border: 2,
    offset: 3,
  );

  static VolumeTokens of(Volume v) => v == Volume.loud ? loud : quiet;
}

Color toneColor(Tone tone, [VolumeTokens v = VolumeTokens.loud]) => switch (tone) {
  Tone.card => v.card,
  Tone.paper => v.canvas,
  Tone.ink => v.line,
  Tone.match => Palette.match,
  Tone.chat => Palette.chat,
  Tone.focus => Palette.focus,
  Tone.live => Palette.live,
  Tone.alert => Palette.alert,
  Tone.career => Palette.career,
};

/// The one text colour readable on a tone.
Color textOn(Tone tone, [VolumeTokens v = VolumeTokens.loud]) => tone == Tone.ink ? Palette.paper : v.fg;

abstract final class Radii {
  static const double sm = 8;
  static const double md = 10;
  static const double lg = 14;
  static const double pill = 999;
}

/// Minimum touch target, per the design system.
const double kTouch = 44;
