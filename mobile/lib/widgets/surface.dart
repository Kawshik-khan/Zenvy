import 'dart:ui' as ui;

import 'package:flutter/widgets.dart';
import 'package:go_router/go_router.dart';

import '../theme/tokens.dart';
import '../theme/volume.dart';

const _tabRoots = {'/home', '/partners', '/messages', '/jobs', '/more'};

/// Switches tab for the five tab roots, pushes everything else.
void openRoute(BuildContext context, String location) {
  if (_tabRoots.contains(Uri.parse(location).path)) {
    context.go(location);
  } else {
    context.push(location);
  }
}

enum ShadowSize { none, sm, md, lg }

const _shadowScale = {ShadowSize.none: 0.0, ShadowSize.sm: 0.75, ShadowSize.md: 1.25, ShadowSize.lg: 2.0};

/// The Zenvy Brutal surface: flat fill, ink edge and a hard offset shadow drawn as a second box.
/// Pressable surfaces sink into their shadow while pressed, like the web `nb-press` utility.
class Surface extends StatefulWidget {
  const Surface({
    super.key,
    this.tone = Tone.card,
    this.fill,
    this.shadow = ShadowSize.md,
    this.radius = Radii.lg,
    this.borderWidth,
    this.dashed = false,
    this.padding,
    this.width,
    this.height,
    this.alignment,
    this.onTap,
    this.href,
    this.semanticLabel,
    this.selected,
    this.child,
  });

  final Tone tone;

  /// Override the fill (for one-off colours such as avatars).
  final Color? fill;
  final ShadowSize shadow;
  final double radius;
  final double? borderWidth;
  final bool dashed;
  final EdgeInsetsGeometry? padding;
  final double? width;
  final double? height;
  final AlignmentGeometry? alignment;
  final VoidCallback? onTap;

  /// Route to push when tapped.
  final String? href;
  final String? semanticLabel;
  final bool? selected;
  final Widget? child;

  @override
  State<Surface> createState() => _SurfaceState();
}

class _SurfaceState extends State<Surface> {
  bool _pressed = false;

  void _setPressed(bool value) {
    if (_pressed != value) setState(() => _pressed = value);
  }

  @override
  Widget build(BuildContext context) {
    final v = VolumeScope.of(context);
    final offset = (v.offset * _shadowScale[widget.shadow]!).roundToDouble();
    final bg = widget.fill ?? toneColor(widget.tone, v);
    final border = widget.borderWidth ?? v.border;
    final interactive = widget.onTap != null || widget.href != null;
    final r = BorderRadius.circular(widget.radius);

    Widget box = Container(
      width: widget.width,
      height: widget.height,
      alignment: widget.alignment,
      padding: widget.padding,
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: bg,
        borderRadius: r,
        border: widget.dashed || border == 0 ? null : Border.all(color: v.line, width: border),
      ),
      child: widget.child,
    );
    if (widget.dashed && border > 0) {
      box = CustomPaint(
        foregroundPainter: DashedBorderPainter(color: v.line, width: border, radius: widget.radius),
        child: box,
      );
    }

    final pressed = interactive && _pressed;
    Widget body = Stack(
      // Passthrough so an Expanded or stretched Surface fills the space it is given.
      fit: StackFit.passthrough,
      clipBehavior: Clip.none,
      children: [
        if (offset > 0 && !pressed)
          Positioned(
            left: offset,
            top: offset,
            right: -offset,
            bottom: -offset,
            child: IgnorePointer(
              child: DecoratedBox(
                decoration: BoxDecoration(color: v.line, borderRadius: r),
              ),
            ),
          ),
        Transform.translate(offset: pressed ? Offset(offset, offset) : Offset.zero, child: box),
      ],
    );

    if (!interactive) {
      return widget.semanticLabel == null ? body : Semantics(container: true, label: widget.semanticLabel, child: body);
    }

    return Semantics(
      button: widget.href == null,
      link: widget.href != null,
      selected: widget.selected,
      label: widget.semanticLabel,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTapDown: (_) => _setPressed(true),
        onTapUp: (_) => _setPressed(false),
        onTapCancel: () => _setPressed(false),
        onTap: () {
          widget.onTap?.call();
          if (widget.href != null) openRoute(context, widget.href!);
        },
        child: body,
      ),
    );
  }
}

/// Dashed rounded-rect edge for "settled" buttons and empty states.
class DashedBorderPainter extends CustomPainter {
  DashedBorderPainter({required this.color, required this.width, required this.radius, this.dash = 6, this.gap = 4});

  final Color color;
  final double width;
  final double radius;
  final double dash;
  final double gap;

  @override
  void paint(Canvas canvas, Size size) {
    final inset = width / 2;
    final rect = Rect.fromLTWH(inset, inset, size.width - width, size.height - width);
    final path = Path()..addRRect(RRect.fromRectAndRadius(rect, Radius.circular((radius - inset).clamp(0, double.infinity))));
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = width;
    for (final ui.PathMetric metric in path.computeMetrics()) {
      var d = 0.0;
      while (d < metric.length) {
        canvas.drawPath(metric.extractPath(d, d + dash), paint);
        d += dash + gap;
      }
    }
  }

  @override
  bool shouldRepaint(DashedBorderPainter old) => old.color != color || old.width != width || old.radius != radius;
}
