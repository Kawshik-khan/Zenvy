import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../api/config.dart';
import '../../data/models.dart';
import '../../state/app_state.dart';
import '../../theme/tokens.dart';
import '../../util/dialogs.dart';
import '../../widgets/widgets.dart';

const _types = ['INTERNSHIP', 'JOB', 'PART_TIME', 'REFERRAL'];
const _modes = ['REMOTE', 'HYBRID', 'ONSITE'];

class JobsScreen extends StatefulWidget {
  const JobsScreen({super.key, this.initialTab});
  final String? initialTab;

  @override
  State<JobsScreen> createState() => _JobsScreenState();
}

class _JobsScreenState extends State<JobsScreen> {
  late String _tab = const {'browse', 'saved', 'forYou'}.contains(widget.initialTab) ? widget.initialTab! : 'browse';
  String? _type;
  String? _mode;
  String _query = '';
  Timer? _debounce;
  final _loader = GlobalKey<LoaderState<JobFeed>>();

  // Jobs is a tab now, so its state survives a `/jobs?tab=saved` link; follow the new query.
  @override
  void didUpdateWidget(JobsScreen old) {
    super.didUpdateWidget(old);
    final t = widget.initialTab;
    if (t != old.initialTab && const {'browse', 'saved', 'forYou'}.contains(t)) _tab = t!;
  }

  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    return Screen(
      tabBar: true,
      header: TopBar(
        title: 'Jobs',
        back: false,
        right: ZButton(
          label: 'Post',
          variant: ButtonVariant.career,
          size: ButtonSize.sm,
          icon: LucideIcons.plus,
          onTap: () => notify(context, 'Post a job', 'Posting with photos and review happens on the web for now: $kApiBaseUrl/jobs/new'),
        ),
      ),
      onRefresh: () async => _loader.currentState?.reload(),
      children: [
        Segmented<String>(
          label: 'Job lists',
          tone: Tone.career,
          value: _tab,
          onChanged: (t) => setState(() => _tab = t),
          options: const [SegmentOption('browse', 'Browse'), SegmentOption('forYou', 'For you'), SegmentOption('saved', 'Saved')],
        ),
        if (_tab == 'browse') ...[
          SearchBox(
            placeholder: 'Search title, company or tag',
            label: 'Search jobs',
            onChanged: (v) {
              _debounce?.cancel();
              _debounce = Timer(const Duration(milliseconds: 350), () => setState(() => _query = v.trim()));
            },
          ),
          ChipRail(
            children: [
              for (final t in _types)
                ZChip(label: jobTypeLabels[t]!, tone: Tone.career, selected: _type == t, onTap: () => setState(() => _type = _type == t ? null : t)),
              for (final m in _modes)
                ZChip(label: workModeLabels[m]!, tone: Tone.career, selected: _mode == m, onTap: () => setState(() => _mode = _mode == m ? null : m)),
            ],
          ),
        ],
        Loader<JobFeed>(
          key: _loader,
          reloadKey: '$_tab|$_type|$_mode|$_query',
          load: () =>
              app.api.jobs(tab: _tab, query: _tab == 'browse' ? _query : null, type: _tab == 'browse' ? _type : null, mode: _tab == 'browse' ? _mode : null),
          builder: (context, feed, reload) {
            if (!feed.enabled) return const EmptyCard(title: 'Jobs are coming soon', detail: "The jobs board isn't open yet. Check back later.");
            if (feed.jobs.isEmpty) {
              return EmptyCard(
                title: switch (_tab) {
                  'saved' => 'No saved jobs',
                  'forYou' => 'No matches yet',
                  _ => 'No jobs match',
                },
                detail: switch (_tab) {
                  'saved' => 'Tap the bookmark on a post to keep it here.',
                  'forYou' => 'Add your major and interests to your profile to get matched posts.',
                  _ => 'Try removing a filter.',
                },
              );
            }
            return _JobList(initial: feed, tab: _tab, query: _query, type: _type, mode: _mode);
          },
        ),
      ],
    );
  }
}

/// The job cards, with "Load more" for the browse feed.
class _JobList extends StatefulWidget {
  const _JobList({required this.initial, required this.tab, required this.query, this.type, this.mode});
  final JobFeed initial;
  final String tab;
  final String query;
  final String? type;
  final String? mode;

  @override
  State<_JobList> createState() => _JobListState();
}

class _JobListState extends State<_JobList> {
  late List<Job> _jobs = widget.initial.jobs;
  late String? _cursor = widget.initial.nextCursor;
  bool _loading = false;

  @override
  void didUpdateWidget(_JobList old) {
    super.didUpdateWidget(old);
    if (old.initial != widget.initial) {
      _jobs = widget.initial.jobs;
      _cursor = widget.initial.nextCursor;
    }
  }

  Future<void> _more() async {
    setState(() => _loading = true);
    final api = AppScope.read(context).api;
    await attempt(context, () async {
      final next = await api.jobs(tab: widget.tab, query: widget.query, type: widget.type, mode: widget.mode, cursor: _cursor);
      _jobs = [..._jobs, ...next.jobs];
      _cursor = next.nextCursor;
    });
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _toggleSave(Job j) async {
    final app = AppScope.read(context);
    var saved = j.saved;
    final ok = await attempt(context, () async => saved = await app.api.toggleSaveJob(j.id), success: j.saved ? 'Removed from saved' : 'Saved');
    if (!ok || !mounted) return;
    setState(() => _jobs = [for (final x in _jobs) x.id == j.id ? x.copyWith(saved: saved) : x]);
    if (widget.tab == 'saved') app.touch();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      spacing: 16,
      children: [
        for (final j in _jobs) JobCard(job: j, onToggleSave: () => _toggleSave(j)),
        if (_cursor != null) ZButton(label: _loading ? 'Loading…' : 'Load more', variant: ButtonVariant.secondary, disabled: _loading, onTap: _more),
      ],
    );
  }
}

class JobCard extends StatelessWidget {
  const JobCard({super.key, required this.job, required this.onToggleSave});
  final Job job;
  final VoidCallback onToggleSave;

  @override
  Widget build(BuildContext context) {
    final j = job;
    return Surface(
      onTap: () => context.push('/jobs/${j.id}'),
      semanticLabel: '${j.title} at ${j.company}. ${j.location}. ${j.pay ?? ''}. ${j.deadlineLabel}',
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: 10,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            spacing: 12,
            children: [
              Avatar(initials: j.initials, color: j.color, size: 48, square: true, image: j.imageUrl),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ZText(j.title, variant: TextVariant.h3, style: const TextStyle(fontSize: 16)),
                    ZText('${j.company} · ${j.location}', variant: TextVariant.small, muted: true),
                  ],
                ),
              ),
              ZIconButton(
                icon: LucideIcons.bookmark,
                label: j.saved ? 'Remove ${j.title} from saved' : 'Save ${j.title}',
                tone: j.saved ? Tone.career : Tone.card,
                selected: j.saved,
                onTap: onToggleSave,
              ),
            ],
          ),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              ZBadge(label: j.typeLabel, tone: Tone.career),
              ZBadge(label: j.modeLabel),
              for (final t in j.tags.take(3)) ZBadge(label: t),
            ],
          ),
          if (j.reasons.isNotEmpty) ZText(j.reasons.join(' · '), variant: TextVariant.small, style: const TextStyle(fontSize: 12)),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            spacing: 8,
            children: [
              Flexible(
                child: ZText(j.pay ?? 'Pay not listed', variant: TextVariant.mono, maxLines: 1, style: const TextStyle(fontSize: 13)),
              ),
              if (j.closingSoon) ZBadge(label: j.deadlineLabel, tone: Tone.alert) else ZText(j.deadlineLabel, variant: TextVariant.small, muted: true),
            ],
          ),
        ],
      ),
    );
  }
}
