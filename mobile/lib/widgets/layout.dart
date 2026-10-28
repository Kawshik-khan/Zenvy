import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../theme/tokens.dart';
import '../theme/volume.dart';
import 'controls.dart';
import 'text.dart';

/// Height the floating tab bar takes, so tab screens can pad their content above it.
const double kTabBarSpace = 104;

/// A full screen: volume, background, safe area, optional fixed header and footer around
/// a scrolling column of [children] (or a fixed [body] when [scroll] is false).
class Screen extends StatelessWidget {
  const Screen({
    super.key,
    this.volume = Volume.loud,
    this.children = const [],
    this.body,
    this.header,
    this.footer,
    this.tabBar = false,
    this.background,
    this.safeTop = true,
    this.padding,
    this.gap = 16,
    this.lightStatusBar = false,
    this.onRefresh,
  });

  /// Pull to refresh the scrolling content.
  final Future<void> Function()? onRefresh;

  Widget _refreshable(Widget child) =>
      onRefresh == null ? child : RefreshIndicator(onRefresh: onRefresh!, color: Palette.ink, backgroundColor: Palette.white, child: child);

  final Volume volume;
  final List<Widget> children;

  /// Fixed body used instead of the scrolling [children] (chat, full-height screens).
  final Widget? body;

  /// Fixed content above the scroll area (headers).
  final Widget? header;

  /// Fixed content below the scroll area (action bars, composers).
  final Widget? footer;

  /// Leave room for the floating tab bar.
  final bool tabBar;
  final Color? background;

  /// False for screens whose coloured header runs under the status bar.
  final bool safeTop;
  final EdgeInsets? padding;
  final double gap;
  final bool lightStatusBar;

  @override
  Widget build(BuildContext context) {
    final v = VolumeTokens.of(volume);
    final pad = padding ?? EdgeInsets.fromLTRB(20, 12, 20, tabBar ? kTabBarSpace : 28);
    return VolumeScope(
      volume: volume,
      child: AnnotatedRegion<SystemUiOverlayStyle>(
        value: lightStatusBar ? SystemUiOverlayStyle.light : SystemUiOverlayStyle.dark,
        child: Scaffold(
          backgroundColor: background ?? v.canvas,
          body: SafeArea(
            top: safeTop,
            bottom: !tabBar,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                ?header,
                Expanded(
                  child:
                      body ??
                      _refreshable(
                        SingleChildScrollView(
                          padding: pad,
                          physics: onRefresh == null ? null : const AlwaysScrollableScrollPhysics(),
                          keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
                          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, spacing: gap, children: children),
                        ),
                      ),
                ),
                ?footer,
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Go back when there is history (deep links), otherwise land on a sensible screen.
void goBack(BuildContext context, [String fallback = '/home']) {
  if (context.canPop()) {
    context.pop();
  } else {
    context.go(fallback);
  }
}

class TopBar extends StatelessWidget {
  const TopBar({super.key, this.title, this.close = false, this.fallback = '/home', this.right, this.center, this.back = true});

  final String? title;

  /// Show a close (X) instead of a back chevron.
  final bool close;
  final String fallback;
  final Widget? right;
  final Widget? center;
  final bool back;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 4),
      child: Row(
        spacing: 12,
        children: [
          if (back) ZIconButton(icon: close ? LucideIcons.x : LucideIcons.chevronLeft, label: close ? 'Close' : 'Back', onTap: () => goBack(context, fallback)),
          Expanded(
            child:
                center ??
                (title != null
                    ? ZText(
                        title!,
                        variant: TextVariant.title,
                        style: const TextStyle(fontSize: 22, height: 26 / 22),
                        maxLines: 1,
                        header: true,
                      )
                    : const SizedBox()),
          ),
          ?right,
        ],
      ),
    );
  }
}

class SectionLabel extends StatelessWidget {
  const SectionLabel(this.text, {super.key});
  final String text;

  @override
  Widget build(BuildContext context) => ZText(text, variant: TextVariant.label);
}

class SectionHeader extends StatelessWidget {
  const SectionHeader({super.key, required this.title, this.action});
  final String title;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    return ConstrainedBox(
      constraints: const BoxConstraints(minHeight: 44),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(child: ZText(title, variant: TextVariant.h2, header: true, maxLines: 1)),
          ?action,
        ],
      ),
    );
  }
}

class IconTile extends StatelessWidget {
  const IconTile({super.key, required this.icon, required this.fill, this.size = 44});
  final IconData icon;
  final Color fill;
  final double size;

  @override
  Widget build(BuildContext context) {
    final v = VolumeScope.of(context);
    return Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: fill,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: v.line, width: v.border),
      ),
      child: Icon(icon, size: (size * 0.45).roundToDouble(), color: v.fg),
    );
  }
}

class ZDivider extends StatelessWidget {
  const ZDivider({super.key});

  @override
  Widget build(BuildContext context) {
    final v = VolumeScope.of(context);
    return Container(height: 2, color: v.line.withValues(alpha: 0.12));
  }
}

/// A coloured band that runs under the status bar at the top of detail screens.
class HeaderBand extends StatelessWidget {
  const HeaderBand({super.key, required this.color, required this.child, this.height, this.padding = const EdgeInsets.fromLTRB(20, 8, 20, 20)});

  final Color color;
  final Widget child;

  /// Height below the status bar, or null to size to content.
  final double? height;
  final EdgeInsets padding;

  @override
  Widget build(BuildContext context) {
    final top = MediaQuery.paddingOf(context).top;
    return Container(
      height: height == null ? null : height! + top,
      padding: padding.copyWith(top: padding.top + top),
      decoration: BoxDecoration(
        color: color,
        border: const Border(bottom: BorderSide(color: Palette.ink, width: 3)),
      ),
      child: child,
    );
  }
}

/// A list of rows inside one surface, separated by hairlines.
List<Widget> separated(List<Widget> rows) => [
  for (var i = 0; i < rows.length; i++) ...[if (i > 0) const ZDivider(), rows[i]],
];
