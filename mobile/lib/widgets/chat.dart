import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../data/models.dart';
import '../data/sample.dart';
import '../theme/tokens.dart';
import '../theme/type.dart';
import '../theme/volume.dart';
import '../util/dialogs.dart';
import 'controls.dart';
import 'text.dart';

const kindFill = {FileKind.pdf: Palette.alert, FileKind.img: Palette.career, FileKind.cpp: Palette.live, FileKind.link: Palette.focus};

class Bubble extends StatelessWidget {
  const Bubble({super.key, required this.message, this.showAuthor = false});

  final ChatMessage message;
  final bool showAuthor;

  @override
  Widget build(BuildContext context) {
    final v = VolumeScope.of(context);
    final mine = message.authorId == 'me';
    final author = person(message.authorId);

    if (message.system) {
      return Center(
        child: ZText(message.text ?? '', variant: TextVariant.small, muted: true, style: const TextStyle(fontSize: 12)),
      );
    }

    const big = Radius.circular(14);
    const small = Radius.circular(4);
    final shape = mine
        ? const BorderRadius.only(topLeft: big, topRight: small, bottomLeft: big, bottomRight: big)
        : const BorderRadius.only(topLeft: small, topRight: big, bottomLeft: big, bottomRight: big);
    BoxDecoration box([Color? fill]) => BoxDecoration(
      color: fill ?? (mine ? Palette.chat : v.card),
      borderRadius: shape,
      border: Border.all(color: v.line, width: v.border),
    );

    final Widget content;
    final file = message.file;
    final notes = message.notes;
    if (file != null) {
      content = Container(
        width: 250,
        padding: const EdgeInsets.all(10),
        decoration: box(),
        child: Row(
          spacing: 10,
          children: [
            Container(
              width: 40,
              height: 44,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: kindFill[file.kind],
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: v.line, width: 2),
              ),
              child: ZText(file.kind.label, variant: TextVariant.mono, style: const TextStyle(fontSize: 10)),
            ),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ZText(file.name, variant: TextVariant.h3, maxLines: 1, style: const TextStyle(fontSize: 14)),
                  ZText(file.size, variant: TextVariant.small, muted: true, style: const TextStyle(fontSize: 12)),
                ],
              ),
            ),
            ZIconButton(
              icon: LucideIcons.download,
              label: 'Download ${file.name}',
              shadow: false,
              onTap: () => notify(context, 'Download', 'Files open once chat attachments are connected to storage.'),
            ),
          ],
        ),
      );
    } else if (notes != null) {
      content = Container(
        padding: const EdgeInsets.all(12),
        decoration: box(Palette.softCard),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ZText(notes.title, variant: TextVariant.label),
            for (final it in notes.items) ZText('• $it', variant: TextVariant.small, style: const TextStyle(fontSize: 14, height: 1.5)),
          ],
        ),
      );
    } else {
      content = Container(
        padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 10),
        decoration: box(),
        child: ZText(message.text ?? '', style: const TextStyle(fontSize: 15, height: 1.4)),
      );
    }

    final timeStyle = mono(FontWeight.w500, 10, 14).copyWith(color: v.fgMuted);
    final spoken = message.text ?? file?.name ?? notes?.items.join('. ') ?? '';
    return Semantics(
      label: '${mine ? 'You' : author.name}, ${message.time}: $spoken',
      excludeSemantics: true,
      child: Align(
        alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
        child: FractionallySizedBox(
          widthFactor: 0.85,
          alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
          child: Row(
            mainAxisAlignment: mine ? MainAxisAlignment.end : MainAxisAlignment.start,
            crossAxisAlignment: CrossAxisAlignment.start,
            spacing: 10,
            children: [
              if (showAuthor && !mine) Avatar(initials: author.initials, color: author.color, size: 34),
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
                              TextSpan(text: message.time, style: timeStyle),
                            ],
                          ),
                        ),
                      ),
                    content,
                    if (!showAuthor || mine)
                      Padding(
                        padding: const EdgeInsets.only(top: 3),
                        child: Text('${message.time}${mine ? ' · Sent' : ''}', style: timeStyle),
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class TypingIndicator extends StatelessWidget {
  const TypingIndicator({super.key, required this.name});
  final String name;

  @override
  Widget build(BuildContext context) {
    final v = VolumeScope.of(context);
    return Semantics(
      liveRegion: true,
      child: Row(
        spacing: 8,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            decoration: BoxDecoration(
              color: v.card,
              borderRadius: BorderRadius.circular(99),
              border: Border.all(color: v.line, width: v.border),
            ),
            child: Row(
              spacing: 3,
              children: [
                for (final o in const [1.0, 0.6, 0.3])
                  Container(
                    width: 6,
                    height: 6,
                    decoration: BoxDecoration(
                      color: v.line.withValues(alpha: o),
                      shape: BoxShape.circle,
                    ),
                  ),
              ],
            ),
          ),
          ZText('$name is typing', variant: TextVariant.small, muted: true, style: const TextStyle(fontSize: 12)),
        ],
      ),
    );
  }
}

class Composer extends StatefulWidget {
  const Composer({super.key, required this.placeholder, required this.onSend});
  final String placeholder;
  final ValueChanged<String> onSend;

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

  void _send() {
    final text = _draft.text.trim();
    if (text.isEmpty) return;
    widget.onSend(text);
    _draft.clear();
    _focus.requestFocus();
  }

  @override
  Widget build(BuildContext context) {
    final v = VolumeScope.of(context);
    final ready = _draft.text.trim().isNotEmpty;
    final edge = OutlineInputBorder(
      borderRadius: BorderRadius.circular(10),
      borderSide: BorderSide(color: v.line, width: v.border),
    );
    return Container(
      padding: const EdgeInsets.all(12).copyWith(left: 14, right: 14),
      decoration: BoxDecoration(
        color: v.card,
        border: Border(
          top: BorderSide(color: v.line, width: v.border),
        ),
      ),
      child: Row(
        spacing: 8,
        children: [
          // Attachments go through app/actions/upload-chat-attachment.ts on the web; needs file_picker here.
          ZIconButton(
            icon: LucideIcons.paperclip,
            label: 'Attach a file',
            onTap: () => notify(context, 'Attach a file', 'Attachments need file_picker and the upload endpoint.'),
          ),
          Expanded(
            child: TextField(
              controller: _draft,
              focusNode: _focus,
              onSubmitted: (_) => _send(),
              textInputAction: TextInputAction.send,
              style: grotesk(FontWeight.w500, 16, 22).copyWith(color: v.fg),
              cursorColor: v.fg,
              decoration: InputDecoration(
                isDense: true,
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
