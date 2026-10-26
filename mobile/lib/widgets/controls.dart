import 'package:flutter/material.dart';

import '../theme/tokens.dart';
import '../theme/type.dart';
import '../theme/volume.dart';
import 'surface.dart';
import 'text.dart';

enum ButtonVariant { primary, secondary, ghost, danger, match, chat, focus, live, career }

enum ButtonSize { sm, md, lg }

const _heights = {ButtonSize.sm: kTouch, ButtonSize.md: 48.0, ButtonSize.lg: 56.0};
const _variantTone = {
  ButtonVariant.primary: Tone.ink,
  ButtonVariant.secondary: Tone.card,
  ButtonVariant.ghost: Tone.paper,
  ButtonVariant.danger: Tone.alert,
  ButtonVariant.match: Tone.match,
  ButtonVariant.chat: Tone.chat,
  ButtonVariant.focus: Tone.focus,
  ButtonVariant.live: Tone.live,
  ButtonVariant.career: Tone.career,
};

class ZButton extends StatelessWidget {
  const ZButton({
    super.key,
    required this.label,
    this.onTap,
    this.href,
    this.variant = ButtonVariant.primary,
    this.size = ButtonSize.md,
    this.icon,
    this.iconRight,
    this.disabled = false,
    this.settled = false,
    this.semanticLabel,
  });

  final String label;
  final VoidCallback? onTap;
  final String? href;
  final ButtonVariant variant;
  final ButtonSize size;
  final IconData? icon;
  final IconData? iconRight;
  final bool disabled;

  /// Dashed, shadowless "done" state (Requested, Joined).
  final bool settled;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final v = VolumeScope.of(context);
    final quietDone = disabled || settled;
    final tone = quietDone ? Tone.paper : _variantTone[variant]!;
    final fg = disabled ? v.fgMuted : textOn(tone, v);
    final ghost = variant == ButtonVariant.ghost;
    final lg = size == ButtonSize.lg;
    return Semantics(
      enabled: !disabled,
      label: semanticLabel,
      excludeSemantics: semanticLabel != null,
      button: true,
      child: Surface(
        tone: tone,
        fill: quietDone ? Palette.quietPaper : null,
        shadow: ghost || quietDone ? ShadowSize.none : ShadowSize.sm,
        radius: Radii.md,
        dashed: quietDone,
        borderWidth: ghost ? 0 : null,
        onTap: disabled ? null : onTap,
        href: disabled ? null : href,
        padding: EdgeInsets.symmetric(horizontal: lg ? 22 : 16),
        child: ConstrainedBox(
          constraints: BoxConstraints(minHeight: _heights[size]! - (ghost ? 0 : 2 * v.border)),
          child: LayoutBuilder(
            builder: (context, c) {
              final text = Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: grotesk(FontWeight.w700, lg ? 17 : 15, 20).copyWith(color: fg),
              );
              return Row(
                mainAxisAlignment: MainAxisAlignment.center,
                spacing: 8,
                children: [
                  if (icon != null) Icon(icon, size: lg ? 20 : 18, color: fg),
                  c.hasBoundedWidth ? Flexible(child: text) : text,
                  if (iconRight != null) Icon(iconRight, size: 18, color: fg),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}

class ZIconButton extends StatelessWidget {
  const ZIconButton({
    super.key,
    required this.icon,
    required this.label,
    this.onTap,
    this.href,
    this.tone = Tone.card,
    this.size = kTouch,
    this.badge,
    this.badgeTone = Tone.alert,
    this.selected,
    this.round = false,
    this.iconColor,
    this.shadow = true,
  });

  final IconData icon;

  /// Required: icon-only buttons need a spoken name.
  final String label;
  final VoidCallback? onTap;
  final String? href;
  final Tone tone;
  final double size;
  final String? badge;
  final Tone badgeTone;
  final bool? selected;
  final bool round;
  final Color? iconColor;
  final bool shadow;

  @override
  Widget build(BuildContext context) {
    final v = VolumeScope.of(context);
    return Stack(
      clipBehavior: Clip.none,
      children: [
        Surface(
          tone: tone,
          shadow: shadow ? ShadowSize.sm : ShadowSize.none,
          radius: round ? Radii.pill : Radii.md,
          onTap: onTap,
          href: href,
          semanticLabel: badge != null ? '$label, $badge new' : label,
          selected: selected,
          width: size,
          height: size,
          alignment: Alignment.center,
          child: Icon(icon, size: (size * 0.45).roundToDouble(), color: iconColor ?? textOn(tone, v)),
        ),
        if (badge != null)
          Positioned(
            top: -8,
            right: -8,
            child: CountBadge(value: badge!, tone: badgeTone),
          ),
      ],
    );
  }
}

class CountBadge extends StatelessWidget {
  const CountBadge({super.key, required this.value, this.tone = Tone.alert});

  final String value;
  final Tone tone;

  @override
  Widget build(BuildContext context) {
    final v = VolumeScope.of(context);
    return ExcludeSemantics(
      child: IgnorePointer(
        child: Container(
          constraints: const BoxConstraints(minWidth: 22),
          height: 22,
          padding: const EdgeInsets.symmetric(horizontal: 5),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: toneColor(tone, v),
            borderRadius: BorderRadius.circular(11),
            border: Border.all(color: v.line, width: 2),
          ),
          child: Text(value, style: mono(FontWeight.w700, 11, 14).copyWith(color: v.fg)),
        ),
      ),
    );
  }
}

class ZChip extends StatefulWidget {
  const ZChip({super.key, required this.label, this.selected = false, this.onTap, this.tone = Tone.match, this.padding = 14});

  final String label;
  final bool selected;
  final VoidCallback? onTap;
  final Tone tone;
  final double padding;

  @override
  State<ZChip> createState() => _ZChipState();
}

class _ZChipState extends State<ZChip> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final v = VolumeScope.of(context);
    return Semantics(
      button: true,
      selected: widget.selected,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTapDown: (_) => setState(() => _pressed = true),
        onTapUp: (_) => setState(() => _pressed = false),
        onTapCancel: () => setState(() => _pressed = false),
        onTap: widget.onTap,
        child: AnimatedScale(
          scale: _pressed ? 0.96 : 1,
          duration: const Duration(milliseconds: 90),
          child: Container(
            constraints: const BoxConstraints(minHeight: kTouch),
            padding: EdgeInsets.symmetric(horizontal: widget.padding),
            decoration: BoxDecoration(
              color: widget.selected ? toneColor(widget.tone, v) : v.card,
              borderRadius: BorderRadius.circular(Radii.pill),
              border: Border.all(color: v.line, width: widget.selected ? v.border : v.border - 1),
            ),
            // Factors of 1 keep the chip as wide as its label in a Wrap, while still centring it when stretched.
            child: Center(
              widthFactor: 1,
              heightFactor: 1,
              child: Text(widget.label, maxLines: 1, overflow: TextOverflow.ellipsis, style: zStyle(context, TextVariant.strong).copyWith(fontSize: 14)),
            ),
          ),
        ),
      ),
    );
  }
}

class ZBadge extends StatelessWidget {
  const ZBadge({super.key, required this.label, this.tone = Tone.paper, this.icon, this.dashed = false});

  final String label;
  final Tone tone;
  final IconData? icon;
  final bool dashed;

  @override
  Widget build(BuildContext context) {
    final v = VolumeScope.of(context);
    final fg = textOn(tone, v);
    Widget box = Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 2),
      decoration: BoxDecoration(
        color: toneColor(tone, v),
        borderRadius: BorderRadius.circular(Radii.pill),
        border: dashed ? null : Border.all(color: v.line, width: 2),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        spacing: 4,
        children: [
          if (icon != null) Icon(icon, size: 13, color: fg),
          Text(label, style: grotesk(FontWeight.w600, 12, 16).copyWith(color: fg)),
        ],
      ),
    );
    if (dashed) {
      box = CustomPaint(
        foregroundPainter: DashedBorderPainter(color: v.line, width: 2, radius: 12, dash: 4, gap: 3),
        child: box,
      );
    }
    return box;
  }
}

class Avatar extends StatelessWidget {
  const Avatar({super.key, required this.initials, required this.color, this.size = 44, this.square = false});

  final String initials;
  final Color color;
  final double size;
  final bool square;

  @override
  Widget build(BuildContext context) {
    final v = VolumeScope.of(context);
    return ExcludeSemantics(
      child: Container(
        width: size,
        height: size,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(square ? (size * 0.24).roundToDouble() : size / 2),
          border: Border.all(color: v.line, width: size > 40 ? v.border : v.border - 1),
        ),
        child: Text(initials, style: grotesk(FontWeight.w700, (size * 0.34).roundToDouble(), (size * 0.42).roundToDouble()).copyWith(color: v.fg)),
      ),
    );
  }
}

class ProgressBar extends StatelessWidget {
  const ProgressBar({super.key, required this.value, required this.label, this.tone = Tone.ink, this.height = 16, this.track});

  final double value;
  final String label;
  final Tone tone;
  final double height;
  final Color? track;

  @override
  Widget build(BuildContext context) {
    final v = VolumeScope.of(context);
    final pct = value.clamp(0.0, 1.0);
    return Semantics(
      label: label,
      value: '${(pct * 100).round()}%',
      child: Container(
        height: height,
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          color: track ?? v.card,
          borderRadius: BorderRadius.circular(height),
          border: Border.all(color: v.line, width: v.border),
        ),
        child: FractionallySizedBox(
          alignment: Alignment.centerLeft,
          widthFactor: pct,
          child: ColoredBox(color: toneColor(tone, v)),
        ),
      ),
    );
  }
}

class Field extends StatefulWidget {
  const Field({
    super.key,
    required this.label,
    this.controller,
    this.initialValue,
    this.onChanged,
    this.hint,
    this.error,
    this.right,
    this.placeholder,
    this.multiline = false,
    this.obscure = false,
    this.keyboardType,
    this.autofillHints,
    this.capitalization = TextCapitalization.sentences,
    this.maxLength,
  });

  final String label;
  final TextEditingController? controller;
  final String? initialValue;
  final ValueChanged<String>? onChanged;
  final String? hint;
  final String? error;
  final Widget? right;
  final String? placeholder;
  final bool multiline;
  final bool obscure;
  final TextInputType? keyboardType;
  final Iterable<String>? autofillHints;
  final TextCapitalization capitalization;
  final int? maxLength;

  @override
  State<Field> createState() => _FieldState();
}

class _FieldState extends State<Field> {
  late final TextEditingController _own = TextEditingController(text: widget.initialValue);

  TextEditingController get _controller => widget.controller ?? _own;

  @override
  void dispose() {
    _own.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final v = VolumeScope.of(context);
    OutlineInputBorder edge(Color c) => OutlineInputBorder(
      borderRadius: BorderRadius.circular(Radii.md),
      borderSide: BorderSide(color: c, width: v.border),
    );
    final idle = widget.error != null ? Palette.alert : v.line;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      spacing: 6,
      children: [
        ZText(widget.label, variant: TextVariant.h3, style: const TextStyle(fontSize: 14)),
        TextField(
          controller: _controller,
          onChanged: widget.onChanged,
          obscureText: widget.obscure,
          keyboardType: widget.multiline ? TextInputType.multiline : widget.keyboardType,
          autofillHints: widget.autofillHints,
          textCapitalization: widget.capitalization,
          minLines: widget.multiline ? 4 : 1,
          maxLines: widget.multiline ? 8 : 1,
          maxLength: widget.maxLength,
          style: grotesk(FontWeight.w500, 16, 22).copyWith(color: v.fg),
          cursorColor: v.fg,
          decoration: InputDecoration(
            isDense: true,
            counterText: '',
            filled: true,
            fillColor: Palette.white,
            hintText: widget.placeholder,
            hintStyle: grotesk(FontWeight.w500, 16, 22).copyWith(color: v.fgMuted),
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 15),
            suffixIcon: widget.right,
            enabledBorder: edge(idle),
            focusedBorder: edge(widget.error != null ? Palette.alert : Palette.chat),
            border: edge(idle),
          ),
        ),
        if (widget.error != null)
          Semantics(
            liveRegion: true,
            child: ZText(
              widget.error!,
              variant: TextVariant.small,
              color: Palette.alert,
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
          )
        else if (widget.hint != null)
          ZText(widget.hint!, variant: TextVariant.small, muted: true, style: const TextStyle(fontSize: 12)),
      ],
    );
  }
}

class SegmentOption<K> {
  const SegmentOption(this.key, this.label);
  final K key;
  final String label;
}

class Segmented<K> extends StatelessWidget {
  const Segmented({super.key, required this.options, required this.value, required this.onChanged, this.tone = Tone.ink, required this.label});

  final List<SegmentOption<K>> options;
  final K value;
  final ValueChanged<K> onChanged;
  final Tone tone;
  final String label;

  @override
  Widget build(BuildContext context) {
    final v = VolumeScope.of(context);
    return Semantics(
      label: label,
      container: true,
      child: Container(
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: v.card,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: v.line, width: v.border),
        ),
        child: Row(
          spacing: 4,
          children: [
            for (final o in options)
              Expanded(
                child: Semantics(
                  selected: o.key == value,
                  button: true,
                  child: GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    onTap: () => onChanged(o.key),
                    child: Container(
                      constraints: const BoxConstraints(minHeight: kTouch),
                      alignment: Alignment.center,
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      decoration: BoxDecoration(
                        color: o.key == value ? toneColor(tone, v) : null,
                        borderRadius: BorderRadius.circular(Radii.sm),
                        border: Border.all(color: o.key == value ? v.line : const Color(0x00000000), width: 2),
                      ),
                      child: Text(
                        o.label,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: grotesk(FontWeight.w700, 14, 20).copyWith(color: o.key == value ? textOn(tone, v) : v.fg),
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class Toggle extends StatelessWidget {
  const Toggle({super.key, required this.value, required this.onChanged, required this.label});

  final bool value;
  final ValueChanged<bool> onChanged;
  final String label;

  @override
  Widget build(BuildContext context) {
    final v = VolumeScope.of(context);
    return Semantics(
      toggled: value,
      label: label,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () => onChanged(!value),
        child: SizedBox(
          height: kTouch,
          child: Center(
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 150),
              width: 56,
              height: 32,
              decoration: BoxDecoration(
                color: value ? Palette.live : Palette.heat0,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: v.line, width: v.border),
              ),
              child: AnimatedAlign(
                duration: const Duration(milliseconds: 150),
                alignment: value ? Alignment.centerRight : Alignment.centerLeft,
                child: Container(
                  width: 22,
                  height: 22,
                  margin: const EdgeInsets.symmetric(horizontal: 2),
                  decoration: BoxDecoration(
                    color: Palette.white,
                    shape: BoxShape.circle,
                    border: Border.all(color: v.line, width: v.border),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Square checkbox row used on log in and the session summary.
class CheckRow extends StatelessWidget {
  const CheckRow({super.key, required this.checked, required this.onChanged, required this.label});

  final bool checked;
  final ValueChanged<bool> onChanged;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      checked: checked,
      label: label,
      excludeSemantics: true,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () => onChanged(!checked),
        child: ConstrainedBox(
          constraints: const BoxConstraints(minHeight: kTouch),
          child: Row(
            spacing: 12,
            children: [
              Container(
                width: 26,
                height: 26,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: checked ? Palette.ink : Palette.white,
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: Palette.ink, width: 3),
                ),
                child: checked ? const Icon(Icons.check, size: 16, color: Palette.paper) : null,
              ),
              Expanded(child: ZText(label, variant: TextVariant.strong)),
            ],
          ),
        ),
      ),
    );
  }
}
