import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart' show OverflowBoxFit;
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../theme/tokens.dart';
import '../theme/type.dart';
import 'surface.dart';

/// Search field drawn as a small hard-shadow surface.
class SearchBox extends StatelessWidget {
  const SearchBox({super.key, required this.placeholder, required this.label, required this.onChanged, this.shadow = true});

  final String placeholder;
  final String label;
  final ValueChanged<String> onChanged;
  final bool shadow;

  @override
  Widget build(BuildContext context) {
    return Surface(
      shadow: shadow ? ShadowSize.sm : ShadowSize.none,
      radius: 10,
      padding: const EdgeInsets.symmetric(horizontal: 14),
      child: Row(
        spacing: 10,
        children: [
          const Icon(LucideIcons.search, size: 20, color: Palette.ink),
          Expanded(
            child: Semantics(
              label: label,
              child: TextField(
                onChanged: onChanged,
                textInputAction: TextInputAction.search,
                style: grotesk(FontWeight.w500, 16, 22).copyWith(color: Palette.ink),
                cursorColor: Palette.ink,
                decoration: InputDecoration(
                  border: InputBorder.none,
                  hintText: placeholder,
                  hintStyle: grotesk(FontWeight.w500, 16, 22).copyWith(color: Palette.muted),
                  contentPadding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// A horizontally scrolling row of chips that bleeds to the screen edges.
class ChipRail extends StatelessWidget {
  const ChipRail({super.key, required this.children, this.gap = 8});
  final List<Widget> children;
  final double gap;

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.sizeOf(context).width;
    return OverflowBox(
      minWidth: width,
      maxWidth: width,
      fit: OverflowBoxFit.deferToChild,
      child: SizedBox(
        width: width,
        child: SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, spacing: gap, children: children),
        ),
      ),
    );
  }
}
