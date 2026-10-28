import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../api/config.dart';
import '../../state/app_state.dart';
import '../../theme/tokens.dart';
import '../../util/dialogs.dart';
import '../../widgets/widgets.dart';

const _links = [
  (label: 'Jobs', href: '/jobs', icon: LucideIcons.briefcase, fill: Palette.career),
  (label: 'Study groups', href: '/groups', icon: LucideIcons.users, fill: Palette.chat),
  (label: 'Sessions & events', href: '/events', icon: LucideIcons.calendar, fill: Palette.live),
  (label: 'Study stats', href: '/stats', icon: LucideIcons.chartColumn, fill: Palette.focus),
  (label: 'Notifications', href: '/notifications', icon: LucideIcons.bell, fill: Palette.white),
  (label: 'Saved jobs', href: '/jobs?tab=saved', icon: LucideIcons.bookmark, fill: Palette.white),
];

class _LinkRow extends StatelessWidget {
  const _LinkRow({required this.label, this.onTap, this.icon, this.fill, this.trailing, this.badge});

  final String label;
  final VoidCallback? onTap;
  final IconData? icon;
  final Color? fill;
  final Widget? trailing;
  final String? badge;

  @override
  Widget build(BuildContext context) {
    final row = Container(
      constraints: const BoxConstraints(minHeight: 56),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
      child: Row(
        spacing: 12,
        children: [
          if (icon != null && fill != null) IconTile(icon: icon!, fill: fill!, size: 36),
          Expanded(child: ZText(label, variant: TextVariant.strong)),
          if (badge != null) CountBadge(value: badge!),
          trailing ?? (onTap != null ? const Icon(LucideIcons.chevronRight, size: 18, color: Palette.ink) : const SizedBox()),
        ],
      ),
    );
    if (onTap == null) return row;
    return Semantics(
      link: true,
      child: InkWell(onTap: onTap, highlightColor: Palette.paper, splashColor: Palette.paper, child: row),
    );
  }
}

class MoreScreen extends StatelessWidget {
  const MoreScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final me = app.me;
    return Screen(
      tabBar: true,
      onRefresh: app.refreshMe,
      children: [
        const ZText('More', variant: TextVariant.title, header: true),
        if (me != null)
          Surface(
            href: '/profile',
            semanticLabel: 'View and edit your profile',
            padding: const EdgeInsets.all(12),
            child: Row(
              spacing: 12,
              children: [
                Avatar.of(me, size: 52),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      ZText(me.name, variant: TextVariant.h3, style: const TextStyle(fontSize: 16)),
                      ZText(me.email ?? 'View and edit profile', variant: TextVariant.small, muted: true, maxLines: 1),
                    ],
                  ),
                ),
                const Icon(LucideIcons.chevronRight, size: 18, color: Palette.ink),
              ],
            ),
          ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          spacing: 8,
          children: [
            const SectionLabel('Go to'),
            Surface(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: separated([
                  for (final l in _links)
                    _LinkRow(
                      label: l.label,
                      icon: l.icon,
                      fill: l.fill,
                      badge: l.href == '/notifications' ? formatBadge(app.unreadNotifications) : null,
                      onTap: () => context.push(l.href),
                    ),
                ]),
              ),
            ),
          ],
        ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          spacing: 8,
          children: [
            const SectionLabel('Settings'),
            Surface(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: separated([
                  _LinkRow(
                    label: 'Available for matching',
                    trailing: Toggle(
                      value: me?.matchingAvailable ?? true,
                      label: 'Available for matching',
                      onChanged: (v) => attempt(context, () => app.updateMe({'matchingAvailable': v})),
                    ),
                  ),
                  _LinkRow(label: 'Edit profile', onTap: () => context.push('/profile')),
                  _LinkRow(
                    label: 'Privacy & blocked users',
                    onTap: () => notify(context, 'Privacy', 'Block or report someone from their profile. Manage blocked users on the web at $kApiBaseUrl.'),
                  ),
                ]),
              ),
            ),
          ],
        ),
        ZButton(
          label: 'Log out',
          variant: ButtonVariant.danger,
          icon: LucideIcons.logOut,
          size: ButtonSize.lg,
          onTap: () => confirm(context, 'Log out?', "You'll need your email and password to sign back in.", 'Log out', app.signOut),
        ),
      ],
    );
  }
}
