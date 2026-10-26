import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/sample.dart';
import '../../state/app_state.dart';
import '../../theme/tokens.dart';
import '../../util/dialogs.dart';
import '../../widgets/widgets.dart';

enum _Tab { browse, saved, applied }

const _filters = ['Internship', 'Remote', 'Part-time', 'Dhaka'];

class JobsScreen extends StatefulWidget {
  const JobsScreen({super.key, this.initialTab});
  final String? initialTab;

  @override
  State<JobsScreen> createState() => _JobsScreenState();
}

class _JobsScreenState extends State<JobsScreen> {
  late _Tab _tab = _Tab.values.where((t) => t.name == widget.initialTab).firstOrNull ?? _Tab.browse;
  final Set<String> _active = {};

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final savedCount = jobs.where((j) => app.flag(Flag.savedJobs, j.id)).length;
    final list = jobs
        .where(
          (j) => switch (_tab) {
            _Tab.saved => app.flag(Flag.savedJobs, j.id),
            _Tab.applied => app.flag(Flag.appliedJobs, j.id),
            _Tab.browse => true,
          },
        )
        .where((j) => _active.every((f) => j.tags.contains(f) || j.place.contains(f)))
        .toList();

    return Screen(
      header: TopBar(
        title: 'Jobs',
        fallback: '/more',
        right: ZButton(
          label: 'Post',
          variant: ButtonVariant.career,
          size: ButtonSize.sm,
          icon: LucideIcons.plus,
          onTap: () => notify(context, 'Post a job', 'Verified employers and clubs can post roles from the web dashboard.'),
        ),
      ),
      children: [
        Segmented<_Tab>(
          label: 'Job lists',
          tone: Tone.career,
          value: _tab,
          onChanged: (t) => setState(() => _tab = t),
          options: [const SegmentOption(_Tab.browse, 'Browse'), SegmentOption(_Tab.saved, 'Saved · $savedCount'), const SegmentOption(_Tab.applied, 'Applied')],
        ),
        ChipRail(
          children: [
            for (final f in _filters)
              ZChip(
                label: f,
                tone: Tone.career,
                selected: _active.contains(f),
                onTap: () => setState(() => _active.contains(f) ? _active.remove(f) : _active.add(f)),
              ),
          ],
        ),
        if (list.isEmpty)
          Surface(
            dashed: true,
            shadow: ShadowSize.none,
            padding: const EdgeInsets.all(24),
            child: Column(
              spacing: 6,
              children: [
                ZText(switch (_tab) {
                  _Tab.saved => 'No saved jobs',
                  _Tab.applied => 'No applications yet',
                  _Tab.browse => 'No jobs match',
                }, variant: TextVariant.h3),
                ZText(
                  _tab == _Tab.browse ? 'Try removing a filter.' : 'Jobs you save or apply to show up here.',
                  variant: TextVariant.small,
                  muted: true,
                  align: TextAlign.center,
                ),
              ],
            ),
          ),
        for (final j in list)
          Surface(
            onTap: () => context.push('/jobs/${j.id}'),
            semanticLabel: '${j.title} at ${j.company}. ${j.place}. ${j.pay}. Closes ${j.deadline}',
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              spacing: 10,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  spacing: 12,
                  children: [
                    Avatar(initials: j.initials, color: j.color, size: 48, square: true),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          ZText(j.title, variant: TextVariant.h3, style: const TextStyle(fontSize: 16)),
                          ZText('${j.company} · ${j.place}', variant: TextVariant.small, muted: true),
                        ],
                      ),
                    ),
                    ZIconButton(
                      icon: LucideIcons.bookmark,
                      label: app.flag(Flag.savedJobs, j.id) ? 'Remove ${j.title} from saved' : 'Save ${j.title}',
                      tone: app.flag(Flag.savedJobs, j.id) ? Tone.career : Tone.card,
                      selected: app.flag(Flag.savedJobs, j.id),
                      onTap: () => app.toggle(Flag.savedJobs, j.id),
                    ),
                  ],
                ),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    for (final t in j.tags) ZBadge(label: t),
                    if (app.flag(Flag.appliedJobs, j.id)) const ZBadge(label: 'Applied', tone: Tone.live),
                  ],
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    ZText(j.pay, variant: TextVariant.mono, style: const TextStyle(fontSize: 13)),
                    if (j.closesSoon)
                      const ZBadge(label: 'Closes in 2 days', tone: Tone.alert)
                    else
                      ZText(
                        'Closes ${j.deadline}',
                        variant: TextVariant.small,
                        muted: true,
                        style: const TextStyle(fontWeight: FontWeight.w500),
                      ),
                  ],
                ),
              ],
            ),
          ),
      ],
    );
  }
}
