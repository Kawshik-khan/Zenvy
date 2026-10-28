import 'dart:async';

import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../api/client.dart';
import '../state/app_state.dart';
import '../theme/tokens.dart';
import '../theme/type.dart';
import '../theme/volume.dart';
import 'controls.dart';
import 'surface.dart';
import 'text.dart';

/// Loads data from the server and shows a spinner, an error with retry, or the result.
/// Reloads quietly (keeping what's on screen) whenever [AppState.touch] reports a change.
class Loader<T> extends StatefulWidget {
  const Loader({super.key, required this.load, required this.builder, this.frame, this.reloadKey});

  /// Reloads when this changes (a search query, a selected tab).
  final Object? reloadKey;

  final Future<T> Function() load;
  final Widget Function(BuildContext context, T data, Future<void> Function() reload) builder;

  /// Wraps the loading and error states (for example in the screen's header), so the
  /// screen keeps its chrome while data loads.
  final Widget Function(BuildContext context, Widget body)? frame;

  @override
  State<Loader<T>> createState() => LoaderState<T>();
}

class LoaderState<T> extends State<Loader<T>> {
  T? _data;
  Object? _error;
  bool _loading = true;
  int _revision = -1;
  int _request = 0;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final revision = AppScope.of(context).revision;
    if (revision != _revision) {
      _revision = revision;
      unawaited(reload());
    }
  }

  @override
  void didUpdateWidget(Loader<T> oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.reloadKey != widget.reloadKey) unawaited(reload());
  }

  Future<void> reload() async {
    final request = ++_request;
    if (_data == null) setState(() => _loading = true);
    try {
      final data = await widget.load();
      if (!mounted || request != _request) return;
      setState(() {
        _data = data;
        _error = null;
        _loading = false;
      });
    } catch (error) {
      if (!mounted || request != _request) return;
      setState(() {
        _error = error;
        _loading = false;
      });
      // Keep stale data on a failed background refresh, but say so.
      if (_data != null) showError(context, error);
    }
  }

  @override
  Widget build(BuildContext context) {
    final data = _data;
    if (data != null) return widget.builder(context, data, reload);
    final body = _loading ? const LoadingView() : ErrorView(error: _error, onRetry: reload);
    return widget.frame?.call(context, body) ?? body;
  }
}

class LoadingView extends StatelessWidget {
  const LoadingView({super.key, this.label = 'Loading'});
  final String label;

  @override
  Widget build(BuildContext context) {
    final v = VolumeScope.of(context);
    return Semantics(
      label: label,
      liveRegion: true,
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: SizedBox(width: 32, height: 32, child: CircularProgressIndicator(strokeWidth: 3, color: v.line)),
        ),
      ),
    );
  }
}

String errorMessage(Object? error) => error is ApiException ? error.message : 'Something went wrong. Try again.';

class ErrorView extends StatelessWidget {
  const ErrorView({super.key, required this.error, required this.onRetry});
  final Object? error;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final offline = error is ApiException && (error as ApiException).offline;
    final timedOut = error is ApiException && (error as ApiException).timedOut;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Surface(
          dashed: true,
          shadow: ShadowSize.none,
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            spacing: 10,
            children: [
              Icon(offline ? LucideIcons.wifiOff : LucideIcons.triangleAlert, size: 28, color: VolumeScope.of(context).fg),
              ZText(
                offline
                    ? "You're offline"
                    : timedOut
                    ? 'Taking too long'
                    : "Couldn't load this",
                variant: TextVariant.h3,
                align: TextAlign.center,
              ),
              ZText(errorMessage(error), variant: TextVariant.small, muted: true, align: TextAlign.center),
              ZButton(label: 'Try again', variant: ButtonVariant.secondary, size: ButtonSize.sm, icon: LucideIcons.rotateCcw, onTap: onRetry),
            ],
          ),
        ),
      ),
    );
  }
}

/// A plain empty state for lists.
class EmptyCard extends StatelessWidget {
  const EmptyCard({super.key, required this.title, this.detail, this.action});
  final String title;
  final String? detail;
  final Widget? action;

  @override
  Widget build(BuildContext context) => Surface(
    dashed: true,
    shadow: ShadowSize.none,
    padding: const EdgeInsets.all(24),
    child: Column(
      spacing: 6,
      children: [
        ZText(title, variant: TextVariant.h3, align: TextAlign.center),
        if (detail != null) ZText(detail!, variant: TextVariant.small, muted: true, align: TextAlign.center),
        if (action != null) Padding(padding: const EdgeInsets.only(top: 6), child: action!),
      ],
    ),
  );
}

void showMessage(BuildContext context, String message, {bool error = false}) {
  final messenger = ScaffoldMessenger.maybeOf(context);
  if (messenger == null) return;
  messenger
    ..hideCurrentSnackBar()
    ..showSnackBar(
      SnackBar(
        behavior: SnackBarBehavior.floating,
        backgroundColor: error ? Palette.alert : Palette.ink,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(Radii.md),
          side: const BorderSide(color: Palette.ink, width: 2),
        ),
        content: Text(message, style: grotesk(FontWeight.w600, 14, 20).copyWith(color: error ? Palette.ink : Palette.paper)),
      ),
    );
}

void showError(BuildContext context, Object error) => showMessage(context, errorMessage(error), error: true);

/// Runs a server call from a button: shows the error if it fails, and returns whether it worked.
Future<bool> attempt(BuildContext context, Future<void> Function() run, {String? success}) async {
  try {
    await run();
    if (success != null && context.mounted) showMessage(context, success);
    return true;
  } catch (error) {
    if (context.mounted) showError(context, error);
    return false;
  }
}

/// "Just now", "12 min ago", "3 h ago", "Yesterday", "Mon", "Oct 20".
String timeAgo(DateTime? at, {DateTime? now}) {
  if (at == null) return '';
  final n = now ?? DateTime.now();
  final diff = n.difference(at);
  if (diff.inMinutes < 1) return 'Just now';
  if (diff.inMinutes < 60) return '${diff.inMinutes} min ago';
  if (diff.inHours < 24 && n.day == at.day) return '${diff.inHours} h ago';
  if (diff.inDays < 2 && n.difference(DateTime(at.year, at.month, at.day)).inDays <= 1) return 'Yesterday';
  if (diff.inDays < 7) return weekdayShort(at);
  return '${monthShort(at)} ${at.day}';
}

/// "6:12 PM".
String clockTime(DateTime at) {
  final h = at.hour % 12 == 0 ? 12 : at.hour % 12;
  return '$h:${at.minute.toString().padLeft(2, '0')} ${at.hour < 12 ? 'AM' : 'PM'}';
}

/// Short time for list rows: the clock today, otherwise the day.
String listTime(DateTime? at) {
  if (at == null) return '';
  final now = DateTime.now();
  if (at.year == now.year && at.month == now.month && at.day == now.day) return clockTime(at);
  return timeAgo(at, now: now);
}

const _weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const _months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

String weekdayShort(DateTime d) => _weekdays[d.weekday - 1];
String monthShort(DateTime d) => _months[d.month - 1];
