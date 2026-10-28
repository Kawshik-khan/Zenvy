import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/models.dart';
import '../../state/app_state.dart';
import '../../theme/tokens.dart';
import '../../theme/type.dart';
import '../../widgets/widgets.dart';
import '../partners/partner_profile.dart' show ActionBar, InfoTile;

const _reportReasons = {
  'SCAM_FEE': 'Asks for money or a fee',
  'FAKE_COMPANY': 'Company looks fake',
  'SPAM': 'Spam or duplicate',
  'OFFENSIVE': 'Offensive content',
  'OTHER': 'Something else',
};

class JobDetailScreen extends StatelessWidget {
  const JobDetailScreen({super.key, required this.id});
  final String id;

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    return Loader<Job>(
      load: () => app.api.job(id),
      frame: (context, body) => Screen(
        header: const TopBar(fallback: '/jobs'),
        body: body,
      ),
      builder: (context, job, reload) => _JobBody(job: job, reload: reload),
    );
  }
}

class _JobBody extends StatefulWidget {
  const _JobBody({required this.job, required this.reload});
  final Job job;
  final Future<void> Function() reload;

  @override
  State<_JobBody> createState() => _JobBodyState();
}

class _JobBodyState extends State<_JobBody> {
  late bool _saved = widget.job.saved;

  @override
  void didUpdateWidget(_JobBody old) {
    super.didUpdateWidget(old);
    if (old.job != widget.job) _saved = widget.job.saved;
  }

  Future<void> _apply() async {
    final j = widget.job;
    final target = j.applyTarget;
    switch (j.applyMethod) {
      case 'LINK' when target != null:
        await openLink(context, target);
      case 'EMAIL' when target != null:
        await openLink(context, Uri(scheme: 'mailto', path: target, queryParameters: {'subject': 'Application: ${j.title}'}).toString());
      default:
        // MESSAGE: talk to the poster. DMs need an accepted partner match, so the poster's
        // profile opens when that isn't in place yet.
        final app = AppScope.read(context);
        try {
          await app.api.openDm(j.author.id);
          if (mounted) context.push('/dm/${j.author.id}');
        } catch (_) {
          if (!mounted) return;
          showMessage(context, 'Connect with ${j.author.name} first, then message them about this post.');
          context.push('/partner/${j.author.id}');
        }
    }
  }

  Future<void> _report() async {
    final app = AppScope.read(context);
    final reason = await showModalBottomSheet<String>(
      context: context,
      backgroundColor: Palette.paper,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(Radii.lg)),
        side: BorderSide(color: Palette.ink, width: 3),
      ),
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: 10,
            children: [
              const ZText("What's wrong with this post?", variant: TextVariant.h2),
              for (final e in _reportReasons.entries) ZButton(label: e.value, variant: ButtonVariant.secondary, onTap: () => Navigator.pop(context, e.key)),
            ],
          ),
        ),
      ),
    );
    if (reason != null && mounted) {
      await attempt(context, () => app.api.reportJob(widget.job.id, reason), success: 'Report sent. Our team reviews every report.');
    }
  }

  @override
  Widget build(BuildContext context) {
    final j = widget.job;
    final app = AppScope.read(context);
    final applyLabel = switch (j.applyMethod) {
      'LINK' => 'Apply on their site',
      'EMAIL' => 'Apply by email',
      _ => 'Message ${j.author.firstName}',
    };
    final facts = [
      (label: 'Location', value: '${j.location} · ${j.modeLabel}', alert: false),
      (label: 'Type', value: j.typeLabel, alert: false),
      (label: 'Pay', value: j.pay ?? 'Not listed', alert: false),
      (label: 'Deadline', value: j.deadlineLabel, alert: j.closingSoon),
    ];

    return Screen(
      safeTop: false,
      padding: const EdgeInsets.only(bottom: 28),
      gap: 0,
      onRefresh: widget.reload,
      footer: j.isAuthor
          ? null
          : ActionBar(
              children: [
                ZIconButton(
                  icon: LucideIcons.bookmark,
                  label: _saved ? 'Remove from saved' : 'Save job',
                  tone: _saved ? Tone.career : Tone.card,
                  selected: _saved,
                  size: 52,
                  onTap: () async {
                    var saved = _saved;
                    if (await attempt(context, () async => saved = await app.api.toggleSaveJob(j.id), success: _saved ? 'Removed from saved' : 'Saved')) {
                      if (mounted) setState(() => _saved = saved);
                    }
                  },
                ),
                Expanded(
                  child: ZButton(
                    label: applyLabel,
                    variant: ButtonVariant.career,
                    size: ButtonSize.lg,
                    icon: j.applyMethod == 'MESSAGE' ? LucideIcons.messageSquare : LucideIcons.externalLink,
                    onTap: _apply,
                  ),
                ),
              ],
            ),
      children: [
        HeaderBand(
          color: Palette.career,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: 14,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  ZIconButton(icon: LucideIcons.chevronLeft, label: 'Back to jobs', onTap: () => goBack(context, '/jobs')),
                  if (!j.isAuthor) ZIconButton(icon: LucideIcons.flag, label: 'Report this listing', onTap: _report),
                ],
              ),
              Row(
                spacing: 14,
                children: [
                  Avatar(initials: j.initials, color: j.color, size: 60, square: true, image: j.imageUrl),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        ZText(
                          j.title,
                          variant: TextVariant.title,
                          header: true,
                          style: const TextStyle(fontSize: 22, height: 26 / 22),
                        ),
                        ZText('${j.company} · Posted ${timeAgo(j.postedAt).toLowerCase()}', variant: TextVariant.small, style: const TextStyle(fontSize: 14)),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 18, 20, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: 18,
            children: [
              if (j.isAuthor)
                Surface(
                  tone: j.status == 'LIVE' ? Tone.live : Tone.focus,
                  shadow: ShadowSize.sm,
                  padding: const EdgeInsets.all(14),
                  child: ZText(
                    j.status == 'LIVE'
                        ? 'Your post is live.'
                        : 'Your post is ${(j.status ?? '').toLowerCase().replaceAll('_', ' ')}.${j.reviewNote != null ? ' ${j.reviewNote}' : ''}',
                    variant: TextVariant.strong,
                  ),
                ),
              Column(
                spacing: 10,
                children: [
                  for (var i = 0; i < facts.length; i += 2)
                    IntrinsicHeight(
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        spacing: 10,
                        children: [
                          for (final f in facts.skip(i).take(2))
                            Expanded(
                              child: InfoTile(label: f.label, value: f.value, alert: f.alert),
                            ),
                        ],
                      ),
                    ),
                ],
              ),
              if (j.partnerSaves > 0)
                Row(
                  spacing: 8,
                  children: [
                    const Icon(LucideIcons.users, size: 18, color: Palette.ink),
                    Expanded(child: ZText('${j.partnerSaves} of your study partners saved this.', variant: TextVariant.small)),
                  ],
                ),
              if (j.tags.isNotEmpty)
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [for (final t in j.tags) ZBadge(label: t, tone: Tone.card)],
                ),
              for (final image in j.imageUrls)
                ClipRRect(
                  borderRadius: BorderRadius.circular(Radii.lg),
                  child: Image.network(image, fit: BoxFit.cover, errorBuilder: (_, _, _) => const SizedBox()),
                ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                spacing: 6,
                children: [
                  const ZText('About the role', variant: TextVariant.h2, style: TextStyle(fontSize: 16)),
                  ZText(j.description ?? ''),
                ],
              ),
              Surface(
                shadow: ShadowSize.none,
                onTap: () => context.push('/partner/${j.author.id}'),
                semanticLabel: 'Posted by ${j.author.name}',
                padding: const EdgeInsets.all(12),
                child: Row(
                  spacing: 12,
                  children: [
                    Avatar.of(j.author, size: 40),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Posted by', style: grotesk(FontWeight.w400, 12, 16).copyWith(color: Palette.muted)),
                          ZText(j.author.name, variant: TextVariant.h3),
                        ],
                      ),
                    ),
                    const Icon(LucideIcons.chevronRight, size: 18, color: Palette.ink),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
