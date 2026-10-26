import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../data/models.dart';
import '../state/app_state.dart';
import '../theme/tokens.dart';
import '../theme/type.dart';
import '../widgets/widgets.dart';

const _kinds = {
  NotificationKind.match: (icon: LucideIcons.userPlus, fill: Palette.match),
  NotificationKind.message: (icon: LucideIcons.messageSquare, fill: Palette.chat),
  NotificationKind.event: (icon: LucideIcons.calendar, fill: Palette.live),
  NotificationKind.job: (icon: LucideIcons.briefcase, fill: Palette.career),
  NotificationKind.resource: (icon: LucideIcons.fileText, fill: Palette.white),
  NotificationKind.call: (icon: LucideIcons.phone, fill: Palette.white),
};

String? _destination(AppNotification n) => switch (n.kind) {
  NotificationKind.message || NotificationKind.call => '/dm/${n.refId ?? 'tanvir'}',
  NotificationKind.event => '/events',
  NotificationKind.job => '/jobs/${n.refId ?? 'kl-frontend'}',
  NotificationKind.resource => '/groups/ac',
  NotificationKind.match => n.refId == null ? null : '/partner/${n.refId}',
};

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final unread = app.unreadNotifications;
    final today = app.notifications.where((n) => !n.time.startsWith('Yesterday'));
    final earlier = app.notifications.where((n) => n.time.startsWith('Yesterday')).toList();

    Widget item(AppNotification n) {
      final k = _kinds[n.kind]!;
      final pending = n.kind == NotificationKind.match && n.unread;
      final to = _destination(n);
      return Surface(
        shadow: n.unread ? ShadowSize.md : ShadowSize.none,
        fill: n.unread ? Palette.white : Palette.softCard,
        onTap: pending || to == null ? null : () => context.push(to),
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          spacing: 10,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              spacing: 12,
              children: [
                IconTile(icon: k.icon, fill: k.fill),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    spacing: 4,
                    children: [
                      Text.rich(
                        TextSpan(
                          children: [
                            if (n.actor != null)
                              TextSpan(
                                text: '${n.actor} ',
                                style: const TextStyle(fontWeight: FontWeight.w700),
                              ),
                            TextSpan(text: n.body),
                          ],
                        ),
                        style: zStyle(context, TextVariant.small).copyWith(fontSize: 14, height: 20 / 14),
                      ),
                      Text(n.time, style: mono(FontWeight.w500, 11, 14).copyWith(color: Palette.muted)),
                    ],
                  ),
                ),
                if (n.unread)
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
            if (pending)
              Padding(
                padding: const EdgeInsets.only(left: 56),
                child: Row(
                  spacing: 10,
                  children: [
                    ZButton(
                      label: 'Accept',
                      variant: ButtonVariant.match,
                      size: ButtonSize.sm,
                      onTap: () => app.resolveRequest(n.id, true),
                      semanticLabel: 'Accept ${n.actor}',
                    ),
                    ZButton(
                      label: 'Decline',
                      variant: ButtonVariant.secondary,
                      size: ButtonSize.sm,
                      onTap: () => app.resolveRequest(n.id, false),
                      semanticLabel: 'Decline ${n.actor}',
                    ),
                  ],
                ),
              ),
          ],
        ),
      );
    }

    return Screen(
      header: TopBar(
        title: 'Notifications',
        right: unread > 0 ? ZButton(label: 'Mark all read', variant: ButtonVariant.ghost, size: ButtonSize.sm, onTap: app.markAllRead) : null,
      ),
      children: [
        SectionLabel('Today${unread > 0 ? ' · $unread new' : ''}'),
        for (final n in today) item(n),
        if (earlier.isNotEmpty) const Padding(padding: EdgeInsets.only(top: 6), child: SectionLabel('Earlier')),
        for (final n in earlier) item(n),
      ],
    );
  }
}
