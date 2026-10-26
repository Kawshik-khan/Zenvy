import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/sample.dart';
import '../../state/app_state.dart';
import '../../theme/tokens.dart';
import '../../theme/type.dart';
import '../../widgets/widgets.dart';

const _week = [(26, 'Mon'), (27, 'Tue'), (28, 'Wed'), (29, 'Thu'), (30, 'Fri'), (31, 'Sat'), (1, 'Sun')];

class EventsScreen extends StatefulWidget {
  const EventsScreen({super.key});

  @override
  State<EventsScreen> createState() => _EventsScreenState();
}

class _EventsScreenState extends State<EventsScreen> {
  int _day = 26;

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final list = events.where((e) => e.day == _day).toList();

    return Screen(
      header: const TopBar(
        title: 'Sessions',
        fallback: '/home',
        right: ZButton(label: 'Schedule', variant: ButtonVariant.live, size: ButtonSize.sm, icon: LucideIcons.plus, href: '/events/new'),
      ),
      children: [
        const Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            ZText('October 2026', variant: TextVariant.h3, style: TextStyle(fontSize: 16)),
            ZText('Week 44', variant: TextVariant.label),
          ],
        ),
        Row(
          spacing: 6,
          children: [
            for (final (day, label) in _week)
              Expanded(
                child: Semantics(
                  selected: day == _day,
                  button: true,
                  label: '$label $day${events.any((e) => e.day == day) ? ', has sessions' : ''}',
                  excludeSemantics: true,
                  child: GestureDetector(
                    onTap: () => setState(() => _day = day),
                    child: Container(
                      height: 64,
                      decoration: BoxDecoration(
                        color: day == _day ? Palette.ink : Palette.white,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: Palette.ink, width: day == _day ? 3 : 2),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        spacing: 2,
                        children: [
                          Text(label, style: grotesk(FontWeight.w600, 11, 14).copyWith(color: day == _day ? Palette.paper : Palette.ink)),
                          Text('$day', style: mono(FontWeight.w700, 18, 22).copyWith(color: day == _day ? Palette.paper : Palette.ink)),
                          Container(
                            width: 6,
                            height: 6,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: events.any((e) => e.day == day) ? (day == _day ? Palette.live : Palette.ink) : null,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
        if (list.isEmpty)
          Surface(
            dashed: true,
            shadow: ShadowSize.none,
            padding: const EdgeInsets.all(24),
            child: Column(
              spacing: 6,
              children: [
                const ZText('Nothing scheduled', variant: TextVariant.h3, style: TextStyle(fontSize: 17)),
                ZText('Sessions you create or RSVP to will show up here.', variant: TextVariant.small, muted: true, align: TextAlign.center),
                const SizedBox(height: 8),
                const ZButton(label: 'Schedule a session', variant: ButtonVariant.live, href: '/events/new'),
              ],
            ),
          ),
        for (final e in list) _EventCard(eventId: e.id, app: app),
      ],
    );
  }
}

class _EventCard extends StatelessWidget {
  const _EventCard({required this.eventId, required this.app});
  final String eventId;
  final AppState app;

  @override
  Widget build(BuildContext context) {
    final e = events.firstWhere((x) => x.id == eventId);
    final g = groupById(e.groupId);
    final going = app.flag(Flag.rsvp, e.id);
    final ids = going ? {...e.goingIds, 'me'}.toList() : e.goingIds.where((x) => x != 'me').toList();
    return Surface(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: g?.color ?? Palette.live,
              border: const Border(bottom: BorderSide(color: Palette.ink, width: 3)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                ZText('${e.start} – ${e.end}', variant: TextVariant.mono, style: const TextStyle(fontSize: 12)),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  decoration: BoxDecoration(
                    color: Palette.white,
                    borderRadius: BorderRadius.circular(99),
                    border: Border.all(color: Palette.ink, width: 2),
                  ),
                  child: ZText(e.where, variant: TextVariant.h3, style: const TextStyle(fontSize: 12)),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              spacing: 10,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ZText(e.title, variant: TextVariant.h3, style: const TextStyle(fontSize: 16)),
                    ZText(g?.name ?? '', variant: TextVariant.small, muted: true),
                  ],
                ),
                Row(
                  spacing: 10,
                  children: [
                    Expanded(
                      child: Semantics(
                        label: '${ids.length} going',
                        excludeSemantics: true,
                        child: Row(
                          children: [
                            for (final (i, pid) in ids.take(3).indexed)
                              Transform.translate(
                                offset: Offset(-8.0 * i, 0),
                                child: Avatar(initials: person(pid).initials, color: person(pid).color, size: 32),
                              ),
                            Transform.translate(
                              offset: Offset(-8.0 * (ids.length.clamp(1, 3) - 1), 0),
                              child: Padding(
                                padding: const EdgeInsets.only(left: 8),
                                child: ZText('${ids.length} going', variant: TextVariant.small, muted: true, style: const TextStyle(fontSize: 12)),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    ZButton(
                      label: going ? 'Going' : 'RSVP',
                      variant: going ? ButtonVariant.live : ButtonVariant.secondary,
                      size: ButtonSize.sm,
                      onTap: () => app.toggle(Flag.rsvp, e.id),
                      semanticLabel: going ? 'Cancel RSVP for ${e.title}' : 'RSVP to ${e.title}',
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
