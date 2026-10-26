import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/models.dart';
import '../../data/sample.dart';
import '../../state/app_state.dart';
import '../../theme/tokens.dart';
import '../../widgets/widgets.dart';

void _open(BuildContext context, Conversation c) {
  if (c.kind == ConversationKind.people) {
    context.push('/dm/${c.refId}');
  } else if (c.title == 'internships') {
    context.push('/jobs');
  } else {
    context.push('/group-room/${c.refId}');
  }
}

class MessagesScreen extends StatefulWidget {
  const MessagesScreen({super.key});

  @override
  State<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends State<MessagesScreen> {
  ConversationKind _tab = ConversationKind.people;
  String _query = '';

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final q = _query.trim().toLowerCase();
    final rows = conversations.where((c) => c.kind == _tab && (q.isEmpty || c.title.toLowerCase().contains(q))).toList();

    return Screen(
      tabBar: true,
      children: [
        const Row(
          spacing: 12,
          children: [
            Expanded(child: ZText('Messages', variant: TextVariant.title, header: true)),
            ZBadge(label: 'Live', tone: Tone.live),
            ZIconButton(icon: LucideIcons.pencil, label: 'New message', tone: Tone.chat, href: '/partners'),
          ],
        ),
        Segmented<ConversationKind>(
          label: 'Conversation type',
          tone: Tone.chat,
          value: _tab,
          onChanged: (k) => setState(() => _tab = k),
          options: const [
            SegmentOption(ConversationKind.people, 'People'),
            SegmentOption(ConversationKind.groups, 'Groups'),
            SegmentOption(ConversationKind.channels, 'Channels'),
          ],
        ),
        SearchBox(placeholder: 'Search', label: 'Search conversations', shadow: false, onChanged: (v) => setState(() => _query = v)),
        Surface(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (rows.isEmpty)
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: ZText('No conversations found.', variant: TextVariant.small, muted: true, align: TextAlign.center),
                ),
              ...separated([for (final c in rows) _ConversationRow(c: c, app: app)]),
            ],
          ),
        ),
      ],
    );
  }
}

class _ConversationRow extends StatelessWidget {
  const _ConversationRow({required this.c, required this.app});
  final Conversation c;
  final AppState app;

  @override
  Widget build(BuildContext context) {
    final sent = c.kind == ConversationKind.people ? app.dms[c.refId]?.lastOrNull : null;
    final last = sent != null && sent.authorId == 'me' && sent.id.startsWith('local-') ? 'You: ${sent.text}' : c.last;
    return Semantics(
      button: true,
      label: '${c.title}. $last. ${c.time}${c.unread > 0 ? '. ${c.unread} unread' : ''}',
      excludeSemantics: true,
      child: InkWell(
        onTap: () => _open(context, c),
        highlightColor: Palette.paper,
        splashColor: Palette.paper,
        child: Container(
          constraints: const BoxConstraints(minHeight: 72),
          padding: const EdgeInsets.all(12),
          child: Row(
            spacing: 12,
            children: [
              Avatar(initials: c.initials, color: c.color, size: 52, square: c.kind != ConversationKind.people),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  spacing: 2,
                  children: [
                    Row(
                      spacing: 8,
                      children: [
                        Expanded(child: ZText(c.kind == ConversationKind.channels ? '# ${c.title}' : c.title, variant: TextVariant.h3, maxLines: 1)),
                        ZText(c.time, variant: TextVariant.mono, muted: true, style: const TextStyle(fontSize: 11)),
                      ],
                    ),
                    Row(
                      spacing: 8,
                      children: [
                        Expanded(child: ZText(last, variant: TextVariant.small, muted: true, maxLines: 1)),
                        if (c.unread > 0) CountBadge(value: formatBadge(c.unread)!, tone: Tone.chat),
                      ],
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
