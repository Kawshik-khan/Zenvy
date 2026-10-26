import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/sample.dart';
import '../../state/app_state.dart';
import '../../theme/tokens.dart';
import '../../util/dialogs.dart';
import '../../widgets/widgets.dart';
import '../missing.dart';
import '../partners/partner_profile.dart' show ActionBar, InfoTile;

// Skills the student lists across their profile; the web app derives these from Profile.interests.
final _mySkills = {...me.interests, 'JavaScript', 'Git', 'Python', 'SQL'};

class JobDetailScreen extends StatelessWidget {
  const JobDetailScreen({super.key, required this.id});
  final String id;

  @override
  Widget build(BuildContext context) {
    final j = jobs.where((x) => x.id == id).firstOrNull;
    if (j == null) return const Missing(to: '/jobs');
    final app = AppScope.of(context);
    final saved = app.flag(Flag.savedJobs, j.id);
    final applied = app.flag(Flag.appliedJobs, j.id);
    final matched = j.skills.where(_mySkills.contains).length;

    final facts = [
      (label: 'Location', value: j.place, alert: false),
      (label: 'Duration', value: j.duration, alert: false),
      (label: 'Stipend', value: j.pay, alert: false),
      (label: 'Deadline', value: j.closesSoon ? '${j.deadline} · 2 days' : j.deadline, alert: j.closesSoon),
    ];

    return Screen(
      safeTop: false,
      padding: const EdgeInsets.only(bottom: 28),
      gap: 0,
      footer: ActionBar(
        children: [
          ZIconButton(
            icon: LucideIcons.bookmark,
            label: saved ? 'Remove from saved' : 'Save job',
            tone: saved ? Tone.career : Tone.card,
            selected: saved,
            size: 52,
            onTap: () => app.toggle(Flag.savedJobs, j.id),
          ),
          Expanded(
            child: ZButton(
              label: applied ? 'Applied · ${j.company} notified' : 'Apply with Zenvy profile',
              variant: applied ? ButtonVariant.live : ButtonVariant.career,
              size: ButtonSize.lg,
              onTap: () => applied
                  ? confirm(
                      context,
                      'Withdraw application?',
                      '${j.company} will no longer see your application.',
                      'Withdraw',
                      () => app.toggle(Flag.appliedJobs, j.id),
                    )
                  : confirm(
                      context,
                      'Apply with your profile?',
                      '${j.company} will see your name, major, interests and bio.',
                      'Apply',
                      () => app.toggle(Flag.appliedJobs, j.id),
                      destructive: false,
                    ),
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
                  ZIconButton(
                    icon: LucideIcons.flag,
                    label: 'Report this listing',
                    onTap: () => confirm(
                      context,
                      'Report this listing?',
                      'Tell us if it looks fake, unpaid when it says paid, or unsafe.',
                      'Report',
                      () => notify(context, 'Report sent', 'Thanks. Our team reviews every report.'),
                    ),
                  ),
                ],
              ),
              Row(
                spacing: 14,
                children: [
                  Surface(
                    shadow: ShadowSize.sm,
                    borderWidth: 0,
                    fill: const Color(0x00000000),
                    child: Avatar(initials: j.initials, color: j.color, size: 60, square: true),
                  ),
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
                        ZText('${j.company} · Posted ${j.posted}', variant: TextVariant.small, style: const TextStyle(fontSize: 14)),
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
              Surface(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  spacing: 10,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const ZText('Your skills match', variant: TextVariant.h3),
                        ZText('$matched / ${j.skills.length}', variant: TextVariant.mono),
                      ],
                    ),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        for (final s in j.skills)
                          _mySkills.contains(s) ? ZBadge(label: s, tone: Tone.live, icon: LucideIcons.check) : ZBadge(label: s, tone: Tone.card, dashed: true),
                      ],
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                spacing: 6,
                children: [
                  const ZText('About the role', variant: TextVariant.h2, style: TextStyle(fontSize: 16)),
                  ZText(j.about),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                spacing: 6,
                children: [
                  const ZText("You'll need", variant: TextVariant.h2, style: TextStyle(fontSize: 16)),
                  for (final n in j.needs) ZText('• $n'),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}
