import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../theme/tokens.dart';
import '../theme/type.dart';
import 'surface.dart';
import 'text.dart';

/// The notebook grid behind loud hero sections (`bg-grid` on the web). Decorative.
class GridBackground extends StatelessWidget {
  const GridBackground({super.key, this.color = Palette.ink, this.opacity = 0.08, this.size = 42});

  final Color color;
  final double opacity;
  final double size;

  @override
  Widget build(BuildContext context) => Positioned.fill(
    child: IgnorePointer(
      child: ExcludeSemantics(
        child: CustomPaint(painter: _GridPainter(color.withValues(alpha: opacity), size)),
      ),
    ),
  );
}

class _GridPainter extends CustomPainter {
  _GridPainter(this.color, this.step);
  final Color color;
  final double step;

  @override
  void paint(Canvas canvas, Size size) {
    final p = Paint()
      ..color = color
      ..strokeWidth = 2;
    for (var x = 0.0; x <= size.width; x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), p);
    }
    for (var y = 0.0; y <= size.height; y += step) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), p);
    }
  }

  @override
  bool shouldRepaint(_GridPainter old) => old.color != color || old.step != step;
}

class Logo extends StatelessWidget {
  const Logo({super.key, this.size = 40});
  final double size;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Zenvy',
      excludeSemantics: true,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        spacing: 10,
        children: [
          Surface(
            tone: Tone.focus,
            shadow: ShadowSize.sm,
            radius: 10,
            width: size,
            height: size,
            alignment: Alignment.center,
            child: Text('Z', style: grotesk(FontWeight.w700, size * 0.5, size * 0.62).copyWith(color: Palette.ink)),
          ),
          Text('zenvy', style: grotesk(FontWeight.w700, size * 0.6, size * 0.75, letterSpacing: -0.5).copyWith(color: Palette.ink)),
        ],
      ),
    );
  }
}

class GoogleButton extends StatelessWidget {
  const GoogleButton({super.key, required this.onTap});
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Surface(
      shadow: ShadowSize.sm,
      radius: 10,
      onTap: onTap,
      semanticLabel: 'Continue with Google',
      height: 56,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        spacing: 10,
        children: [
          Container(
            width: 26,
            height: 26,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: Palette.focus,
              shape: BoxShape.circle,
              border: Border.all(color: Palette.ink, width: 2),
            ),
            child: Text('G', style: grotesk(FontWeight.w700, 14, 17).copyWith(color: Palette.ink)),
          ),
          ZText('Continue with Google', variant: TextVariant.strong, style: grotesk(FontWeight.w700, 17, 22)),
        ],
      ),
    );
  }
}

class OrDivider extends StatelessWidget {
  const OrDivider({super.key, this.label = 'or with email'});
  final String label;

  @override
  Widget build(BuildContext context) {
    final line = Expanded(child: Container(height: 2, color: Palette.ink.withValues(alpha: 0.2)));
    return Row(
      spacing: 12,
      children: [
        line,
        ZText(
          label,
          variant: TextVariant.small,
          muted: true,
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        line,
      ],
    );
  }
}

class StepProgress extends StatelessWidget {
  const StepProgress({super.key, required this.step, required this.total});
  final int step;
  final int total;

  @override
  Widget build(BuildContext context) {
    return Row(
      spacing: 12,
      children: [
        Expanded(
          child: Semantics(
            label: 'Profile setup',
            value: '$step of $total',
            child: Container(
              height: 16,
              clipBehavior: Clip.antiAlias,
              decoration: BoxDecoration(
                color: Palette.white,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Palette.ink, width: 3),
              ),
              child: FractionallySizedBox(
                alignment: Alignment.centerLeft,
                widthFactor: step / total,
                child: const ColoredBox(color: Palette.focus),
              ),
            ),
          ),
        ),
        ZText('$step/$total', variant: TextVariant.mono, style: const TextStyle(fontSize: 12)),
      ],
    );
  }
}

class RevealButton extends StatelessWidget {
  const RevealButton({super.key, required this.shown, required this.onToggle});
  final bool shown;
  final VoidCallback onToggle;

  @override
  Widget build(BuildContext context) {
    return IconButton(
      onPressed: onToggle,
      tooltip: shown ? 'Hide password' : 'Show password',
      icon: Icon(shown ? LucideIcons.eyeOff : LucideIcons.eye, size: 20, color: Palette.ink),
    );
  }
}
