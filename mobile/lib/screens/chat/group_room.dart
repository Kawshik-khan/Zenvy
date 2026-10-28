import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/models.dart';
import '../../router.dart';
import '../../state/app_state.dart';
import '../../theme/tokens.dart';
import '../../widgets/widgets.dart';
import 'direct_message.dart' show ThreadHeader, ThreadTitle;

class GroupRoomScreen extends StatelessWidget {
  const GroupRoomScreen({super.key, required this.id});
  final String id;

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    return Loader<GroupDetail>(
      load: () => app.api.group(id),
      frame: (context, body) => Screen(
        volume: Volume.quiet,
        header: const ThreadHeader(center: SizedBox()),
        body: body,
      ),
      builder: (context, g, _) {
        if (!g.isMember) {
          return Screen(
            volume: Volume.quiet,
            header: ThreadHeader(
              center: ThreadTitle(
                avatar: Avatar(initials: g.initials, color: g.color, size: 42, square: true),
                title: g.name,
                subtitle: '${g.members.length} members',
              ),
            ),
            body: Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: EmptyCard(
                  title: 'Join ${g.name} to chat',
                  action: ZButton(label: 'View group', variant: ButtonVariant.chat, onTap: () => context.pushReplacement('/groups/${g.id}')),
                ),
              ),
            ),
          );
        }
        final call = g.liveCall;
        void startCall(bool video) => context.push(withQuery('/call/active', {'groupId': g.id, 'title': g.name, 'video': video ? '1' : null}));
        return Screen(
          volume: Volume.quiet,
          header: ThreadHeader(
            center: ThreadTitle(
              avatar: Avatar(initials: g.initials, color: g.color, size: 42, square: true),
              title: g.name,
              subtitle: '${g.members.length} members',
              onTap: () => context.push('/groups/${g.id}'),
              semanticLabel: '${g.name} details',
            ),
            right: Row(
              spacing: 8,
              children: [
                ZIconButton(icon: LucideIcons.video, label: 'Start a group call', onTap: () => startCall(true)),
                ZIconButton(icon: LucideIcons.users, label: 'Members and files', onTap: () => context.push('/groups/${g.id}')),
              ],
            ),
          ),
          body: ChatThread(
            showAuthor: true,
            load: () => app.api.groupMessages(g.id),
            send: (text) => app.api.sendGroupMessage(g.id, text),
            placeholder: 'Message ${g.name}',
            emptyText: 'No messages yet. Start the conversation.',
            header: call == null
                ? null
                : Padding(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                    child: Surface(
                      tone: Tone.live,
                      shadow: ShadowSize.sm,
                      radius: 12,
                      onTap: () => startCall(call.mediaType == 'VIDEO'),
                      semanticLabel: 'Study call in progress with ${call.participants.map((p) => p.name).join(', ')}. Join',
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
                                  call.participants.map((p) => p.firstName).join(', '),
                                  variant: TextVariant.small,
                                  maxLines: 1,
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
          ),
        );
      },
    );
  }
}
