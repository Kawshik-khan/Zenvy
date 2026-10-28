import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../data/models.dart';
import '../state/app_state.dart';
import '../theme/tokens.dart';
import '../theme/type.dart';
import '../widgets/widgets.dart';

({IconData icon, Color fill}) _kind(String type) => switch (type) {
  'MATCH_REQUEST' => (icon: LucideIcons.userPlus, fill: Palette.match),
  'GROUP_INVITE' => (icon: LucideIcons.users, fill: Palette.chat),
  'JOB_REVIEW' => (icon: LucideIcons.briefcase, fill: Palette.career),
  _ => (icon: LucideIcons.bell, fill: Palette.white),
};

String? _destination(AppNotification n) => switch (n.targetKind) {
  'user' => '/partner/${n.targetId}',
  'group' => '/groups/${n.targetId}',
  'job' => '/jobs/${n.targetId}',
  _ => null,
};

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final Set<String> _busy = {};

  Future<void> _respond(AppNotification n, bool accept) async {
    final app = AppScope.read(context);
    setState(() => _busy.add(n.id));
    await attempt(context, () async {
      await app.api.respondToNotification(n.id, accept: accept);
      app.touch();
    }, success: accept ? (n.type == 'GROUP_INVITE' ? 'Joined the group' : 'You\'re now study partners') : 'Declined');
    if (!mounted) return;
    setState(() => _busy.remove(n.id));
    if (accept && n.type == 'MATCH_REQUEST' && n.targetId != null) context.push('/matched/${n.targetId}');
  }

  Future<void> _open(AppNotification n) async {
    final app = AppScope.read(context);
    final to = _destination(n);
    if (!n.read) {
      try {
        await app.api.markRead(n.id);
        app.touch();
      } catch (_) {}
    }
    if (to != null && mounted) context.push(to);
  }

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    return Loader<List<AppNotification>>(
      load: app.api.notifications,
      frame: (context, body) => Screen(
        header: const TopBar(title: 'Notifications'),
        body: body,
      ),
      builder: (context, list, reload) {
        final unread = list.where((n) => !n.read).length;
        final today = list.where((n) => n.at != null && DateTime.now().difference(n.at!).inHours < 24).toList();
        final earlier = list.where((n) => !today.contains(n)).toList();
        return Screen(
          header: TopBar(
            title: 'Notifications',
            right: unread > 0
                ? ZButton(
                    label: 'Mark all read',
                    variant: ButtonVariant.ghost,
                    size: ButtonSize.sm,
                    onTap: () => attempt(context, () async {
                      await app.api.markRead();
                      app.touch();
                    }),
                  )
                : null,
          ),
          onRefresh: reload,
          children: [
            if (list.isEmpty) const EmptyCard(title: "You're all caught up", detail: 'Partner requests, group invites and job updates show up here.'),
            if (today.isNotEmpty) SectionLabel('Today${unread > 0 ? ' · $unread new' : ''}'),
            for (final n in today) _item(n),
            if (earlier.isNotEmpty) const Padding(padding: EdgeInsets.only(top: 6), child: SectionLabel('Earlier')),
            for (final n in earlier) _item(n),
          ],
        );
      },
    );
  }

  Widget _item(AppNotification n) {
    final k = _kind(n.type);
    final busy = _busy.contains(n.id);
    return Surface(
      shadow: n.read ? ShadowSize.none : ShadowSize.md,
      fill: n.read ? Palette.softCard : Palette.white,
      onTap: n.actionable ? null : () => _open(n),
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: 10,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            spacing: 12,
            children: [
              if (n.actor != null) Avatar.of(n.actor!) else IconTile(icon: k.icon, fill: k.fill),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  spacing: 4,
                  children: [
                    ZText(
                      n.content,
                      variant: TextVariant.small,
                      style: const TextStyle(fontSize: 14, height: 20 / 14),
                    ),
                    Text(timeAgo(n.at), style: mono(FontWeight.w500, 11, 14).copyWith(color: Palette.muted)),
                  ],
                ),
              ),
              if (!n.read)
                Semantics(
                  label: 'Unread',
                  child: Container(
                    width: 12,
                    height: 12,
                    margin: const EdgeInsets.only(top: 4),
                    decoration: BoxDecoration(
                      color: Palette.alert,
                      shape: BoxShape.circle,
                      border: Border.all(color: Palette.ink, width: 2),
                    ),
                  ),
                ),
            ],
          ),
          if (n.actionable)
            Padding(
              padding: const EdgeInsets.only(left: 56),
              child: Wrap(
                spacing: 10,
                runSpacing: 8,
                children: [
                  ZButton(
                    label: 'Accept',
                    variant: n.type == 'GROUP_INVITE' ? ButtonVariant.chat : ButtonVariant.match,
                    size: ButtonSize.sm,
                    disabled: busy,
                    onTap: () => _respond(n, true),
                  ),
                  ZButton(label: 'Decline', variant: ButtonVariant.secondary, size: ButtonSize.sm, disabled: busy, onTap: () => _respond(n, false)),
                  if (_destination(n) != null)
                    ZButton(label: 'View', variant: ButtonVariant.ghost, size: ButtonSize.sm, onTap: () => context.push(_destination(n)!)),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
