import 'dart:async';

import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';

import '../data/models.dart';
import '../theme/tokens.dart';
import '../theme/type.dart';
import '../theme/volume.dart';
import 'async.dart';
import 'controls.dart';
import 'text.dart';

Future<void> openLink(BuildContext context, String url) async {
  final uri = Uri.tryParse(url);
  final opened = uri != null && await launchUrl(uri, mode: LaunchMode.externalApplication).catchError((_) => false);
  if (!opened && context.mounted) showMessage(context, "Couldn't open that link.", error: true);
}

/// fileType of the card the server posts into a DM when a call goes unanswered; fileName is AUDIO or VIDEO.
const missedCallFileType = 'missed_call';

/// "Missed voice call" with a call-back button, in place of a bubble's text.
class _MissedCall extends StatelessWidget {
  const _MissedCall({required this.message, this.onCallBack});
  final ChatMessage message;
  final void Function(bool video)? onCallBack;

  @override
  Widget build(BuildContext context) {
    final v = VolumeScope.of(context);
    final video = message.fileName == 'VIDEO';
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      spacing: 10,
      children: [
        Row(
          spacing: 10,
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: Palette.alert,
                shape: BoxShape.circle,
                border: Border.all(color: v.line, width: 2),
              ),
              child: Icon(video ? LucideIcons.videoOff : LucideIcons.phoneMissed, size: 18, color: Palette.ink),
            ),
            Flexible(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ZText(message.content, variant: TextVariant.h3, style: const TextStyle(fontSize: 15)),
                  ZText(message.isSelf ? 'No one picked up' : "Call back when you're free", variant: TextVariant.small, muted: true),
                ],
              ),
            ),
          ],
        ),
        if (onCallBack != null)
          ZButton(
            label: message.isSelf ? 'Call again' : 'Call back',
            icon: video ? LucideIcons.video : LucideIcons.phone,
            variant: ButtonVariant.live,
            size: ButtonSize.sm,
            onTap: () => onCallBack!(video),
          ),
      ],
    );
  }
}

class Bubble extends StatelessWidget {
  const Bubble({super.key, required this.message, this.showAuthor = false, this.onCallBack});

  final ChatMessage message;
  final bool showAuthor;

  /// Starts a call from a missed-call card; only DMs pass it.
  final void Function(bool video)? onCallBack;

  @override
  Widget build(BuildContext context) {
    final v = VolumeScope.of(context);
    final mine = message.isSelf;
    final author = message.sender;

    const big = Radius.circular(14);
    const small = Radius.circular(4);
    final shape = mine
        ? const BorderRadius.only(topLeft: big, topRight: small, bottomLeft: big, bottomRight: big)
        : const BorderRadius.only(topLeft: small, topRight: big, bottomLeft: big, bottomRight: big);
    final box = BoxDecoration(
      color: mine ? Palette.chat : v.card,
      borderRadius: shape,
      border: Border.all(color: v.line, width: v.border),
    );

    final file = message.fileUrl;
    final Widget content = message.deleted
        ? Container(
            padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 10),
            decoration: box.copyWith(color: v.canvas),
            child: ZText(
              'Message deleted',
              variant: TextVariant.small,
              muted: true,
              style: const TextStyle(fontStyle: FontStyle.italic),
            ),
          )
        : Container(
            padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 10),
            decoration: box,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              spacing: 8,
              children: [
                if (message.fileType == missedCallFileType)
                  _MissedCall(message: message, onCallBack: onCallBack)
                else if (message.content.isNotEmpty)
                  ZText(message.content, style: const TextStyle(fontSize: 15, height: 1.4)),
                if (file != null)
                  Semantics(
                    button: true,
                    label: 'Open ${message.fileName ?? 'attachment'}',
                    child: GestureDetector(
                      onTap: () => openLink(context, file),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        spacing: 8,
                        children: [
                          Icon(LucideIcons.paperclip, size: 16, color: v.fg),
                          Flexible(
                            child: ZText(
                              message.fileName ?? 'Attachment',
                              variant: TextVariant.h3,
                              maxLines: 1,
                              style: const TextStyle(fontSize: 14, decoration: TextDecoration.underline),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          );

    final timeStyle = mono(FontWeight.w500, 10, 14).copyWith(color: v.fgMuted);
    final time = clockTime(message.at);
    final status = message.pending ? ' · Sending' : (mine ? ' · Sent' : '');
    return Semantics(
      label:
          '${mine ? 'You' : author.name}, $time: ${message.deleted ? 'deleted message' : message.content}${file != null ? ', attachment ${message.fileName ?? ''}' : ''}',
      // Keep the attachment link and the call-back button reachable.
      excludeSemantics: file == null && message.fileType != missedCallFileType,
      child: Align(
        alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
        child: FractionallySizedBox(
          widthFactor: 0.85,
          alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
          child: Opacity(
            opacity: message.pending ? 0.6 : 1,
            child: Row(
              mainAxisAlignment: mine ? MainAxisAlignment.end : MainAxisAlignment.start,
              crossAxisAlignment: CrossAxisAlignment.start,
              spacing: 10,
              children: [
                if (showAuthor && !mine) Avatar.of(author, size: 34),
                Flexible(
                  child: Column(
                    crossAxisAlignment: mine ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                    children: [
                      if (showAuthor && !mine)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 3),
                          child: Text.rich(
                            TextSpan(
                              children: [
                                TextSpan(text: '${author.name} ', style: zStyle(context, TextVariant.h3).copyWith(fontSize: 13)),
                                TextSpan(text: time, style: timeStyle),
                              ],
                            ),
                          ),
                        ),
                      content,
                      if (!showAuthor || mine)
                        Padding(
                          padding: const EdgeInsets.only(top: 3),
                          child: Text('$time$status', style: timeStyle),
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class DayChip extends StatelessWidget {
  const DayChip({super.key, required this.label});
  final String label;

  @override
  Widget build(BuildContext context) {
    final v = VolumeScope.of(context);
    return Center(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
        decoration: BoxDecoration(
          color: v.card,
          borderRadius: BorderRadius.circular(99),
          border: Border.all(color: v.line, width: 2),
        ),
        child: ZText(label, variant: TextVariant.label),
      ),
    );
  }
}

String dayLabel(DateTime d) {
  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);
  final day = DateTime(d.year, d.month, d.day);
  final diff = today.difference(day).inDays;
  if (diff == 0) return 'Today';
  if (diff == 1) return 'Yesterday';
  if (diff < 7) return weekdayShort(d);
  return '${monthShort(d)} ${d.day}${d.year != now.year ? ', ${d.year}' : ''}';
}

/// A live message thread: loads, polls for new messages, and sends with optimistic bubbles.
class ChatThread extends StatefulWidget {
  const ChatThread({
    super.key,
    required this.load,
    required this.send,
    required this.placeholder,
    required this.emptyText,
    this.showAuthor = false,
    this.onSeen,
    this.header,
    this.pollEvery = const Duration(seconds: 4),
    this.onCallBack,
  });

  final Future<List<ChatMessage>> Function() load;
  final Future<ChatMessage> Function(String text) send;
  final String placeholder;
  final String emptyText;
  final bool showAuthor;

  /// Called after messages load, to mark the thread read.
  final Future<void> Function()? onSeen;

  /// Fixed content above the messages (a live call banner).
  final Widget? header;
  final Duration pollEvery;

  /// Calls back from a missed-call card.
  final void Function(bool video)? onCallBack;

  @override
  State<ChatThread> createState() => _ChatThreadState();
}

class _ChatThreadState extends State<ChatThread> {
  List<ChatMessage>? _messages;
  final List<ChatMessage> _pending = [];
  Object? _error;
  Timer? _poll;
  int _lastSeenCount = -1;

  @override
  void initState() {
    super.initState();
    unawaited(_refresh());
    _poll = Timer.periodic(widget.pollEvery, (_) => unawaited(_refresh(quiet: true)));
  }

  @override
  void dispose() {
    _poll?.cancel();
    super.dispose();
  }

  Future<void> _refresh({bool quiet = false}) async {
    try {
      final messages = await widget.load();
      if (!mounted) return;
      setState(() {
        _messages = messages;
        _error = null;
      });
      if (messages.length != _lastSeenCount) {
        _lastSeenCount = messages.length;
        unawaited(widget.onSeen?.call().catchError((_) {}));
      }
    } catch (error) {
      if (!mounted) return;
      if (!quiet || _messages == null) setState(() => _error = error);
    }
  }

  Future<bool> _send(String text) async {
    final temp = ChatMessage(
      id: 'pending-${DateTime.now().microsecondsSinceEpoch}',
      senderId: '',
      senderName: 'You',
      content: text,
      at: DateTime.now(),
      isSelf: true,
      pending: true,
    );
    setState(() => _pending.add(temp));
    try {
      final saved = await widget.send(text);
      if (!mounted) return true;
      setState(() {
        _pending.remove(temp);
        final list = [...?_messages];
        if (!list.any((m) => m.id == saved.id)) list.add(saved);
        _messages = list;
      });
      return true;
    } catch (error) {
      if (!mounted) return false;
      setState(() => _pending.remove(temp));
      showError(context, error);
      return false;
    }
  }

  @override
  Widget build(BuildContext context) {
    final messages = _messages;
    final Widget list;
    if (messages == null) {
      list = _error != null ? ErrorView(error: _error, onRetry: _refresh) : const LoadingView(label: 'Loading messages');
    } else {
      final all = [...messages, ..._pending];
      final items = <Widget>[];
      DateTime? lastDay;
      for (final m in all) {
        final day = DateTime(m.at.year, m.at.month, m.at.day);
        if (lastDay != day) {
          items.add(DayChip(label: dayLabel(m.at)));
          lastDay = day;
        }
        items.add(Bubble(message: m, showAuthor: widget.showAuthor, onCallBack: widget.onCallBack));
      }
      if (all.isEmpty) items.add(ZText(widget.emptyText, variant: TextVariant.small, muted: true, align: TextAlign.center));
      // Bottom-up so the newest message stays in view as the thread grows.
      list = ListView.separated(
        reverse: true,
        padding: const EdgeInsets.all(16),
        keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
        itemCount: items.length,
        separatorBuilder: (_, _) => const SizedBox(height: 12),
        itemBuilder: (_, i) => items[items.length - 1 - i],
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ?widget.header,
        Expanded(child: list),
        Composer(placeholder: widget.placeholder, onSend: _send, enabled: messages != null),
      ],
    );
  }
}

class Composer extends StatefulWidget {
  const Composer({super.key, required this.placeholder, required this.onSend, this.enabled = true});
  final String placeholder;
  final Future<bool> Function(String text) onSend;
  final bool enabled;

  @override
  State<Composer> createState() => _ComposerState();
}

class _ComposerState extends State<Composer> {
  final _draft = TextEditingController();
  final _focus = FocusNode();

  @override
  void initState() {
    super.initState();
    _draft.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _draft.dispose();
    _focus.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final text = _draft.text.trim();
    if (text.isEmpty || !widget.enabled) return;
    _draft.clear();
    _focus.requestFocus();
    // Put the text back if it didn't send, so nothing is lost.
    if (!await widget.onSend(text) && mounted && _draft.text.isEmpty) _draft.text = text;
  }

  @override
  Widget build(BuildContext context) {
    final v = VolumeScope.of(context);
    final ready = widget.enabled && _draft.text.trim().isNotEmpty;
    final edge = OutlineInputBorder(
      borderRadius: BorderRadius.circular(10),
      borderSide: BorderSide(color: v.line, width: v.border),
    );
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
      decoration: BoxDecoration(
        color: v.card,
        border: Border(
          top: BorderSide(color: v.line, width: v.border),
        ),
      ),
      child: Row(
        spacing: 8,
        children: [
          Expanded(
            child: TextField(
              controller: _draft,
              focusNode: _focus,
              onSubmitted: (_) => _send(),
              textInputAction: TextInputAction.send,
              minLines: 1,
              maxLines: 4,
              maxLength: 4000,
              textCapitalization: TextCapitalization.sentences,
              style: grotesk(FontWeight.w500, 16, 22).copyWith(color: v.fg),
              cursorColor: v.fg,
              decoration: InputDecoration(
                isDense: true,
                counterText: '',
                filled: true,
                fillColor: Palette.white,
                hintText: widget.placeholder,
                hintStyle: grotesk(FontWeight.w500, 16, 22).copyWith(color: v.fgMuted),
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
                enabledBorder: edge,
                focusedBorder: edge,
                border: edge,
              ),
            ),
          ),
          Semantics(
            button: true,
            enabled: ready,
            label: 'Send',
            child: GestureDetector(
              onTap: ready ? _send : null,
              child: Container(
                width: 48,
                height: 48,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: ready ? Palette.chat : v.canvas,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: v.line, width: v.border),
                ),
                child: Icon(LucideIcons.send, size: 20, color: v.fg),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
