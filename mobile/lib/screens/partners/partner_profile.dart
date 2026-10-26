import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/sample.dart';
import '../../state/app_state.dart';
import '../../theme/tokens.dart';
import '../../theme/type.dart';
import '../../util/dialogs.dart';
import '../../widgets/widgets.dart';
import '../missing.dart';

/// Action bar pinned to the bottom of detail screens.
class ActionBar extends StatelessWidget {
  const ActionBar({super.key, required this.children});
  final List<Widget> children;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.fromLTRB(20, 14, 20, 8),
    decoration: const BoxDecoration(
      color: Palette.paper,
      border: Border(top: BorderSide(color: Palette.ink, width: 3)),
    ),
    child: Row(spacing: 12, children: children),
  );
}

class PartnerProfileScreen extends StatelessWidget {
  const PartnerProfileScreen({super.key, required this.id});
  final String id;

  @override
  Widget build(BuildContext context) {
    final p = partnerById(id);
    if (p == null) return const Missing(to: '/partners');
    final app = AppScope.of(context);
    final connected = app.connected(p.id);
    final requested = app.flag(Flag.requested, p.id);

    return Screen(
      safeTop: false,
      padding: const EdgeInsets.only(bottom: 28),
      gap: 0,
      footer: ActionBar(
        children: [
          Expanded(
            child: ZButton(label: 'Message', variant: ButtonVariant.chat, icon: LucideIcons.messageSquare, href: '/dm/${p.id}'),
          ),
          Expanded(
            child: connected
                ? const ZButton(label: 'Partners', variant: ButtonVariant.match, settled: true)
                : ZButton(
                    label: requested ? 'Requested' : 'Connect',
                    variant: ButtonVariant.match,
                    icon: LucideIcons.userPlus,
                    settled: requested,
                    onTap: () {
                      // Prototype: Tanvir has already requested you, so connecting is an instant match.
                      if (p.id == 'tanvir') {
                        app.connect(p.id);
                        context.push('/matched/${p.id}');
                      } else {
                        app.toggle(Flag.requested, p.id);
                      }
                    },
                  ),
          ),
        ],
      ),
      children: [
        HeaderBand(
          color: Palette.match,
          height: 140,
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ZIconButton(icon: LucideIcons.chevronLeft, label: 'Back', onTap: () => goBack(context, '/partners')),
              ZIconButton(
                icon: LucideIcons.ellipsis,
                label: 'Block or report',
                onTap: () => confirm(
                  context,
                  'Block ${p.name}?',
                  "They won't be able to message you or see your profile. You can also report them from Settings.",
                  'Block',
                  () {
                    notify(context, 'Blocked', '${p.name} can no longer contact you.');
                    goBack(context, '/partners');
                  },
                ),
              ),
            ],
          ),
        ),
        Transform.translate(
          offset: const Offset(0, -52),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              spacing: 16,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Surface(
                      radius: Radii.pill,
                      borderWidth: 0,
                      fill: const Color(0x00000000),
                      child: Avatar(initials: p.initials, color: p.color, size: 104),
                    ),
                    Surface(
                      tone: Tone.focus,
                      shadow: ShadowSize.sm,
                      radius: 12,
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      child: Column(
                        children: [
                          Text('${p.score}%', style: mono(FontWeight.w700, 26, 30).copyWith(color: Palette.ink)),
                          Text('MATCH', style: mono(FontWeight.w500, 10, 12).copyWith(color: Palette.ink)),
                        ],
                      ),
                    ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ZText(p.name, variant: TextVariant.title, header: true),
                    ZText('${p.major} · Semester ${p.semester} · ${p.college}', variant: TextVariant.small, muted: true, style: const TextStyle(fontSize: 14)),
                  ],
                ),
                if (p.bio != null) ZText(p.bio!),
                Surface(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    spacing: 10,
                    children: [
                      const ZText('Why you match', variant: TextVariant.h3),
                      for (final b in p.breakdown)
                        Semantics(
                          label: '${b.label}: ${b.note}',
                          excludeSemantics: true,
                          child: Row(
                            spacing: 10,
                            children: [
                              SizedBox(width: 86, child: ZText(b.label, variant: TextVariant.small)),
                              Expanded(
                                child: Container(
                                  height: 12,
                                  clipBehavior: Clip.antiAlias,
                                  decoration: BoxDecoration(
                                    color: Palette.white,
                                    borderRadius: BorderRadius.circular(6),
                                    border: Border.all(color: Palette.ink, width: 2),
                                  ),
                                  child: FractionallySizedBox(
                                    alignment: Alignment.centerLeft,
                                    widthFactor: b.value,
                                    child: const ColoredBox(color: Palette.match),
                                  ),
                                ),
                              ),
                              SizedBox(
                                width: 54,
                                child: ZText(b.note, variant: TextVariant.mono, align: TextAlign.right, style: const TextStyle(fontSize: 12)),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  spacing: 8,
                  children: [
                    const ZText('Interests', variant: TextVariant.h3),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [for (final t in p.interests) ZBadge(label: t, tone: app.profile.interests.contains(t) ? Tone.chat : Tone.card)],
                    ),
                  ],
                ),
                IntrinsicHeight(
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    spacing: 10,
                    children: [
                      Expanded(
                        child: InfoTile(label: 'Available', value: p.availability ?? ''),
                      ),
                      Expanded(
                        child: InfoTile(label: 'In common', value: p.inCommon ?? ''),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

/// Small label-over-value tile (availability, job facts).
class InfoTile extends StatelessWidget {
  const InfoTile({super.key, required this.label, required this.value, this.alert = false});
  final String label;
  final String value;
  final bool alert;

  @override
  Widget build(BuildContext context) => Surface(
    shadow: ShadowSize.none,
    radius: 12,
    tone: alert ? Tone.alert : Tone.card,
    padding: const EdgeInsets.all(12),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ZText(label, variant: TextVariant.small, muted: !alert, style: const TextStyle(fontSize: 12)),
        ZText(value, variant: TextVariant.h3, style: const TextStyle(fontSize: 14)),
      ],
    ),
  );
}
