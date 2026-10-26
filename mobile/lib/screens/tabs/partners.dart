import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/models.dart';
import '../../data/sample.dart';
import '../../state/app_state.dart';
import '../../theme/tokens.dart';
import '../../theme/type.dart';
import '../../widgets/widgets.dart';

const _filters = ['Same major', 'Evenings', 'Exam prep', 'Pair programming'];

bool _passes(Partner p, String f) => switch (f) {
  'Same major' => p.major == 'Computer Science',
  'Evenings' => RegExp('night|eve|PM', caseSensitive: false).hasMatch(p.availability ?? ''),
  'Exam prep' => p.studyStyle == 'Exam prep' || p.interests.contains('Exam prep'),
  _ => p.studyStyle == f,
};

class PartnersScreen extends StatefulWidget {
  const PartnersScreen({super.key});

  @override
  State<PartnersScreen> createState() => _PartnersScreenState();
}

class _PartnersScreenState extends State<PartnersScreen> {
  String _query = '';
  final Set<String> _active = {};

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final q = _query.trim().toLowerCase();
    final list =
        partners
            .where((p) => q.isEmpty || [p.name, p.major, ...p.interests].any((s) => s.toLowerCase().contains(q)))
            .where((p) => _active.every((f) => _passes(p, f)))
            .toList()
          ..sort((a, b) => b.score - a.score);

    return Screen(
      tabBar: true,
      children: [
        const Row(
          spacing: 12,
          children: [
            Expanded(child: ZText('Find partners', variant: TextVariant.title, header: true)),
            ZButton(label: 'Post ad', variant: ButtonVariant.match, size: ButtonSize.sm, icon: LucideIcons.plus, href: '/post-ad'),
          ],
        ),
        SearchBox(placeholder: 'Search by name, course or skill', label: 'Search people', onChanged: (v) => setState(() => _query = v)),
        ChipRail(
          children: [
            for (final f in _filters)
              ZChip(label: f, selected: _active.contains(f), onTap: () => setState(() => _active.contains(f) ? _active.remove(f) : _active.add(f))),
          ],
        ),
        SectionLabel('${list.length} classmates · best match first'),
        if (list.isEmpty)
          Surface(
            dashed: true,
            shadow: ShadowSize.none,
            padding: const EdgeInsets.all(24),
            child: Column(
              spacing: 6,
              children: [
                const ZText('No one matches those filters', variant: TextVariant.h3),
                ZText('Try removing a filter or posting a study ad so people can find you.', variant: TextVariant.small, muted: true, align: TextAlign.center),
              ],
            ),
          ),
        for (final p in list) _PartnerCard(partner: p, app: app),
      ],
    );
  }
}

class _PartnerCard extends StatelessWidget {
  const _PartnerCard({required this.partner, required this.app});
  final Partner partner;
  final AppState app;

  @override
  Widget build(BuildContext context) {
    final p = partner;
    final connected = app.connected(p.id);
    final requested = app.flag(Flag.requested, p.id);
    return Surface(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: 10,
        children: [
          Row(
            spacing: 12,
            children: [
              Avatar(initials: p.initials, color: p.color, size: 52),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ZText(p.name, variant: TextVariant.h3, style: const TextStyle(fontSize: 16)),
                    ZText('${shortMajor(p.major)} · Semester ${p.semester} · ${p.college}', variant: TextVariant.small, muted: true),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                decoration: BoxDecoration(
                  color: Palette.match,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Palette.ink, width: 3),
                ),
                child: Column(
                  children: [
                    ZText('${p.score}%', variant: TextVariant.mono),
                    Text('MATCH', style: mono(FontWeight.w500, 9, 11).copyWith(color: Palette.ink)),
                  ],
                ),
              ),
            ],
          ),
          Text.rich(
            TextSpan(
              children: [
                TextSpan(
                  text: 'Why you match: ',
                  style: zStyle(context, TextVariant.small).copyWith(fontWeight: FontWeight.w700),
                ),
                TextSpan(text: p.why),
              ],
            ),
            style: zStyle(context, TextVariant.small),
          ),
          Wrap(spacing: 6, runSpacing: 6, children: [for (final t in p.interests.take(3)) ZBadge(label: t)]),
          Row(
            spacing: 10,
            children: [
              Expanded(
                child: connected
                    ? ZButton(label: 'Message', variant: ButtonVariant.chat, size: ButtonSize.sm, href: '/dm/${p.id}')
                    : ZButton(
                        label: requested ? 'Requested' : 'Connect',
                        variant: ButtonVariant.match,
                        size: ButtonSize.sm,
                        settled: requested,
                        onTap: () => app.toggle(Flag.requested, p.id),
                        semanticLabel: requested ? 'Cancel request to ${p.name}' : 'Connect with ${p.name}',
                      ),
              ),
              Expanded(
                child: ZButton(label: 'View profile', variant: ButtonVariant.secondary, size: ButtonSize.sm, onTap: () => context.push('/partner/${p.id}')),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
