import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/models.dart';
import '../../router.dart';
import '../../state/app_state.dart';
import '../../theme/tokens.dart';
import '../../util/dialogs.dart';
import '../../widgets/widgets.dart';
import '../tabs/home.dart' show DateBlock;

enum _Tab { files, people, sessions }

const _kindFill = {'LINK': Palette.focus, 'FILE': Palette.alert, 'NOTE': Palette.live};

class GroupDetailScreen extends StatefulWidget {
  const GroupDetailScreen({super.key, required this.id});
  final String id;

  @override
  State<GroupDetailScreen> createState() => _GroupDetailScreenState();
}

class _GroupDetailScreenState extends State<GroupDetailScreen> {
  _Tab _tab = _Tab.files;
  bool _busy = false;

  Future<void> _membership(GroupDetail g, bool join) async {
    final app = AppScope.read(context);
    setState(() => _busy = true);
    final ok = await attempt(context, () => app.api.setGroupMembership(g.id, join: join), success: join ? 'Joined ${g.name}' : 'Left ${g.name}');
    if (!mounted) return;
    setState(() => _busy = false);
    if (ok) app.touch();
  }

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    return Loader<GroupDetail>(
      load: () => app.api.group(widget.id),
      frame: (context, body) => Screen(
        header: const TopBar(fallback: '/groups'),
        body: body,
      ),
      builder: (context, g, reload) {
        final rows = switch (_tab) {
          _Tab.files => [
            for (final r in g.resources)
              _RowData(
                lead: Container(
                  width: 44,
                  height: 44,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: _kindFill[r.type] ?? Palette.white,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: Palette.ink, width: 3),
                  ),
                  child: Icon(
                    r.type == 'NOTE'
                        ? LucideIcons.fileText
                        : r.type == 'FILE'
                        ? LucideIcons.paperclip
                        : LucideIcons.link,
                    size: 20,
                    color: Palette.ink,
                  ),
                ),
                title: r.title,
                meta: [
                  if (r.pinned) 'Pinned',
                  r.type == 'NOTE' && r.description != null ? r.description! : '${r.creatorName} · ${timeAgo(r.createdAt)}',
                ].join(' · '),
                side: r.url != null ? 'OPEN' : '',
                onTap: r.url != null ? () => openLink(context, r.url!) : (r.description != null ? () => notify(context, r.title, r.description) : null),
              ),
          ],
          _Tab.people => [
            for (final m in g.members)
              _RowData(
                lead: Avatar.of(m),
                title: m.id == app.me?.id ? '${m.name} (you)' : m.name,
                meta: m.academicLine.isEmpty ? 'Member' : m.academicLine,
                side: m.role == 'ADMIN' ? 'ADMIN' : '',
                onTap: m.id == app.me?.id ? null : () => context.push('/partner/${m.id}'),
              ),
          ],
          _Tab.sessions => [
            for (final e in g.events)
              _RowData(
                lead: DateBlock(date: e.start, size: 44, fill: e.isGoing ? Palette.live : Palette.white),
                title: e.title,
                meta: '${clockTime(e.start)} · ${e.location ?? (e.inPerson ? 'In person' : 'Online')} · ${e.goingCount} going',
                side: e.isGoing ? 'GOING' : 'RSVP',
                onTap: () => context.push('/events'),
              ),
          ],
        };

        return Screen(
          safeTop: false,
          padding: const EdgeInsets.only(bottom: 28),
          gap: 0,
          onRefresh: reload,
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
                      if (g.isMember)
                        ZIconButton(
                          icon: LucideIcons.logOut,
                          label: 'Leave group',
                          onTap: () => confirm(
                            context,
                            'Leave ${g.name}?',
                            "You'll stop seeing its chat and sessions. You can join again later.",
                            'Leave',
                            () => _membership(g, false),
                          ),
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
                            ZText(
                              [g.subject, '${g.members.length} members', if (g.myRole == 'ADMIN') 'You\'re the admin'].whereType<String>().join(' · '),
                              variant: TextVariant.small,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  if (g.description != null)
                    ZText(
                      g.description!,
                      variant: TextVariant.small,
                      style: const TextStyle(fontSize: 14, height: 20 / 14),
                    ),
                  if (g.isMember)
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
                            label: g.liveCall != null ? 'Join call' : 'Start call',
                            variant: ButtonVariant.live,
                            icon: LucideIcons.video,
                            onTap: () => context.push(withQuery('/call/active', {'groupId': g.id, 'title': g.name, 'video': '1'})),
                          ),
                        ),
                      ],
                    )
                  else
                    ZButton(label: _busy ? 'Joining…' : 'Join group', variant: ButtonVariant.secondary, disabled: _busy, onTap: () => _membership(g, true)),
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
                  if (rows.isEmpty)
                    EmptyCard(
                      title: switch (_tab) {
                        _Tab.files => g.isMember ? 'No resources shared yet' : 'Join to see shared resources',
                        _Tab.sessions => g.isMember ? 'No sessions scheduled' : 'Join to see sessions',
                        _Tab.people => 'No members yet',
                      },
                      detail: _tab == _Tab.files && g.isMember ? 'Members share links and notes from the web app.' : null,
                    )
                  else
                    Surface(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: separated([
                          for (final r in rows)
                            InkWell(
                              onTap: r.onTap,
                              child: Container(
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
                                          ZText(r.meta, variant: TextVariant.small, muted: true, maxLines: 2, style: const TextStyle(fontSize: 12)),
                                        ],
                                      ),
                                    ),
                                    if (r.side.isNotEmpty) ZText(r.side, variant: TextVariant.mono, style: const TextStyle(fontSize: 11)),
                                  ],
                                ),
                              ),
                            ),
                        ]),
                      ),
                    ),
                  if (_tab == _Tab.sessions && g.isMember)
                    ZButton(label: 'Schedule a session', variant: ButtonVariant.live, onTap: () => context.push(withQuery('/events/new', {'groupId': g.id}))),
                ],
              ),
            ),
          ],
        );
      },
    );
  }
}

class _RowData {
  const _RowData({required this.lead, required this.title, required this.meta, required this.side, this.onTap});
  final Widget lead;
  final String title;
  final String meta;
  final String side;
  final VoidCallback? onTap;
}
