import 'package:flutter/material.dart';

import '../../widgets/widgets.dart';

/// Shown while the saved session is checked.
class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Screen(
      body: Stack(
        children: [
          GridBackground(),
          Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              spacing: 24,
              children: [
                Logo(size: 48),
                LoadingView(label: 'Opening Zenvy'),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
