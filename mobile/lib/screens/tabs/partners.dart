import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/models.dart';
import '../../state/app_state.dart';
import '../../theme/tokens.dart';
import '../../theme/type.dart';
import '../../widgets/widgets.dart';
import '../partners/connect.dart';

const _filters = ['Not connected', 'Same major', 'Shared interests', 'Evenings'];

bool _passes(Person p, String f, Me? me) => switch (f) {
  'Not connected' => p.connection?.accepted != true,
  'Same major' => me?.major != null && p.major?.toLowerCase() == me!.major!.toLowerCase(),
  'Shared interests' => p.reasons.any((r) => r.contains('shared interest')),
  'Evenings' => RegExp('eve|night|late', caseSensitive: false).hasMatch(p.availability ?? ''),
  _ => true,
};

class PartnersScreen extends StatefulWidget {
  const PartnersScreen({super.key});

  @override
  State<PartnersScreen> createState() => _PartnersScreenState();
}

class _PartnersScreenState extends State<PartnersScreen> {
  String _query = '';
  Timer? _debounce;
  final Set<String> _active = {};
  final _loader = GlobalKey<LoaderState<({List<Person> partners, List<StudyAd> studyAds})>>();

  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }

  void _search(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 350), () => setState(() => _query = value.trim()));
  }

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final header = [
      const Row(
        spacing: 12,
        children: [
          Expanded(child: ZText('Find partners', variant: TextVariant.title, header: true)),
          ZButton(label: 'Post ad', variant: ButtonVariant.match, size: ButtonSize.sm, icon: LucideIcons.plus, href: '/post-ad'),
        ],
      ),
      SearchBox(placeholder: 'Search by name, course or skill', label: 'Search people', onChanged: _search),
      ChipRail(
        children: [
          for (final f in _filters)
            ZChip(label: f, selected: _active.contains(f), onTap: () => setState(() => _active.contains(f) ? _active.remove(f) : _active.add(f))),
        ],
      ),
    ];

    return Screen(
      tabBar: true,
      onRefresh: () async => _loader.currentState?.reload(),
      children: [
        ...header,
        Loader<({List<Person> partners, List<StudyAd> studyAds})>(
          key: _loader,
          reloadKey: _query,
          load: () => app.api.partners(query: _query),
          builder: (context, data, reload) {
            final list = data.partners.where((p) => _active.every((f) => _passes(p, f, app.me))).toList();
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              spacing: 16,
              children: [
                if (data.studyAds.isNotEmpty && _query.isEmpty) ...[
                  const SectionLabel('Study ads'),
                  for (final ad in data.studyAds.take(3)) _StudyAdCard(ad: ad, mine: ad.author.id == app.me?.id),
                ],
                SectionLabel(
                  _query.isEmpty ? '${list.length} classmates · best match first' : '${list.length} result${list.length == 1 ? '' : 's'} for “$_query”',
                ),
                if (list.isEmpty)
                  EmptyCard(
                    title: _query.isEmpty && _active.isEmpty ? 'No classmates to suggest yet' : 'No one matches that',
                    detail: 'Try removing a filter, or post a study ad so people can find you.',
                  ),
                for (final p in list) _PartnerCard(partner: p, reload: reload),
              ],
            );
          },
        ),
      ],
    );
  }
}

class _StudyAdCard extends StatelessWidget {
  const _StudyAdCard({required this.ad, required this.mine});
  final StudyAd ad;
  final bool mine;

  @override
  Widget build(BuildContext context) {
    return Surface(
      tone: Tone.focus,
      shadow: ShadowSize.sm,
      onTap: mine ? null : () => context.push('/partner/${ad.author.id}'),
      semanticLabel: '${ad.title}, posted by ${ad.author.name}',
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: 8,
        children: [
          Row(
            spacing: 10,
            children: [
              Avatar.of(ad.author, size: 36),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ZText(ad.title, variant: TextVariant.h3, maxLines: 2),
                    ZText('${mine ? 'You' : ad.author.name} · ${timeAgo(ad.createdAt)}', variant: TextVariant.small, style: const TextStyle(fontSize: 12)),
                  ],
                ),
              ),
            ],
          ),
          ZText(ad.description, variant: TextVariant.small, maxLines: 3),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              ZBadge(label: ad.subjects, tone: Tone.card),
              ZBadge(label: ad.availability, tone: Tone.card),
              ZBadge(label: ad.modeLabel, tone: Tone.card),
            ],
          ),
        ],
      ),
    );
  }
}

class _PartnerCard extends StatelessWidget {
  const _PartnerCard({required this.partner, required this.reload});
  final Person partner;
  final Future<void> Function() reload;

  @override
  Widget build(BuildContext context) {
    final p = partner;
    return Surface(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: 10,
        children: [
          Row(
            spacing: 12,
            children: [
              Avatar.of(p, size: 52),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ZText(p.name, variant: TextVariant.h3, style: const TextStyle(fontSize: 16)),
                    if (p.academicLine.isNotEmpty) ZText(p.academicLine, variant: TextVariant.small, muted: true, maxLines: 2),
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
          if (p.reasons.isNotEmpty)
            Text.rich(
              TextSpan(
                children: [
                  TextSpan(
                    text: 'Why you match: ',
                    style: zStyle(context, TextVariant.small).copyWith(fontWeight: FontWeight.w700),
                  ),
                  TextSpan(text: p.reasons.join(', ').toLowerCase()),
                ],
              ),
              style: zStyle(context, TextVariant.small),
            ),
          if (p.interests.isNotEmpty) Wrap(spacing: 6, runSpacing: 6, children: [for (final t in p.interests.take(3)) ZBadge(label: t)]),
          Row(
            spacing: 10,
            children: [
              Expanded(
                child: ConnectButton(person: p, onChanged: (_) => reload()),
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
