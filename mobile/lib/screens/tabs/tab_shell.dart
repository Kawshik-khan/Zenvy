import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../state/app_state.dart';
import '../../theme/tokens.dart';
import '../../theme/type.dart';
import '../../widgets/widgets.dart';

// Home, Partners, Messages and Jobs, with the rest under More. Focus opens from Home and More.
const _items = [
  (label: 'Home', icon: LucideIcons.house, tone: Tone.focus),
  (label: 'Partners', icon: LucideIcons.users, tone: Tone.match),
  (label: 'Messages', icon: LucideIcons.messageSquare, tone: Tone.chat),
  (label: 'Jobs', icon: LucideIcons.briefcase, tone: Tone.career),
  (label: 'More', icon: LucideIcons.menu, tone: Tone.live),
];

class TabShell extends StatelessWidget {
  const TabShell({super.key, required this.shell});

  final StatefulNavigationShell shell;

  static const _pill = Size(52, 34);
  static const _labelH = 13.0;
  static const _gap = 4.0;

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.paddingOf(context).bottom;
    final unread = formatBadge(AppScope.of(context).unreadMessages);
    final index = shell.currentIndex;
    final reduce = MediaQuery.maybeDisableAnimationsOf(context) ?? false;
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
                  decoration: BoxDecoration(color: Palette.ink, borderRadius: BorderRadius.circular(22)),
                ),
              ),
              Material(
                type: MaterialType.transparency,
                child: Container(
                  height: 72,
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  decoration: BoxDecoration(
                    color: Palette.white,
                    borderRadius: BorderRadius.circular(22),
                    border: Border.all(color: Palette.ink, width: 3),
                  ),
                  child: LayoutBuilder(
                    builder: (context, box) {
                      final slot = box.maxWidth / _items.length;
                      return Stack(
                        children: [
                          // One pill slides between tabs and takes on each tab's colour.
                          AnimatedPositioned(
                            duration: reduce ? Duration.zero : const Duration(milliseconds: 320),
                            curve: Curves.easeOutBack,
                            left: index * slot + (slot - _pill.width) / 2,
                            top: (box.maxHeight - _pill.height - _gap - _labelH) / 2,
                            width: _pill.width,
                            height: _pill.height,
                            child: AnimatedContainer(
                              duration: reduce ? Duration.zero : const Duration(milliseconds: 240),
                              decoration: BoxDecoration(
                                color: toneColor(_items[index].tone),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: Palette.ink, width: 2),
                              ),
                            ),
                          ),
                          Row(
                            children: [
                              for (var i = 0; i < _items.length; i++)
                                Expanded(
                                  child: _TabButton(
                                    item: _items[i],
                                    focused: index == i,
                                    badge: i == 2 ? unread : null,
                                    onTap: () {
                                      if (i != index) HapticFeedback.selectionClick();
                                      shell.goBranch(i, initialLocation: i == index);
                                    },
                                  ),
                                ),
                            ],
                          ),
                        ],
                      );
                    },
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
    final reduce = MediaQuery.maybeDisableAnimationsOf(context) ?? false;
    return Semantics(
      selected: focused,
      button: true,
      label: badge != null ? '${item.label}, $badge unread' : item.label,
      excludeSemantics: true,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          spacing: TabShell._gap,
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                SizedBox.fromSize(
                  size: TabShell._pill,
                  child: Center(
                    // The icon hops once as its tab becomes active.
                    child: TweenAnimationBuilder<double>(
                      key: ValueKey(focused),
                      tween: Tween(begin: 0, end: focused ? 1 : 0),
                      duration: reduce ? Duration.zero : const Duration(milliseconds: 360),
                      builder: (_, t, child) => Transform.scale(scale: 1 + 0.18 * math.sin(math.pi * t), child: child),
                      child: Icon(item.icon, size: 20, color: Palette.ink),
                    ),
                  ),
                ),
                if (badge != null)
                  Positioned(
                    top: -8,
                    right: -6,
                    child: CountBadge(value: badge!, tone: Tone.alert),
                  ),
              ],
            ),
            Text(item.label, maxLines: 1, style: grotesk(focused ? FontWeight.w700 : FontWeight.w500, 11, TabShell._labelH).copyWith(color: Palette.ink)),
          ],
        ),
      ),
    );
  }
}
