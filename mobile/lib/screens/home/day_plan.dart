import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/models.dart';
import '../../state/app_state.dart';
import '../../theme/tokens.dart';
import '../../theme/type.dart';
import '../../widgets/widgets.dart';

enum SlotKind { focus, session, free }

class DaySlot {
  const DaySlot(this.kind, this.start, this.end, this.title, {this.event});
  final SlotKind kind;
  final DateTime start;
  final DateTime end;
  final String title;
  final EventItem? event;
}

/// Today laid out on one rail: focus blocks done, sessions booked, and the free time left.
class DayPlan {
  DayPlan._(this.dayStart, this.dayEnd, this.now, this.slots);

  final DateTime dayStart;
  final DateTime dayEnd;
  final DateTime now;
  final List<DaySlot> slots;

  /// Free gaps shorter than this are not worth planning.
  static const _minFree = Duration(minutes: 30);

  factory DayPlan.of(HomeData home, DateTime now) {
    final today = DateTime(now.year, now.month, now.day);
    final booked = <DaySlot>[
      for (final f in home.todayFocus) DaySlot(SlotKind.focus, f.start, f.end, 'Focus · ${f.minutes} min'),
      for (final e in home.todayEvents)
        if (e.start.isBefore(today.add(const Duration(days: 1)))) DaySlot(SlotKind.session, e.start, e.end, e.title, event: e),
    ]..sort((a, b) => a.start.compareTo(b.start));

    var start = today.add(const Duration(hours: 8));
    var end = today.add(const Duration(hours: 23));
    for (final s in booked) {
      if (s.start.isBefore(start)) start = DateTime(s.start.year, s.start.month, s.start.day, s.start.hour);
      if (s.end.isAfter(end)) end = s.end;
    }

    // Free windows from now (rounded up to the half hour) to the end of the rail.
    final free = <DaySlot>[];
    var cursor = _roundUp(now.isBefore(start) ? start : now);
    for (final s in [...booked.where((s) => s.end.isAfter(cursor)), DaySlot(SlotKind.free, end, end, '')]) {
      if (s.start.difference(cursor) >= _minFree) free.add(DaySlot(SlotKind.free, cursor, s.start, 'Free'));
      if (s.end.isAfter(cursor)) cursor = s.end;
    }
    return DayPlan._(start, end, now, [...booked, ...free]..sort((a, b) => a.start.compareTo(b.start)));
  }

  static DateTime _roundUp(DateTime t) {
    final extra = (30 - t.minute % 30) % 30;
    return DateTime(t.year, t.month, t.day, t.hour, t.minute + extra);
  }

  double fraction(DateTime t) => (t.difference(dayStart).inMinutes / dayEnd.difference(dayStart).inMinutes).clamp(0.0, 1.0);

  DaySlot? get nextFree => slots.where((s) => s.kind == SlotKind.free).firstOrNull;

  Duration get freeLeft => slots.where((s) => s.kind == SlotKind.free).fold(Duration.zero, (sum, s) => sum + s.end.difference(s.start));
}

String rangeLabel(DateTime a, DateTime b) => '${clockTime(a)} – ${clockTime(b)}';

/// The compact Home version: one horizontal bar for the day. Taps through to the full timeline.
class DayBarCard extends StatelessWidget {
  const DayBarCard({super.key, required this.home, required this.now});
  final HomeData home;
  final DateTime now;

  @override
  Widget build(BuildContext context) {
    final plan = DayPlan.of(home, now);
    final free = plan.nextFree;
    return Surface(
      href: '/today',
      semanticLabel: 'Open your day timeline',
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: 10,
        children: [
          const Row(
            children: [
              Expanded(child: ZText('Your day', variant: TextVariant.h3)),
              ZText('Open timeline', variant: TextVariant.small),
              SizedBox(width: 4),
              Icon(LucideIcons.arrowRight, size: 14, color: Palette.ink),
            ],
          ),
          SizedBox(
            height: 26,
            child: LayoutBuilder(
              builder: (context, box) {
                final w = box.maxWidth;
                return Container(
                  clipBehavior: Clip.antiAlias,
                  decoration: BoxDecoration(
                    color: Palette.quietPaper,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Palette.ink, width: 2),
                  ),
                  child: Stack(
                    children: [
                      for (final s in plan.slots.where((s) => s.kind != SlotKind.free))
                        Positioned(
                          left: plan.fraction(s.start) * w,
                          width: math.max(6, (plan.fraction(s.end) - plan.fraction(s.start)) * w),
                          top: 0,
                          bottom: 0,
                          child: DecoratedBox(
                            decoration: BoxDecoration(
                              color: s.kind == SlotKind.focus ? Palette.focus : Palette.live,
                              border: const Border.symmetric(vertical: BorderSide(color: Palette.ink, width: 2)),
                            ),
                          ),
                        ),
                      if (now.isAfter(plan.dayStart) && now.isBefore(plan.dayEnd))
                        Positioned(
                          left: plan.fraction(now) * w - 1.5,
                          width: 3,
                          top: 0,
                          bottom: 0,
                          child: const ColoredBox(color: Palette.alert),
                        ),
                    ],
                  ),
                );
              },
            ),
          ),
          Row(
            children: [
              Text(clockTime(plan.dayStart), style: mono(FontWeight.w500, 10, 12).copyWith(color: Palette.muted)),
              const Spacer(),
              Text(clockTime(plan.dayEnd), style: mono(FontWeight.w500, 10, 12).copyWith(color: Palette.muted)),
            ],
          ),
          ZText(
            free != null ? 'Free ${rangeLabel(free.start, free.end)} · tap to plan a focus block' : 'Your day is full. Nice planning.',
            variant: TextVariant.small,
          ),
        ],
      ),
    );
  }
}

/// Full-screen vertical timeline for today.
class TodayScreen extends StatelessWidget {
  const TodayScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    return Loader<HomeData>(
      load: app.api.home,
      frame: (context, body) => Screen(
        header: const TopBar(title: 'Your day'),
        body: body,
      ),
      builder: (context, home, reload) {
        final now = DateTime.now();
        final plan = DayPlan.of(home, now);
        final hours = plan.dayEnd.difference(plan.dayStart).inMinutes / 60;
        const hourH = 44.0;
        return Screen(
          header: const TopBar(title: 'Your day'),
          onRefresh: reload,
          children: [
            Row(
              spacing: 8,
              children: [
                Expanded(
                  child: _Stat(value: formatMinutes(home.todayMinutes), label: 'focused', fill: Palette.focus),
                ),
                Expanded(
                  child: _Stat(
                    value: '${plan.slots.where((s) => s.kind == SlotKind.session && s.end.isAfter(now)).length}',
                    label: 'sessions left',
                    fill: Palette.live,
                  ),
                ),
                Expanded(
                  child: _Stat(value: formatMinutes(plan.freeLeft.inMinutes), label: 'free left', fill: Palette.white),
                ),
              ],
            ),
            SizedBox(
              height: hours * hourH + 20,
              child: Stack(
                children: [
                  const Positioned(left: 58, top: 0, bottom: 0, width: 3, child: ColoredBox(color: Palette.ink)),
                  for (var h = 0; h <= hours.floor(); h += 2)
                    Positioned(
                      left: 0,
                      top: h * hourH - 6,
                      child: Text(
                        clockTime(plan.dayStart.add(Duration(hours: h))),
                        style: mono(FontWeight.w500, 10, 12).copyWith(color: Palette.muted),
                      ),
                    ),
                  for (final s in plan.slots)
                    Positioned(
                      left: 72,
                      right: 0,
                      top: plan.fraction(s.start) * hours * hourH,
                      height: math.max(44, (plan.fraction(s.end) - plan.fraction(s.start)) * hours * hourH - 4),
                      child: _SlotTile(slot: s),
                    ),
                  if (now.isAfter(plan.dayStart) && now.isBefore(plan.dayEnd))
                    Positioned(
                      left: 0,
                      right: 0,
                      top: plan.fraction(now) * hours * hourH,
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                            decoration: BoxDecoration(
                              color: Palette.alert,
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: Palette.ink, width: 2),
                            ),
                            child: Text(clockTime(now).replaceAll(' ', ''), style: mono(FontWeight.w700, 10, 12).copyWith(color: Palette.ink)),
                          ),
                          const Expanded(
                            child: SizedBox(height: 3, child: ColoredBox(color: Palette.alert)),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
          ],
        );
      },
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({required this.value, required this.label, required this.fill});
  final String value;
  final String label;
  final Color fill;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
    decoration: BoxDecoration(
      color: fill,
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: Palette.ink, width: 2),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(value, maxLines: 1, style: mono(FontWeight.w700, 18, 22).copyWith(color: Palette.ink)),
        ZText(label, variant: TextVariant.small, maxLines: 1),
      ],
    ),
  );
}

class _SlotTile extends StatelessWidget {
  const _SlotTile({required this.slot});
  final DaySlot slot;

  @override
  Widget build(BuildContext context) {
    final s = slot;
    if (s.kind == SlotKind.free) {
      return Surface(
        dashed: true,
        shadow: ShadowSize.none,
        tone: Tone.paper,
        href: '/focus',
        semanticLabel: 'Free ${rangeLabel(s.start, s.end)}, plan a focus block',
        padding: const EdgeInsets.symmetric(horizontal: 12),
        alignment: Alignment.centerLeft,
        child: Row(
          spacing: 10,
          children: [
            const Icon(LucideIcons.plus, size: 18, color: Palette.ink),
            Expanded(child: ZText('Free ${rangeLabel(s.start, s.end)} · start a focus block', variant: TextVariant.strong, maxLines: 2)),
          ],
        ),
      );
    }
    final session = s.kind == SlotKind.session;
    return Surface(
      tone: session ? Tone.live : Tone.focus,
      shadow: session ? ShadowSize.sm : ShadowSize.none,
      href: session ? '/events' : null,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      alignment: Alignment.centerLeft,
      child: Row(
        spacing: 8,
        children: [
          Icon(session ? LucideIcons.users : LucideIcons.check, size: 16, color: Palette.ink),
          Expanded(child: ZText(s.title, variant: TextVariant.strong, maxLines: 1)),
          Text(clockTime(s.start), style: mono(FontWeight.w500, 10, 12).copyWith(color: Palette.ink)),
        ],
      ),
    );
  }
}
