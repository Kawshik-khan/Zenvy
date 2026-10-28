import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/models.dart';
import '../../state/app_state.dart';
import '../../theme/tokens.dart';
import '../../util/dialogs.dart';
import '../../widgets/widgets.dart';
import 'direct_message.dart' show ThreadHeader, ThreadTitle;

class ChannelRoomScreen extends StatelessWidget {
  const ChannelRoomScreen({super.key, required this.id, this.name});
  final String id;
  final String? name;

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final tag = name ?? 'channel';
    return Screen(
      volume: Volume.quiet,
      header: ThreadHeader(
        center: ThreadTitle(
          avatar: Avatar(initials: '#', color: colorFor(id), size: 42, square: true),
          title: '# $tag',
          subtitle: 'Channel',
        ),
        right: ZIconButton(
          icon: LucideIcons.logOut,
          label: 'Leave channel',
          onTap: () => confirm(context, 'Leave #$tag?', "You'll stop seeing its messages. You can join again from Messages.", 'Leave', () async {
            if (await attempt(context, () => app.api.setChannelMembership(id, join: false), success: 'Left #$tag')) {
              app.touch();
              if (context.mounted) goBack(context, '/messages');
            }
          }),
        ),
      ),
      body: ChatThread(
        showAuthor: true,
        load: () => app.api.channelMessages(id),
        send: (text) => app.api.sendChannelMessage(id, text),
        placeholder: 'Message #$tag',
        emptyText: 'No messages yet. Say hello.',
      ),
    );
  }
}
