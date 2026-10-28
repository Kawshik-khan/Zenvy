import 'package:flutter/widgets.dart';
import 'package:google_fonts/google_fonts.dart';

/// Space Grotesk for text, JetBrains Mono for numbers and labels, as on the web.
TextStyle grotesk(FontWeight weight, double size, double lineHeight, {double letterSpacing = 0}) =>
    GoogleFonts.spaceGrotesk(fontWeight: weight, fontSize: size, height: lineHeight / size, letterSpacing: letterSpacing);

TextStyle mono(FontWeight weight, double size, double lineHeight, {double letterSpacing = 0}) =>
    GoogleFonts.jetBrainsMono(fontWeight: weight, fontSize: size, height: lineHeight / size, letterSpacing: letterSpacing);

enum TextVariant { display, title, h2, h3, body, small, strong, label, mono, monoLg }

TextStyle variantStyle(TextVariant v) => switch (v) {
  TextVariant.display => grotesk(FontWeight.w700, 34, 36, letterSpacing: -0.8),
  TextVariant.title => grotesk(FontWeight.w700, 26, 30, letterSpacing: -0.4),
  TextVariant.h2 => grotesk(FontWeight.w700, 18, 23),
  TextVariant.h3 => grotesk(FontWeight.w700, 15, 20),
  TextVariant.body => grotesk(FontWeight.w400, 15, 22),
  TextVariant.small => grotesk(FontWeight.w400, 13, 18),
  TextVariant.strong => grotesk(FontWeight.w600, 15, 20),
  TextVariant.label => mono(FontWeight.w700, 11, 14, letterSpacing: 0.9),
  TextVariant.mono => mono(FontWeight.w700, 14, 18),
  TextVariant.monoLg => mono(FontWeight.w700, 24, 28),
};
