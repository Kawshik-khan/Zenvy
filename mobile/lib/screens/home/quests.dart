import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/models.dart';
import '../../state/app_state.dart';
import '../../theme/tokens.dart';
import '../../theme/type.dart';
import '../../widgets/widgets.dart';
import 'celebrate.dart';
import 'motion.dart';

/// XP per focused hour, as lib/study-metrics.ts awards it.
const _xpPerHour = 10;
const _xpPerSession = 50;

class _Quest {
  const _Quest(this.title, this.progress, this.label, this.reward, {this.href});
  final String title;
  final double progress;
  final String label;
  final String reward;
  final String? href;
  bool get done => progress >= 1;
}

class _Badge {
  const _Badge(this.name, this.mark, this.fill, this.progress);
  final String name;
  final String mark;
  final Color fill;
  final double progress;
  bool get earned => progress >= 1;
}

/// Level, today's quests and badges. Everything here is earned by studying; XP is awarded by the
/// server as it happens, so there is nothing to claim.
class QuestsCard extends StatelessWidget {
  /// What each quest looked like on the last build, so finishing one is celebrated once.
  static final _lastDone = <String, bool>{};

  const QuestsCard({super.key, required this.home, required this.goalMinutes, required this.now});
  final HomeData home;
  final int goalMinutes;
  final DateTime now;

  List<_Quest> get _quests {
    final going = home.todayEvents.where((e) => e.isGoing).toList();
    final attended = going.any((e) => e.end.isBefore(now));
    return [
      _Quest(
        'Focus ${formatMinutes(goalMinutes)} today',
        home.todayMinutes / goalMinutes,
        '${math.min(home.todayMinutes, goalMinutes)}/$goalMinutes',
        '+${goalMinutes * _xpPerHour ~/ 60} XP',
        href: '/focus',
      ),
      _Quest(
        'Join a group session',
        attended
            ? 1
            : going.isNotEmpty
            ? 0.5
            : 0,
        attended
            ? 'Attended'
            : going.isNotEmpty
            ? "RSVP'd"
            : '0/1',
        '+$_xpPerSession XP',
        href: '/events',
      ),
      _Quest('Light tonight\'s star', home.todayMinutes > 0 ? 1 : 0, home.todayMinutes > 0 ? 'Lit' : '0/1', 'Streak +1', href: '/focus'),
    ];
  }

  bool _justDone(_Quest q) {
    final key = '${now.year}-${now.month}-${now.day}|${q.title}';
    final was = _lastDone[key];
    _lastDone[key] = q.done;
    return was == false && q.done;
  }

  List<_Badge> get _badges {
    final p = home.progress;
    return [
      _Badge('First star', '1st', Palette.focus, p.all.sessions.toDouble()),
      _Badge('3-night streak', '3D', Palette.match, home.streakDays / 3),
      _Badge('Week warrior', '7D', Palette.chat, home.streakDays / 7),
      _Badge('10 hours', '10H', Palette.live, p.all.focusMinutes / 600),
    ];
  }

  @override
  Widget build(BuildContext context) {
    final p = home.progress;
    final quests = _quests;
    return Container(
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: Palette.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Palette.ink, width: 3),
        boxShadow: const [BoxShadow(color: Palette.ink, offset: Offset(5, 5))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Surface(
            tone: Tone.career,
            shadow: ShadowSize.none,
            radius: 0,
            borderWidth: 0,
            href: '/stats',
            semanticLabel: 'Level ${p.level}, ${p.xpToNextLevel} XP to level ${p.level + 1}. Open study stats',
            padding: const EdgeInsets.fromLTRB(18, 16, 18, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              spacing: 12,
              children: [
                Row(
                  spacing: 14,
                  children: [
                    _Hex(
                      fill: Palette.focus,
                      size: 60,
                      child: _LevelMark(level: p.level),
                    ),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          ZText(p.levelTitle.isEmpty ? 'Level ${p.level}' : p.levelTitle, variant: TextVariant.h2, maxLines: 1),
                          ZText('${p.xpToNextLevel} XP to Level ${p.level + 1} · ${p.totalXp} total', variant: TextVariant.small, maxLines: 1),
                        ],
                      ),
                    ),
                  ],
                ),
                TweenAnimationBuilder<double>(
                  tween: Tween(begin: 0, end: p.levelProgress),
                  duration: motionOn(context) ? const Duration(milliseconds: 1000) : Duration.zero,
                  curve: Curves.easeOutBack,
                  builder: (_, v, _) => ProgressBar(value: v, label: 'Progress to level ${p.level + 1}', height: 14, track: Palette.white),
                ),
              ],
            ),
          ),
          Container(height: 3, color: Palette.ink),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              spacing: 10,
              children: [
                Row(
                  children: [
                    const Expanded(child: ZText("Today's quests", variant: TextVariant.h3)),
                    Text('${quests.where((q) => q.done).length}/${quests.length} done', style: mono(FontWeight.w500, 11, 14).copyWith(color: Palette.muted)),
                  ],
                ),
                for (final q in quests) _QuestRow(quest: q, justDone: _justDone(q)),
                const SizedBox(height: 2),
                const Row(
                  children: [
                    Expanded(child: ZText('Badges', variant: TextVariant.h3)),
                    ZButton(label: 'Stats', variant: ButtonVariant.ghost, size: ButtonSize.sm, href: '/stats'),
                  ],
                ),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [for (final b in _badges) Expanded(child: _BadgeTile(badge: b))],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _LevelMark extends StatelessWidget {
  const _LevelMark({required this.level});
  final int level;

  @override
  Widget build(BuildContext context) => Column(
    mainAxisSize: MainAxisSize.min,
    children: [
      Text('LVL', style: mono(FontWeight.w700, 9, 10).copyWith(color: Palette.ink)),
      Text('$level', style: mono(FontWeight.w700, 22, 24).copyWith(color: Palette.ink)),
    ],
  );
}

class _QuestRow extends StatelessWidget {
  const _QuestRow({required this.quest, required this.justDone});
  final _Quest quest;
  final bool justDone;

  @override
  Widget build(BuildContext context) {
    final q = quest;
    return Surface(
      tone: q.done ? Tone.paper : Tone.card,
      shadow: ShadowSize.none,
      radius: 12,
      borderWidth: 2,
      href: q.done ? null : q.href,
      semanticLabel: '${q.title}, ${q.label}, reward ${q.reward}${q.done ? ', done' : ''}',
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      child: Row(
        spacing: 10,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              spacing: 6,
              children: [
                ZText(q.title, variant: TextVariant.strong, maxLines: 1),
                Row(
                  spacing: 8,
                  children: [
                    Expanded(
                      child: TweenAnimationBuilder<double>(
                        tween: Tween(begin: 0, end: q.progress.clamp(0, 1)),
                        duration: motionOn(context) ? const Duration(milliseconds: 800) : Duration.zero,
                        curve: Curves.easeOutCubic,
                        builder: (_, v, _) => ProgressBar(value: v, label: q.title, tone: Tone.focus, height: 10),
                      ),
                    ),
                    Text(q.label, style: mono(FontWeight.w700, 10, 12).copyWith(color: Palette.ink)),
                  ],
                ),
              ],
            ),
          ),
          if (q.done)
            Burst(
              play: justDone,
              label: q.reward,
              child: TweenAnimationBuilder<double>(
                tween: Tween(begin: 0, end: 1),
                duration: motionOn(context) ? const Duration(milliseconds: 500) : Duration.zero,
                curve: Curves.elasticOut,
                builder: (_, v, child) => Transform.scale(scale: v, child: child),
                child: Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: Palette.live,
                    shape: BoxShape.circle,
                    border: Border.all(color: Palette.ink, width: 2),
                  ),
                  child: const Icon(LucideIcons.check, size: 18, color: Palette.ink),
                ),
              ),
            )
          else
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Palette.white,
                borderRadius: BorderRadius.circular(999),
                border: Border.all(color: Palette.ink, width: 2),
              ),
              child: Text(q.reward, style: mono(FontWeight.w700, 10, 12).copyWith(color: Palette.ink)),
            ),
        ],
      ),
    );
  }
}

class _BadgeTile extends StatelessWidget {
  const _BadgeTile({required this.badge});
  final _Badge badge;

  @override
  Widget build(BuildContext context) {
    final b = badge;
    return Semantics(
      label: '${b.name}, ${b.earned ? 'earned' : '${(b.progress.clamp(0, 1) * 100).round()}% there'}',
      excludeSemantics: true,
      child: Opacity(
        opacity: b.earned ? 1 : 0.55,
        child: Column(
          spacing: 4,
          children: [
            _Hex(
              fill: b.earned ? b.fill : Palette.white,
              size: 46,
              child: Text(b.mark, style: mono(FontWeight.w700, 11, 12).copyWith(color: Palette.ink)),
            ),
            Text(
              b.name,
              textAlign: TextAlign.center,
              maxLines: 2,
              style: grotesk(FontWeight.w700, 11, 13).copyWith(color: Palette.ink),
            ),
            Text(b.earned ? 'Earned' : '${(b.progress.clamp(0, 1) * 100).round()}%', style: mono(FontWeight.w500, 9, 11).copyWith(color: Palette.muted)),
          ],
        ),
      ),
    );
  }
}

class _Hex extends StatelessWidget {
  const _Hex({required this.fill, required this.size, required this.child});
  final Color fill;
  final double size;
  final Widget child;

  @override
  Widget build(BuildContext context) => SizedBox(
    width: size,
    height: size * 1.1,
    child: CustomPaint(
      painter: _HexPainter(fill),
      child: Center(child: child),
    ),
  );
}

class _HexPainter extends CustomPainter {
  const _HexPainter(this.fill);
  final Color fill;

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    final path = Path()
      ..moveTo(w / 2, 2)
      ..lineTo(w - 2, h * 0.26)
      ..lineTo(w - 2, h * 0.74)
      ..lineTo(w / 2, h - 2)
      ..lineTo(2, h * 0.74)
      ..lineTo(2, h * 0.26)
      ..close();
    canvas.drawPath(path, Paint()..color = fill);
    canvas.drawPath(
      path,
      Paint()
        ..color = Palette.ink
        ..style = PaintingStyle.stroke
        ..strokeWidth = 3
        ..strokeJoin = StrokeJoin.round,
    );
  }

  @override
  bool shouldRepaint(_HexPainter old) => old.fill != fill;
}
