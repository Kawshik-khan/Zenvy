import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/models.dart';
import '../../state/app_state.dart';
import '../../theme/tokens.dart';
import '../../theme/type.dart';
import '../../widgets/widgets.dart';
import 'motion.dart';

const _weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/// Each day you focus becomes a star; days in a row join into a constellation.
/// Missed days stay dark instead of wiping the sky.
class ConstellationCard extends StatelessWidget {
  const ConstellationCard({super.key, required this.home, required this.goalMinutes});
  final HomeData home;
  final int goalMinutes;

  List<DayMinutes> get _days {
    final days = home.progress.lastSevenDays;
    if (days.isNotEmpty) return days;
    final now = DateTime.now();
    return [for (var i = 6; i >= 0; i--) DayMinutes(DateTime(now.year, now.month, now.day - i), i == 0 ? home.todayMinutes : 0, 0)];
  }

  @override
  Widget build(BuildContext context) {
    final days = _days;
    final lit = days.where((d) => d.minutes > 0).length;
    final goal = (home.todayMinutes / goalMinutes).clamp(0.0, 1.0);
    final left = goalMinutes - home.todayMinutes;
    return Container(
      decoration: BoxDecoration(
        color: Palette.ink,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Palette.ink, width: 3),
        boxShadow: const [BoxShadow(color: Palette.focus, offset: Offset(5, 5))],
      ),
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: 12,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Expanded(
                child: Text(
                  home.streakDays > 0 ? '${home.streakDays}-day constellation' : 'Your sky this week',
                  style: grotesk(FontWeight.w700, 22, 26).copyWith(color: Palette.focus),
                ),
              ),
              Text('$lit of 7 nights', style: mono(FontWeight.w500, 11, 14).copyWith(color: Palette.quietShade)),
            ],
          ),
          Semantics(
            label: 'Last seven days: ${days.map((d) => '${_weekdays[d.date.weekday - 1]} ${d.minutes} minutes').join(', ')}',
            child: ExcludeSemantics(
              child: _Sky(days: days, todayMinutes: home.todayMinutes),
            ),
          ),
          const ZText("Today's focus", variant: TextVariant.label, color: Palette.quietShade),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              TweenAnimationBuilder<double>(
                tween: Tween(begin: 0, end: home.todayMinutes.toDouble()),
                duration: motionOn(context) ? const Duration(milliseconds: 900) : Duration.zero,
                curve: Curves.easeOutCubic,
                builder: (_, v, _) => Text.rich(
                  TextSpan(
                    text: '${v.round()}',
                    style: mono(FontWeight.w700, 30, 34).copyWith(color: Palette.paper),
                    children: [
                      TextSpan(
                        text: ' / $goalMinutes min',
                        style: mono(FontWeight.w500, 14, 18).copyWith(color: Palette.quietShade),
                      ),
                    ],
                  ),
                ),
              ),
              const Spacer(),
              Flexible(
                child: Text(
                  home.todayMinutes == 0
                      ? "Tonight's star is waiting"
                      : left > 0
                      ? '${formatMinutes(left)} to goal'
                      : 'Goal reached',
                  textAlign: TextAlign.right,
                  style: grotesk(FontWeight.w500, 12, 16).copyWith(color: Palette.quietShade),
                ),
              ),
            ],
          ),
          TweenAnimationBuilder<double>(
            tween: Tween(begin: 0, end: goal),
            duration: motionOn(context) ? const Duration(milliseconds: 900) : Duration.zero,
            curve: Curves.easeOutBack,
            builder: (_, v, _) => ProgressBar(value: v, label: 'Daily focus goal', tone: Tone.focus, height: 14, track: Palette.quietInk),
          ),
          const SizedBox(
            width: double.infinity,
            child: ZButton(label: 'Start a 25 min focus', variant: ButtonVariant.focus, icon: LucideIcons.play, href: '/focus'),
          ),
        ],
      ),
    );
  }
}

class _Sky extends StatefulWidget {
  const _Sky({required this.days, required this.todayMinutes});
  final List<DayMinutes> days;
  final int todayMinutes;

  @override
  State<_Sky> createState() => _SkyState();
}

class _SkyState extends State<_Sky> with SingleTickerProviderStateMixin, LoopTicker {
  @override
  Duration get loopLength => const Duration(seconds: 3);

  @override
  Widget build(BuildContext context) {
    // Today's star lands with a bounce whenever today's minutes change.
    return TweenAnimationBuilder<double>(
      key: ValueKey(widget.todayMinutes > 0),
      tween: Tween(begin: 0, end: 1),
      duration: motionOn(context) ? const Duration(milliseconds: 700) : Duration.zero,
      curve: Curves.easeOutBack,
      builder: (_, landed, _) => AnimatedBuilder(
        animation: loop,
        builder: (_, _) => CustomPaint(
          size: const Size(double.infinity, 128),
          painter: _SkyPainter(days: widget.days, twinkle: loop.value, landed: landed),
        ),
      ),
    );
  }
}

class _SkyPainter extends CustomPainter {
  _SkyPainter({required this.days, required this.twinkle, required this.landed});
  final List<DayMinutes> days;
  final double twinkle;
  final double landed;

  static const _dim = Color(0xFF6E685C);
  static const _labelColor = Color(0xFFCFC8B8);

  // A steady height per date so a day's star stays put between visits.
  double _height(DateTime d) => ((d.year * 372 + d.month * 31 + d.day) * 2654435761 % 1000) / 1000;

  @override
  void paint(Canvas canvas, Size size) {
    final n = days.length;
    if (n == 0) return;
    const top = 10.0;
    final skyH = size.height - 28;
    final step = size.width / n;
    final pts = [for (var i = 0; i < n; i++) Offset(step * (i + 0.5), top + 8 + _height(days[i].date) * (skyH - 24))];

    // Background stars twinkle out of phase.
    final rnd = math.Random(7);
    for (var i = 0; i < 18; i++) {
      final p = Offset(rnd.nextDouble() * size.width, rnd.nextDouble() * skyH);
      final a = 0.25 + 0.35 * (0.5 + 0.5 * math.sin((twinkle + i / 18) * 2 * math.pi));
      canvas.drawCircle(p, rnd.nextDouble() * 0.8 + 0.6, Paint()..color = _dim.withValues(alpha: a));
    }

    // The current streak: lit days running back from the last day.
    var streakStart = n;
    for (var i = n - 1; i >= 0; i--) {
      if (days[i].minutes > 0) {
        streakStart = i;
      } else if (i < n - 1) {
        break;
      }
    }

    for (var i = 1; i < n; i++) {
      if (days[i].minutes <= 0 || days[i - 1].minutes <= 0) continue;
      final inStreak = i - 1 >= streakStart;
      final paint = Paint()
        ..color = inStreak ? Palette.focus : _dim
        ..strokeWidth = inStreak ? 2.5 : 1.5;
      final a = pts[i - 1];
      final b = i == n - 1 ? Offset.lerp(a, pts[i], landed.clamp(0, 1))! : pts[i];
      if (inStreak) {
        canvas.drawLine(a, b, paint);
      } else {
        _dashed(canvas, a, b, paint);
      }
    }

    for (var i = 0; i < n; i++) {
      final d = days[i];
      final p = pts[i];
      final isToday = i == n - 1;
      final r = 4 + math.min(d.minutes / 30, 5).toDouble();
      if (d.minutes > 0) {
        final color = isToday
            ? Palette.white
            : i >= streakStart
            ? Palette.focus
            : _dim;
        canvas.drawCircle(p, r * (isToday ? landed : 1), Paint()..color = color);
      } else {
        canvas.drawCircle(
          p,
          3.5,
          Paint()
            ..color = _dim
            ..style = PaintingStyle.stroke
            ..strokeWidth = 1.5,
        );
      }
      if (isToday) {
        final halo = 0.5 + 0.5 * math.sin(twinkle * 2 * math.pi);
        canvas.drawCircle(
          p,
          r + 6 + 3 * halo,
          Paint()
            ..color = Palette.focus.withValues(alpha: 0.35 + 0.4 * halo)
            ..style = PaintingStyle.stroke
            ..strokeWidth = 1.5,
        );
      }
      final label = TextPainter(
        text: TextSpan(
          text: isToday ? 'Today' : _weekdays[d.date.weekday - 1],
          style: mono(isToday ? FontWeight.w700 : FontWeight.w500, 10, 12).copyWith(color: isToday ? Palette.white : _labelColor),
        ),
        textDirection: TextDirection.ltr,
      )..layout();
      label.paint(canvas, Offset(p.dx - label.width / 2, size.height - 14));
    }
  }

  void _dashed(Canvas canvas, Offset a, Offset b, Paint paint) {
    final len = (b - a).distance;
    if (len == 0) return;
    final dir = (b - a) / len;
    for (var t = 0.0; t < len; t += 7) {
      canvas.drawLine(a + dir * t, a + dir * math.min(t + 3.5, len), paint);
    }
  }

  @override
  bool shouldRepaint(_SkyPainter old) => old.twinkle != twinkle || old.landed != landed || old.days != days;
}
