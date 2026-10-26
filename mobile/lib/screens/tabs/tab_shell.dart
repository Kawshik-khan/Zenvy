import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../state/app_state.dart';
import '../../theme/tokens.dart';
import '../../theme/type.dart';
import '../../widgets/widgets.dart';

// Mirrors components/shell/nav.ts on the web: Home, Partners, Messages and Focus, with the rest under More.
const _items = [
  (label: 'Home', icon: LucideIcons.house, tone: Tone.focus),
  (label: 'Partners', icon: LucideIcons.users, tone: Tone.match),
  (label: 'Messages', icon: LucideIcons.messageSquare, tone: Tone.chat),
  (label: 'Focus', icon: LucideIcons.timer, tone: Tone.focus),
  (label: 'More', icon: LucideIcons.menu, tone: Tone.live),
];

class TabShell extends StatelessWidget {
  const TabShell({super.key, required this.shell});

  final StatefulNavigationShell shell;

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.paddingOf(context).bottom;
    final unread = formatBadge(AppScope.of(context).unreadMessages);
    return Stack(
      children: [
        Positioned.fill(child: shell),
        Positioned(
          left: 12,
          right: 12,
          bottom: bottom > 12 ? bottom : 12,
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              Positioned(
                left: 4,
                top: 4,
                right: -4,
                bottom: -4,
                child: DecoratedBox(
                  decoration: BoxDecoration(color: Palette.ink, borderRadius: BorderRadius.circular(14)),
                ),
              ),
              Material(
                type: MaterialType.transparency,
                child: Container(
                  height: 72,
                  padding: const EdgeInsets.symmetric(horizontal: 6),
                  decoration: BoxDecoration(
                    color: Palette.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: Palette.ink, width: 3),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      for (var i = 0; i < _items.length; i++)
                        Flexible(
                          child: _TabButton(
                            item: _items[i],
                            focused: shell.currentIndex == i,
                            badge: i == 2 ? unread : null,
                            onTap: () => shell.goBranch(i, initialLocation: i == shell.currentIndex),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _TabButton extends StatelessWidget {
  const _TabButton({required this.item, required this.focused, required this.badge, required this.onTap});

  final ({String label, IconData icon, Tone tone}) item;
  final bool focused;
  final String? badge;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      selected: focused,
      button: true,
      label: badge != null ? '${item.label}, $badge unread' : item.label,
      excludeSemantics: true,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            Container(
              constraints: const BoxConstraints(maxWidth: 64),
              height: 56,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: focused ? toneColor(item.tone) : null,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: focused ? Palette.ink : const Color(0x00000000), width: 2),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                spacing: 3,
                children: [
                  Icon(item.icon, size: 20, color: Palette.ink),
                  Text(item.label, style: grotesk(FontWeight.w600, 11, 13).copyWith(color: Palette.ink)),
                ],
              ),
            ),
            if (badge != null)
              Positioned(
                top: -2,
                right: 4,
                child: CountBadge(value: badge!, tone: Tone.chat),
              ),
          ],
        ),
      ),
    );
  }
}
