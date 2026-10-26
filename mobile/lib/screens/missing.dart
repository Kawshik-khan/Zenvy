import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// Unknown id in a deep link: bounce to a list screen on the next frame.
class Missing extends StatefulWidget {
  const Missing({super.key, required this.to});
  final String to;

  @override
  State<Missing> createState() => _MissingState();
}

class _MissingState extends State<Missing> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) context.go(widget.to);
    });
  }

  @override
  Widget build(BuildContext context) => const Scaffold();
}
