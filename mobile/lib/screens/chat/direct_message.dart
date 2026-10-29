import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/models.dart';
import '../../router.dart';
import '../../state/app_state.dart';
import '../../theme/tokens.dart';
import '../../widgets/widgets.dart';

/// Quiet card header shared by DMs, group rooms and channels.
class ThreadHeader extends StatelessWidget {
  const ThreadHeader({super.key, required this.center, this.right});
  final Widget center;
  final Widget? right;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.only(bottom: 10),
    decoration: const BoxDecoration(
      color: Palette.quietCard,
      border: Border(bottom: BorderSide(color: Palette.quietInk, width: 2)),
    ),
    child: TopBar(fallback: '/messages', center: center, right: right),
  );
}

class ThreadTitle extends StatelessWidget {
  const ThreadTitle({super.key, required this.avatar, required this.title, required this.subtitle, this.onTap, this.semanticLabel});
  final Widget avatar;
  final String title;
  final String subtitle;
  final VoidCallback? onTap;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) => Surface(
    shadow: ShadowSize.none,
    borderWidth: 0,
    fill: const Color(0x00000000),
    onTap: onTap,
    semanticLabel: semanticLabel,
    child: Row(
      spacing: 10,
      children: [
        avatar,
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ZText(title, variant: TextVariant.h3, maxLines: 1, style: const TextStyle(fontSize: 16)),
              ZText(subtitle, variant: TextVariant.small, muted: true, maxLines: 1, style: const TextStyle(fontSize: 12)),
            ],
          ),
        ),
      ],
    ),
  );
}

/// A direct conversation with an accepted study partner, opened by their user id.
class DirectMessageScreen extends StatelessWidget {
  const DirectMessageScreen({super.key, required this.userId});
  final String userId;

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    return Loader<({Person person, DirectConversation conversation})>(
      load: () async {
        final results = await Future.wait([app.api.person(userId), app.api.openDm(userId)]);
        return (person: results[0] as Person, conversation: results[1] as DirectConversation);
      },
      frame: (context, body) => Screen(
        volume: Volume.quiet,
        header: const ThreadHeader(center: SizedBox()),
        body: body,
      ),
      builder: (context, data, _) {
        final other = data.person;
        final conversationId = data.conversation.id;
        final first = other.firstName;
        void call(bool video) => context.push(withQuery('/call/active', {'conversationId': conversationId, 'title': other.name, 'video': video ? '1' : null}));
        return Screen(
          volume: Volume.quiet,
          header: ThreadHeader(
            center: ThreadTitle(
              avatar: Avatar.of(other, size: 42),
              title: other.name,
              subtitle: 'Study partner${other.score > 0 ? ' · ${other.score}% match' : ''}',
              onTap: () => context.push('/partner/${other.id}'),
              semanticLabel: "View ${other.name}'s profile",
            ),
            right: Row(
              spacing: 8,
              children: [
                ZIconButton(icon: LucideIcons.phone, label: 'Voice call $first', onTap: () => call(false)),
                ZIconButton(icon: LucideIcons.video, label: 'Video call $first', onTap: () => call(true)),
              ],
            ),
          ),
          body: ChatThread(
            load: () => app.api.dmMessages(conversationId),
            send: (text) => app.api.sendDm(conversationId, text),
            onSeen: () async {
              await app.api.markConversationRead(conversationId);
              await app.refreshBadges();
            },
            onCallBack: call,
            placeholder: 'Message $first',
            emptyText: 'Say hi to $first. Messages are only visible to the two of you.',
          ),
        );
      },
    );
  }
}
