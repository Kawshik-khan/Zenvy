import 'package:flutter/widgets.dart';

import '../theme/type.dart';
import '../theme/volume.dart';

export '../theme/type.dart' show TextVariant;

/// Style for a variant in the current volume, for use in [TextSpan]s.
TextStyle zStyle(BuildContext context, TextVariant variant, {bool muted = false, Color? color}) {
  final v = VolumeScope.of(context);
  final tone = color ?? (muted || variant == TextVariant.label ? v.fgMuted : v.fg);
  return variantStyle(variant).copyWith(color: tone);
}

class ZText extends StatelessWidget {
  const ZText(
    this.text, {
    super.key,
    this.variant = TextVariant.body,
    this.muted = false,
    this.color,
    this.style,
    this.maxLines,
    this.align,
    this.header = false,
    this.semanticsLabel,
  });

  final String text;
  final TextVariant variant;

  /// Secondary text colour for the current volume.
  final bool muted;
  final Color? color;
  final TextStyle? style;
  final int? maxLines;
  final TextAlign? align;
  final bool header;
  final String? semanticsLabel;

  @override
  Widget build(BuildContext context) {
    final label = variant == TextVariant.label ? text.toUpperCase() : text;
    final t = Text(
      label,
      style: zStyle(context, variant, muted: muted, color: color).merge(style),
      maxLines: maxLines,
      overflow: maxLines == null ? null : TextOverflow.ellipsis,
      textAlign: align,
      semanticsLabel: semanticsLabel,
    );
    return header ? Semantics(header: true, child: t) : t;
  }
}
