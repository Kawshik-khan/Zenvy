import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/sample.dart';
import '../../state/app_state.dart';
import '../../theme/tokens.dart';
import '../../util/dialogs.dart';
import '../../widgets/widgets.dart';

const _filters = ['For you', 'CSE', 'Exam prep', 'Projects'];

class GroupsScreen extends StatefulWidget {
  const GroupsScreen({super.key});

  @override
  State<GroupsScreen> createState() => _GroupsScreenState();
}

class _GroupsScreenState extends State<GroupsScreen> {
  String _filter = 'For you';

  bool _matches(String course, String description) => switch (_filter) {
    'For you' => true,
    'CSE' => course.startsWith('CSE'),
    'Exam prep' => RegExp('help|question', caseSensitive: false).hasMatch(description),
    _ => RegExp('review|portfolio', caseSensitive: false).hasMatch(description + course),
  };

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final mine = groups.where((g) => app.flag(Flag.joinedGroups, g.id)).toList();
    final discover = groups.where((g) => !g.joined && _matches(g.course, g.description)).toList();

    return Screen(
      header: TopBar(
        title: 'Study groups',
        fallback: '/more',
        right: ZButton(
          label: 'New',
          variant: ButtonVariant.chat,
          size: ButtonSize.sm,
          icon: LucideIcons.plus,
          onTap: () => notify(context, 'Create a group', "Group creation opens here once it's connected to the server."),
        ),
      ),
      children: [
        SectionLabel('Your groups · ${mine.length}'),
        ChipRail(
          gap: 12,
          children: [
            for (final g in mine)
              SizedBox(
                width: 152,
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Surface(
                    onTap: () => context.push('/groups/${g.id}'),
                    semanticLabel: '${g.name}, ${g.memberIds.length} members',
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      spacing: 8,
                      children: [
                        Avatar(initials: g.initials, color: g.color, size: 52, square: true),
                        ZText(g.name, variant: TextVariant.h3, maxLines: 2),
                        ZText(
                          '${g.memberIds.length} members${g.status != null ? ' · ${g.status}' : ''}',
                          variant: TextVariant.small,
                          muted: true,
                          style: const TextStyle(fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
          ],
        ),
        const SectionLabel('Discover'),
        ChipRail(
          children: [for (final f in _filters) ZChip(label: f, tone: Tone.chat, selected: _filter == f, onTap: () => setState(() => _filter = f))],
        ),
        Surface(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (discover.isEmpty)
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: ZText('No groups in this category yet.', variant: TextVariant.small, muted: true, align: TextAlign.center),
                ),
              ...separated([
                for (final g in discover)
                  Padding(
                    padding: const EdgeInsets.all(12),
                    child: Row(
                      spacing: 12,
                      children: [
                        Avatar(initials: g.initials, color: g.color, size: 52, square: true),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              ZText(g.name, variant: TextVariant.h3),
                              ZText(
                                '${g.memberIds.length + (app.flag(Flag.joinedGroups, g.id) ? 1 : 0)} members · ${g.course}',
                                variant: TextVariant.small,
                                muted: true,
                                style: const TextStyle(fontSize: 12),
                              ),
                            ],
                          ),
                        ),
                        ZButton(
                          label: app.flag(Flag.joinedGroups, g.id) ? 'Joined' : 'Join',
                          variant: ButtonVariant.chat,
                          size: ButtonSize.sm,
                          settled: app.flag(Flag.joinedGroups, g.id),
                          onTap: () => app.toggle(Flag.joinedGroups, g.id),
                          semanticLabel: app.flag(Flag.joinedGroups, g.id) ? 'Leave ${g.name}' : 'Join ${g.name}',
                        ),
                      ],
                    ),
                  ),
              ]),
            ],
          ),
        ),
      ],
    );
  }
}
