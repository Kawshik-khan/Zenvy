import 'package:flutter/widgets.dart';

import 'tokens.dart';

/// Switches every widget inside to the loud or quiet volume, like `.quiet` on the web.
class VolumeScope extends InheritedWidget {
  const VolumeScope({super.key, required this.volume, required super.child});

  final Volume volume;

  static VolumeTokens of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<VolumeScope>();
    return VolumeTokens.of(scope?.volume ?? Volume.loud);
  }

  @override
  bool updateShouldNotify(VolumeScope oldWidget) => oldWidget.volume != volume;
}
