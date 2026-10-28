import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/models.dart';
import '../../router.dart';
import '../../state/app_state.dart';
import '../../theme/tokens.dart';
import '../../theme/type.dart';
import '../../util/dialogs.dart';
import '../../widgets/widgets.dart';

DateTime _day(DateTime d) => DateTime(d.year, d.month, d.day);

class EventsScreen extends StatefulWidget {
  const EventsScreen({super.key});

  @override
  State<EventsScreen> createState() => _EventsScreenState();
}

class _EventsScreenState extends State<EventsScreen> {
  /// Null shows everything coming up.
  DateTime? _selected;

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final today = _day(DateTime.now());
    final week = [for (var i = 0; i < 7; i++) today.add(Duration(days: i))];
    const header = TopBar(
      title: 'Sessions',
      fallback: '/home',
      right: ZButton(label: 'Schedule', variant: ButtonVariant.live, size: ButtonSize.sm, icon: LucideIcons.plus, href: '/events/new'),
    );

    return Loader<List<EventItem>>(
      load: () => app.api.events(),
      frame: (context, body) => Screen(header: header, body: body),
      builder: (context, events, reload) {
        final list = _selected == null ? events : events.where((e) => _day(e.start) == _selected).toList();
        return Screen(
          header: header,
          onRefresh: reload,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                ZText('${monthShort(today)} ${today.year}', variant: TextVariant.h3, style: const TextStyle(fontSize: 16)),
                if (_selected != null)
                  ZButton(label: 'Show all', variant: ButtonVariant.ghost, size: ButtonSize.sm, onTap: () => setState(() => _selected = null))
                else
                  const ZText('Next 7 days', variant: TextVariant.label),
              ],
            ),
            Row(
              spacing: 6,
              children: [
                for (final d in week)
                  Expanded(
                    child: _DayButton(
                      day: d,
                      selected: _selected == d,
                      hasEvents: events.any((e) => _day(e.start) == d),
                      onTap: () => setState(() => _selected = _selected == d ? null : d),
                    ),
                  ),
              ],
            ),
            if (list.isEmpty)
              EmptyCard(
                title: _selected == null ? 'Nothing scheduled' : 'Nothing on ${weekdayShort(_selected!)} ${_selected!.day}',
                detail: 'Sessions from your groups and ones you RSVP to show up here.',
                action: const ZButton(label: 'Schedule a session', variant: ButtonVariant.live, size: ButtonSize.sm, href: '/events/new'),
              ),
            for (final e in list) _EventCard(event: e),
          ],
        );
      },
    );
  }
}

class _DayButton extends StatelessWidget {
  const _DayButton({required this.day, required this.selected, required this.hasEvents, required this.onTap});
  final DateTime day;
  final bool selected;
  final bool hasEvents;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      selected: selected,
      button: true,
      label: '${weekdayShort(day)} ${day.day}${hasEvents ? ', has sessions' : ''}',
      excludeSemantics: true,
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          height: 64,
          decoration: BoxDecoration(
            color: selected ? Palette.ink : Palette.white,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: Palette.ink, width: selected ? 3 : 2),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            spacing: 2,
            children: [
              Text(weekdayShort(day), style: grotesk(FontWeight.w600, 11, 14).copyWith(color: selected ? Palette.paper : Palette.ink)),
              Text('${day.day}', style: mono(FontWeight.w700, 18, 22).copyWith(color: selected ? Palette.paper : Palette.ink)),
              Container(
                width: 6,
                height: 6,
                decoration: BoxDecoration(shape: BoxShape.circle, color: hasEvents ? (selected ? Palette.live : Palette.ink) : null),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _EventCard extends StatefulWidget {
  const _EventCard({required this.event});
  final EventItem event;

  @override
  State<_EventCard> createState() => _EventCardState();
}

class _EventCardState extends State<_EventCard> {
  bool _busy = false;

  Future<void> _rsvp(bool going) async {
    final app = AppScope.read(context);
    setState(() => _busy = true);
    final ok = await attempt(context, () => app.api.rsvp(widget.event.id, going ? 'GOING' : 'DECLINED'));
    if (!mounted) return;
    setState(() => _busy = false);
    if (ok) app.touch();
  }

  @override
  Widget build(BuildContext context) {
    final e = widget.event;
    final now = DateTime.now();
    final live = now.isAfter(e.start.subtract(const Duration(minutes: 10))) && now.isBefore(e.end);
    final where = e.location ?? (e.inPerson ? 'In person' : 'Online');
    return Surface(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: e.group != null ? colorFor(e.group!.id) : Palette.live,
              border: const Border(bottom: BorderSide(color: Palette.ink, width: 3)),
            ),
            child: Row(
              spacing: 8,
              children: [
                Expanded(
                  child: ZText(
                    '${weekdayShort(e.start)} ${e.start.day} · ${clockTime(e.start)} – ${clockTime(e.end)}',
                    variant: TextVariant.mono,
                    maxLines: 1,
                    style: const TextStyle(fontSize: 12),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  decoration: BoxDecoration(
                    color: Palette.white,
                    borderRadius: BorderRadius.circular(99),
                    border: Border.all(color: Palette.ink, width: 2),
                  ),
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 140),
                    child: ZText(where, variant: TextVariant.h3, maxLines: 1, style: const TextStyle(fontSize: 12)),
                  ),
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
                    ZText([e.group?.name ?? 'Personal', if (e.creator != null) 'by ${e.creator!.name}'].join(' · '), variant: TextVariant.small, muted: true),
                    if (e.description != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: ZText(e.description!, variant: TextVariant.small),
                      ),
                  ],
                ),
                Row(
                  spacing: 10,
                  children: [
                    Expanded(
                      child: Semantics(
                        label: '${e.goingCount} going',
                        excludeSemantics: true,
                        child: Row(
                          children: [
                            for (final (i, u) in e.going.take(3).indexed) Transform.translate(offset: Offset(-8.0 * i, 0), child: Avatar.of(u, size: 32)),
                            Transform.translate(
                              offset: Offset(-8.0 * (e.going.take(3).length - 1).clamp(0, 2), 0),
                              child: Padding(
                                padding: const EdgeInsets.only(left: 8),
                                child: ZText('${e.goingCount} going', variant: TextVariant.small, muted: true, style: const TextStyle(fontSize: 12)),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    if (live && !e.inPerson && e.group != null && e.isGoing)
                      ZButton(
                        label: 'Join',
                        variant: ButtonVariant.live,
                        size: ButtonSize.sm,
                        onTap: () => context.push(withQuery('/call/active', {'groupId': e.group!.id, 'title': e.group!.name})),
                      )
                    else
                      ZButton(
                        label: e.isGoing ? 'Going' : 'RSVP',
                        variant: e.isGoing ? ButtonVariant.live : ButtonVariant.secondary,
                        size: ButtonSize.sm,
                        disabled: _busy,
                        icon: e.isGoing ? LucideIcons.check : null,
                        onTap: () => _rsvp(!e.isGoing),
                        semanticLabel: e.isGoing ? 'Going. Tap to cancel your RSVP for ${e.title}' : 'RSVP to ${e.title}',
                      ),
                    if (e.canCancel)
                      ZIconButton(
                        icon: LucideIcons.trash2,
                        label: 'Cancel ${e.title}',
                        shadow: false,
                        onTap: () => confirm(context, 'Cancel this session?', 'Everyone who RSVP\'d loses it from their calendar.', 'Cancel session', () async {
                          final app = AppScope.read(context);
                          if (await attempt(context, () => app.api.cancelEvent(e.id), success: 'Session cancelled')) app.touch();
                        }),
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
