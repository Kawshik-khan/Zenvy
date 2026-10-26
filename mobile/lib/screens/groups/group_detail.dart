import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/models.dart';
import '../../data/sample.dart';
import '../../router.dart';
import '../../state/app_state.dart';
import '../../theme/tokens.dart';
import '../../util/dialogs.dart';
import '../../widgets/widgets.dart';
import '../missing.dart';

enum _Tab { files, people, sessions }

typedef _RowData = ({String key, Widget lead, String title, String meta, String side});

class GroupDetailScreen extends StatefulWidget {
  const GroupDetailScreen({super.key, required this.id});
  final String id;

  @override
  State<GroupDetailScreen> createState() => _GroupDetailScreenState();
}

class _GroupDetailScreenState extends State<GroupDetailScreen> {
  _Tab _tab = _Tab.files;

  Widget _square(Color fill, Widget child) => Container(
    width: 44,
    height: 44,
    alignment: Alignment.center,
    decoration: BoxDecoration(
      color: fill,
      borderRadius: BorderRadius.circular(10),
      border: Border.all(color: Palette.ink, width: 3),
    ),
    child: child,
  );

  @override
  Widget build(BuildContext context) {
    final g = groupById(widget.id);
    if (g == null) return const Missing(to: '/groups');
    final app = AppScope.of(context);
    final joined = app.flag(Flag.joinedGroups, g.id);

    final List<_RowData> rows = switch (_tab) {
      _Tab.files => [
        for (final r in g.resources)
          (
            key: r.id,
            lead: _square(kindFill[r.kind]!, ZText(r.kind.label, variant: TextVariant.mono, style: const TextStyle(fontSize: 10))),
            title: r.title,
            meta: r.meta,
            side: r.size ?? '',
          ),
      ],
      _Tab.people => [
        for (final m in g.memberIds)
          (
            key: m,
            lead: Avatar(initials: person(m).initials, color: person(m).color),
            title: m == 'me' ? '${person(m).name} (you)' : person(m).name,
            meta: '${shortMajor(person(m).major)} · Sem ${person(m).semester}',
            side: g.roles[m]?.toUpperCase() ?? '',
          ),
      ],
      _Tab.sessions => [
        for (final e in events.where((e) => e.groupId == g.id))
          (
            key: e.id,
            lead: _square(
              app.flag(Flag.rsvp, e.id) ? Palette.live : Palette.white,
              Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const ZText(
                    'OCT',
                    variant: TextVariant.mono,
                    style: TextStyle(fontSize: 9, height: 11 / 9),
                  ),
                  ZText(
                    '${e.day}',
                    variant: TextVariant.mono,
                    style: const TextStyle(fontSize: 14, height: 16 / 14),
                  ),
                ],
              ),
            ),
            title: e.title,
            meta: '${e.start} · ${e.where} · ${e.goingIds.length} going',
            side: app.flag(Flag.rsvp, e.id) ? 'GOING' : 'RSVP',
          ),
      ],
    };

    return Screen(
      safeTop: false,
      padding: const EdgeInsets.only(bottom: 28),
      gap: 0,
      children: [
        HeaderBand(
          color: Palette.chat,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: 14,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  ZIconButton(icon: LucideIcons.chevronLeft, label: 'Back', onTap: () => goBack(context, '/groups')),
                  ZIconButton(
                    icon: LucideIcons.slidersHorizontal,
                    label: 'Group settings',
                    onTap: () => notify(context, 'Group settings', 'Owners and admins manage members and visibility here.'),
                  ),
                ],
              ),
              Row(
                spacing: 14,
                children: [
                  Surface(
                    shadow: ShadowSize.sm,
                    width: 68,
                    height: 68,
                    alignment: Alignment.center,
                    child: ZText(g.initials, variant: TextVariant.title),
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        ZText(g.name, variant: TextVariant.title, header: true, style: const TextStyle(fontSize: 24)),
                        ZText('${g.course} · Public · ${g.memberIds.length} members', variant: TextVariant.small),
                      ],
                    ),
                  ),
                ],
              ),
              ZText(
                g.description,
                variant: TextVariant.small,
                style: const TextStyle(fontSize: 14, height: 20 / 14),
              ),
              if (joined)
                Row(
                  spacing: 10,
                  children: [
                    Expanded(
                      child: ZButton(
                        label: 'Open chat',
                        variant: ButtonVariant.secondary,
                        icon: LucideIcons.messageSquare,
                        onTap: () => context.push('/group-room/${g.id}'),
                      ),
                    ),
                    Expanded(
                      child: ZButton(
                        label: 'Start call',
                        variant: ButtonVariant.live,
                        icon: LucideIcons.video,
                        onTap: () => context.push(withQuery('/call/active', {'title': g.name})),
                      ),
                    ),
                  ],
                )
              else
                ZButton(label: 'Join group', variant: ButtonVariant.secondary, onTap: () => app.toggle(Flag.joinedGroups, g.id)),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: 14,
            children: [
              Segmented<_Tab>(
                label: 'Group sections',
                tone: Tone.chat,
                value: _tab,
                onChanged: (t) => setState(() => _tab = t),
                options: const [SegmentOption(_Tab.files, 'Resources'), SegmentOption(_Tab.people, 'Members'), SegmentOption(_Tab.sessions, 'Sessions')],
              ),
              Surface(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (rows.isEmpty)
                      Padding(
                        padding: const EdgeInsets.all(20),
                        child: ZText(
                          switch (_tab) {
                            _Tab.files => 'No files shared yet.',
                            _Tab.sessions => 'No sessions scheduled.',
                            _Tab.people => 'No members yet.',
                          },
                          variant: TextVariant.small,
                          muted: true,
                          align: TextAlign.center,
                        ),
                      ),
                    ...separated([
                      for (final r in rows)
                        Container(
                          key: ValueKey(r.key),
                          constraints: const BoxConstraints(minHeight: 68),
                          padding: const EdgeInsets.all(12),
                          child: Row(
                            spacing: 12,
                            children: [
                              r.lead,
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    ZText(r.title, variant: TextVariant.h3, maxLines: 1),
                                    ZText(r.meta, variant: TextVariant.small, muted: true, style: const TextStyle(fontSize: 12)),
                                  ],
                                ),
                              ),
                              if (r.side.isNotEmpty) ZText(r.side, variant: TextVariant.mono, style: const TextStyle(fontSize: 11)),
                            ],
                          ),
                        ),
                    ]),
                  ],
                ),
              ),
              if (_tab == _Tab.sessions && joined) const ZButton(label: 'Schedule a session', variant: ButtonVariant.live, href: '/events/new'),
            ],
          ),
        ),
      ],
    );
  }
}
