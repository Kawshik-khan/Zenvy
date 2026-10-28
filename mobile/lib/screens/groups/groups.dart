import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/models.dart';
import '../../state/app_state.dart';
import '../../widgets/widgets.dart';

typedef _Groups = ({List<GroupCard> mine, List<GroupCard> discover});

class GroupsScreen extends StatefulWidget {
  const GroupsScreen({super.key});

  @override
  State<GroupsScreen> createState() => _GroupsScreenState();
}

class _GroupsScreenState extends State<GroupsScreen> {
  String _query = '';
  Timer? _debounce;
  final Set<String> _joining = {};
  final _loader = GlobalKey<LoaderState<_Groups>>();

  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }

  Future<void> _join(GroupCard g) async {
    final app = AppScope.read(context);
    setState(() => _joining.add(g.id));
    final ok = await attempt(context, () => app.api.setGroupMembership(g.id, join: true), success: 'Joined ${g.name}');
    if (!mounted) return;
    setState(() => _joining.remove(g.id));
    if (ok) app.touch();
  }

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    return Screen(
      header: const TopBar(
        title: 'Study groups',
        fallback: '/more',
        right: ZButton(label: 'New', variant: ButtonVariant.chat, size: ButtonSize.sm, icon: LucideIcons.plus, href: '/groups/new'),
      ),
      onRefresh: () async => _loader.currentState?.reload(),
      children: [
        SearchBox(
          placeholder: 'Search groups by name or subject',
          label: 'Search groups',
          onChanged: (v) {
            _debounce?.cancel();
            _debounce = Timer(const Duration(milliseconds: 350), () => setState(() => _query = v.trim()));
          },
        ),
        Loader<_Groups>(
          key: _loader,
          reloadKey: _query,
          load: () => app.api.groups(query: _query),
          builder: (context, data, _) => Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: 16,
            children: [
              if (_query.isEmpty) ...[
                SectionLabel('Your groups · ${data.mine.length}'),
                if (data.mine.isEmpty)
                  const EmptyCard(title: "You haven't joined a group", detail: 'Join one below or start your own.')
                else
                  ChipRail(
                    gap: 12,
                    children: [
                      for (final g in data.mine)
                        SizedBox(
                          width: 152,
                          child: Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: Surface(
                              onTap: () => context.push('/groups/${g.id}'),
                              semanticLabel: '${g.name}, ${g.memberCount} members',
                              padding: const EdgeInsets.all(12),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                spacing: 8,
                                children: [
                                  Avatar(initials: g.initials, color: g.color, size: 52, square: true),
                                  ZText(g.name, variant: TextVariant.h3, maxLines: 2),
                                  ZText(
                                    '${g.memberCount} members${g.myRole == 'ADMIN' ? ' · Admin' : ''}',
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
              ],
              SectionLabel(_query.isEmpty ? 'Discover' : 'Results for “$_query”'),
              if (data.discover.isEmpty)
                EmptyCard(
                  title: _query.isEmpty ? 'No other groups yet' : 'No groups match that',
                  detail: 'Start one for your course and invite classmates.',
                  action: const ZButton(label: 'Create a group', variant: ButtonVariant.chat, size: ButtonSize.sm, href: '/groups/new'),
                )
              else
                Surface(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: separated([
                      for (final g in data.discover)
                        InkWell(
                          onTap: () => context.push('/groups/${g.id}'),
                          child: Padding(
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
                                        [g.subject, '${g.memberCount} members'].whereType<String>().join(' · '),
                                        variant: TextVariant.small,
                                        muted: true,
                                        style: const TextStyle(fontSize: 12),
                                      ),
                                      if (g.reasons.isNotEmpty) ZText(g.reasons.first, variant: TextVariant.small, style: const TextStyle(fontSize: 12)),
                                    ],
                                  ),
                                ),
                                ZButton(
                                  label: 'Join',
                                  variant: ButtonVariant.chat,
                                  size: ButtonSize.sm,
                                  disabled: _joining.contains(g.id),
                                  semanticLabel: 'Join ${g.name}',
                                  onTap: () => _join(g),
                                ),
                              ],
                            ),
                          ),
                        ),
                    ]),
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }
}
