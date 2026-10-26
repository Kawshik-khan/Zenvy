import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/sample.dart';
import '../../router.dart';
import '../../state/app_state.dart';
import '../../theme/tokens.dart';
import '../../widgets/widgets.dart';
import '../missing.dart';
import 'direct_message.dart' show ThreadHeader, ThreadList;

class GroupRoomScreen extends StatelessWidget {
  const GroupRoomScreen({super.key, required this.id});
  final String id;

  @override
  Widget build(BuildContext context) {
    final g = groupById(id);
    if (g == null) return const Missing(to: '/messages');
    final app = AppScope.of(context);
    final messages = app.groupChats[g.id] ?? const [];
    final call = g.liveCall;
    final callNames = call == null ? <String>[] : [for (final p in call.participants) person(p).firstName];

    return Screen(
      volume: Volume.quiet,
      header: ThreadHeader(
        center: Surface(
          shadow: ShadowSize.none,
          borderWidth: 0,
          fill: const Color(0x00000000),
          onTap: () => context.push('/groups/${g.id}'),
          semanticLabel: '${g.name} details',
          child: Row(
            spacing: 10,
            children: [
              Avatar(initials: g.initials, color: g.color, size: 42, square: true),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ZText(g.name, variant: TextVariant.h3, maxLines: 1, style: const TextStyle(fontSize: 16)),
                    ZText('${g.memberIds.length} members', variant: TextVariant.small, muted: true, style: const TextStyle(fontSize: 12)),
                  ],
                ),
              ),
            ],
          ),
        ),
        right: ZIconButton(icon: LucideIcons.users, label: 'Members and files', onTap: () => context.push('/groups/${g.id}')),
      ),
      footer: Composer(placeholder: 'Message ${g.name}', onSend: (t) => app.sendGroup(g.id, t)),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (call != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: Surface(
                tone: Tone.live,
                shadow: ShadowSize.sm,
                radius: 12,
                onTap: () => context.push(withQuery('/call/active', {'title': g.name})),
                semanticLabel: 'Study call in progress with ${callNames.join(', ')}. Join',
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                child: Row(
                  spacing: 10,
                  children: [
                    const Icon(LucideIcons.video, size: 20, color: Palette.quietInk),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const ZText('Study call in progress', variant: TextVariant.h3, style: TextStyle(fontSize: 14)),
                          ZText(
                            '${callNames.take(2).join(', ')} and ${callNames.length - 2} more · ${call.startedMinutesAgo} min',
                            variant: TextVariant.small,
                            style: const TextStyle(fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Palette.quietCard,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Palette.quietInk, width: 2),
                      ),
                      child: const ZText('Join', variant: TextVariant.h3, style: TextStyle(fontSize: 14)),
                    ),
                  ],
                ),
              ),
            ),
          Expanded(
            child: ThreadList(
              gap: 14,
              children: [
                if (messages.isEmpty) ZText('No messages yet. Start the conversation.', variant: TextVariant.small, muted: true, align: TextAlign.center),
                for (final m in messages) Bubble(message: m, showAuthor: true),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
