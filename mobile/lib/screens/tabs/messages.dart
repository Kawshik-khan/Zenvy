import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/models.dart';
import '../../router.dart';
import '../../state/app_state.dart';
import '../../theme/tokens.dart';
import '../../widgets/widgets.dart';

enum _Tab { people, groups, channels }

class MessagesScreen extends StatefulWidget {
  const MessagesScreen({super.key});

  @override
  State<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends State<MessagesScreen> {
  _Tab _tab = _Tab.people;
  String _query = '';
  final _loader = GlobalKey<LoaderState<Inbox>>();

  bool _matches(String text) => _query.isEmpty || text.toLowerCase().contains(_query.toLowerCase());

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    return Screen(
      tabBar: true,
      onRefresh: () async => _loader.currentState?.reload(),
      children: [
        const Row(
          spacing: 12,
          children: [
            Expanded(child: ZText('Messages', variant: TextVariant.title, header: true)),
            ZIconButton(icon: LucideIcons.pencil, label: 'New message', tone: Tone.chat, href: '/new-message'),
          ],
        ),
        Segmented<_Tab>(
          label: 'Conversation type',
          tone: Tone.chat,
          value: _tab,
          onChanged: (k) => setState(() => _tab = k),
          options: const [SegmentOption(_Tab.people, 'People'), SegmentOption(_Tab.groups, 'Groups'), SegmentOption(_Tab.channels, 'Channels')],
        ),
        SearchBox(placeholder: 'Search', label: 'Search conversations', shadow: false, onChanged: (v) => setState(() => _query = v.trim())),
        Loader<Inbox>(
          key: _loader,
          load: app.api.inbox,
          builder: (context, inbox, reload) => switch (_tab) {
            _Tab.people => _list(
              [
                for (final c in inbox.direct.where((c) => _matches(c.title)))
                  _Row(
                    avatar: Avatar(initials: c.initials, color: c.color, size: 52, image: c.avatar),
                    title: c.title,
                    subtitle: c.lastMessage == null ? 'Say hi' : c.lastMessage!.content,
                    time: listTime(c.lastMessage?.at),
                    unread: c.unreadCount,
                    onTap: c.peerId == null ? null : () => context.push('/dm/${c.peerId}'),
                  ),
              ],
              empty: const EmptyCard(
                title: 'No conversations yet',
                detail: 'Message a study partner once they accept your request.',
                action: ZButton(label: 'Find partners', variant: ButtonVariant.match, size: ButtonSize.sm, href: '/partners'),
              ),
            ),
            _Tab.groups => _list(
              [
                for (final g in inbox.groups.where((g) => _matches(g.name)))
                  _Row(
                    avatar: Avatar(initials: g.initials, color: g.color, size: 52, square: true),
                    title: g.name,
                    subtitle: g.lastMessage == null ? '${g.memberCount} members' : '${g.lastMessage!.senderName}: ${g.lastMessage!.content}',
                    time: listTime(g.lastMessage?.at),
                    onTap: () => context.push('/group-room/${g.id}'),
                  ),
              ],
              empty: const EmptyCard(
                title: 'No group chats yet',
                detail: 'Join a study group to chat with it.',
                action: ZButton(label: 'Browse groups', variant: ButtonVariant.chat, size: ButtonSize.sm, href: '/groups'),
              ),
            ),
            _Tab.channels => Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              spacing: 16,
              children: [
                _list([
                  for (final c in inbox.channels.where((c) => _matches('${c.tag} ${c.name}')))
                    _Row(
                      avatar: Avatar(initials: '#', color: c.color, size: 52, square: true),
                      title: '# ${c.tag}',
                      subtitle: c.lastMessage == null ? c.name : '${c.lastMessage!.senderName}: ${c.lastMessage!.content}',
                      time: listTime(c.lastMessage?.at),
                      onTap: () => context.push(withQuery('/channel/${c.id}', {'name': c.tag})),
                    ),
                ], empty: const EmptyCard(title: "You haven't joined a channel", detail: 'Channels are open rooms for a course or topic.')),
                if (inbox.suggestedChannels.isNotEmpty) ...[
                  const SectionLabel('Channels to join'),
                  for (final c in inbox.suggestedChannels) _JoinChannelCard(channel: c, onJoined: reload),
                ],
              ],
            ),
          },
        ),
      ],
    );
  }

  Widget _list(List<Widget> rows, {required Widget empty}) {
    if (rows.isEmpty) return _query.isEmpty ? empty : const EmptyCard(title: 'No conversations found');
    return Surface(
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: separated(rows)),
    );
  }
}

class _Row extends StatelessWidget {
  const _Row({required this.avatar, required this.title, required this.subtitle, required this.time, this.unread = 0, this.onTap});
  final Widget avatar;
  final String title;
  final String subtitle;
  final String time;
  final int unread;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: '$title. $subtitle. $time${unread > 0 ? '. $unread unread' : ''}',
      excludeSemantics: true,
      child: InkWell(
        onTap: onTap,
        highlightColor: Palette.paper,
        splashColor: Palette.paper,
        child: Container(
          constraints: const BoxConstraints(minHeight: 72),
          padding: const EdgeInsets.all(12),
          child: Row(
            spacing: 12,
            children: [
              avatar,
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  spacing: 2,
                  children: [
                    Row(
                      spacing: 8,
                      children: [
                        Expanded(child: ZText(title, variant: TextVariant.h3, maxLines: 1)),
                        ZText(time, variant: TextVariant.mono, muted: true, style: const TextStyle(fontSize: 11)),
                      ],
                    ),
                    Row(
                      spacing: 8,
                      children: [
                        Expanded(
                          child: ZText(
                            subtitle,
                            variant: TextVariant.small,
                            muted: unread == 0,
                            maxLines: 1,
                            style: unread > 0 ? const TextStyle(fontWeight: FontWeight.w600) : null,
                          ),
                        ),
                        if (unread > 0) CountBadge(value: formatBadge(unread)!, tone: Tone.chat),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _JoinChannelCard extends StatefulWidget {
  const _JoinChannelCard({required this.channel, required this.onJoined});
  final ChannelCard channel;
  final Future<void> Function() onJoined;

  @override
  State<_JoinChannelCard> createState() => _JoinChannelCardState();
}

class _JoinChannelCardState extends State<_JoinChannelCard> {
  bool _busy = false;

  @override
  Widget build(BuildContext context) {
    final c = widget.channel;
    return Surface(
      shadow: ShadowSize.sm,
      padding: const EdgeInsets.all(12),
      child: Row(
        spacing: 12,
        children: [
          Avatar(initials: '#', color: c.color, size: 44, square: true),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ZText('# ${c.tag}', variant: TextVariant.h3),
                ZText([c.description ?? c.name, '${c.memberCount} members'].join(' · '), variant: TextVariant.small, muted: true, maxLines: 2),
              ],
            ),
          ),
          ZButton(
            label: 'Join',
            variant: ButtonVariant.chat,
            size: ButtonSize.sm,
            disabled: _busy,
            semanticLabel: 'Join ${c.tag}',
            onTap: () async {
              setState(() => _busy = true);
              final app = AppScope.read(context);
              final ok = await attempt(context, () => app.api.setChannelMembership(c.id, join: true), success: 'Joined #${c.tag}');
              if (mounted) setState(() => _busy = false);
              if (ok) await widget.onJoined();
            },
          ),
        ],
      ),
    );
  }
}
