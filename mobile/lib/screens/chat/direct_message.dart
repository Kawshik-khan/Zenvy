import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/sample.dart';
import '../../router.dart';
import '../../state/app_state.dart';
import '../../theme/tokens.dart';
import '../../widgets/widgets.dart';
import '../missing.dart';

/// Quiet card header shared by DMs and group rooms.
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

/// Messages listed bottom-up so the newest stays in view as the thread grows.
class ThreadList extends StatelessWidget {
  const ThreadList({super.key, required this.children, this.gap = 12});
  final List<Widget> children;
  final double gap;

  @override
  Widget build(BuildContext context) => ListView.separated(
    reverse: true,
    padding: const EdgeInsets.all(16),
    keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
    itemCount: children.length,
    separatorBuilder: (_, _) => SizedBox(height: gap),
    itemBuilder: (_, i) => children[children.length - 1 - i],
  );
}

class DirectMessageScreen extends StatelessWidget {
  const DirectMessageScreen({super.key, required this.id});
  final String id;

  @override
  Widget build(BuildContext context) {
    final other = people.where((p) => p.id == id && p.id != 'me').firstOrNull;
    if (other == null) return const Missing(to: '/messages');
    final app = AppScope.of(context);
    final partner = partnerById(other.id);
    final messages = app.dms[other.id] ?? const [];
    final first = other.firstName;

    return Screen(
      volume: Volume.quiet,
      header: ThreadHeader(
        center: Surface(
          shadow: ShadowSize.none,
          borderWidth: 0,
          fill: const Color(0x00000000),
          onTap: partner != null ? () => context.push('/partner/${other.id}') : null,
          semanticLabel: "View ${other.name}'s profile",
          child: Row(
            spacing: 10,
            children: [
              Avatar(initials: other.initials, color: other.color, size: 42),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ZText(other.name, variant: TextVariant.h3, maxLines: 1, style: const TextStyle(fontSize: 16)),
                    ZText(
                      partner != null ? 'Partner · ${partner.score}% match' : 'Classmate',
                      variant: TextVariant.small,
                      muted: true,
                      style: const TextStyle(fontSize: 12),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        right: Row(
          spacing: 8,
          children: [
            ZIconButton(icon: LucideIcons.phone, label: 'Voice call $first', onTap: () => context.push(withQuery('/call/incoming', {'id': other.id}))),
            ZIconButton(icon: LucideIcons.video, label: 'Video call $first', onTap: () => context.push(withQuery('/call/active', {'title': other.name}))),
          ],
        ),
      ),
      footer: Composer(placeholder: 'Message $first', onSend: (t) => app.sendDm(other.id, t)),
      body: ThreadList(
        children: [
          Center(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
              decoration: BoxDecoration(
                color: Palette.quietCard,
                borderRadius: BorderRadius.circular(99),
                border: Border.all(color: Palette.quietInk, width: 2),
              ),
              child: const ZText('Today', variant: TextVariant.label),
            ),
          ),
          if (messages.isEmpty)
            ZText('Say hi to $first. Messages are only visible to the two of you.', variant: TextVariant.small, muted: true, align: TextAlign.center),
          for (final m in messages) Bubble(message: m),
          if (other.id == 'tanvir') TypingIndicator(name: first),
        ],
      ),
    );
  }
}
