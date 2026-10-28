import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/models.dart';
import '../../state/app_state.dart';
import '../../theme/tokens.dart';
import '../../theme/type.dart';
import '../../util/dialogs.dart';
import '../../widgets/widgets.dart';
import 'connect.dart';

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
    final app = AppScope.of(context);
    return Loader<Person>(
      load: () => app.api.person(id),
      frame: (context, body) => Screen(
        header: const TopBar(fallback: '/partners'),
        body: body,
      ),
      builder: (context, p, reload) => _Profile(person: p, reload: reload),
    );
  }
}

class _Profile extends StatelessWidget {
  const _Profile({required this.person, required this.reload});
  final Person person;
  final Future<void> Function() reload;

  Future<void> _moreActions(BuildContext context) async {
    final p = person;
    final app = AppScope.read(context);
    final choice = await showModalBottomSheet<String>(
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
            spacing: 12,
            children: [
              ZText(p.name, variant: TextVariant.h2),
              ZButton(label: 'Report ${p.firstName}', variant: ButtonVariant.secondary, icon: LucideIcons.flag, onTap: () => Navigator.pop(context, 'report')),
              if (!p.blockedByMe)
                ZButton(label: 'Block ${p.firstName}', variant: ButtonVariant.danger, icon: LucideIcons.userX, onTap: () => Navigator.pop(context, 'block')),
            ],
          ),
        ),
      ),
    );
    if (!context.mounted) return;
    if (choice == 'block') {
      await confirm(context, 'Block ${p.name}?', "They won't be able to message you, and you won't see each other in suggestions.", 'Block', () async {
        if (await attempt(context, () => app.api.block(p.id), success: '${p.name} is blocked')) {
          app.touch();
          if (context.mounted) goBack(context, '/partners');
        }
      });
    } else if (choice == 'report') {
      final reason = await _askReason(context);
      if (reason != null && context.mounted) await attempt(context, () => app.api.report(p.id, reason), success: 'Report sent. Thanks for telling us.');
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = person;
    final app = AppScope.read(context);
    final c = p.connection;
    return Screen(
      safeTop: false,
      padding: const EdgeInsets.only(bottom: 28),
      gap: 0,
      onRefresh: reload,
      footer: ActionBar(
        children: [
          if (c?.pendingIncoming == true) ...[
            Expanded(
              child: ZButton(
                label: 'Decline',
                variant: ButtonVariant.secondary,
                onTap: () async {
                  if (await attempt(context, () => app.api.respondToRequest(p.id, accept: false))) {
                    app.touch();
                  }
                },
              ),
            ),
            Expanded(
              flex: 2,
              child: ConnectButton(person: p, size: ButtonSize.md, onChanged: (_) => reload()),
            ),
          ] else ...[
            if (c?.accepted == true) ...[
              Expanded(
                child: ZButton(label: 'Message', variant: ButtonVariant.chat, icon: LucideIcons.messageSquare, href: '/dm/${p.id}'),
              ),
              const Expanded(
                child: ZButton(label: 'Partners', variant: ButtonVariant.match, settled: true, icon: LucideIcons.userCheck),
              ),
            ] else
              Expanded(
                child: ConnectButton(person: p, size: ButtonSize.md, onChanged: (_) => reload()),
              ),
          ],
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
              ZIconButton(icon: LucideIcons.ellipsis, label: 'Block or report', onTap: () => _moreActions(context)),
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
                    Surface(radius: Radii.pill, borderWidth: 0, fill: const Color(0x00000000), child: Avatar.of(p, size: 104)),
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
                    if (p.academicLine.isNotEmpty) ZText(p.academicLine, variant: TextVariant.small, muted: true, style: const TextStyle(fontSize: 14)),
                  ],
                ),
                if (c?.pendingIncoming == true)
                  Surface(
                    tone: Tone.match,
                    shadow: ShadowSize.sm,
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      spacing: 4,
                      children: [
                        ZText('${p.firstName} wants to study together', variant: TextVariant.h3),
                        if (p.requestNote != null) ZText('“${p.requestNote}”'),
                      ],
                    ),
                  ),
                if (c?.pendingOutgoing == true)
                  ZText('Request sent. You can message ${p.firstName} once they accept.', variant: TextVariant.small, muted: true),
                if (p.bio != null) ZText(p.bio!),
                if (p.reasons.isNotEmpty)
                  Surface(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      spacing: 10,
                      children: [
                        const ZText('Why you match', variant: TextVariant.h3),
                        for (final r in p.reasons)
                          Row(
                            spacing: 10,
                            children: [
                              const Icon(LucideIcons.check, size: 16, color: Palette.ink),
                              Expanded(child: ZText(r, variant: TextVariant.small)),
                            ],
                          ),
                      ],
                    ),
                  ),
                if (p.interests.isNotEmpty || p.studyStyle != null)
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    spacing: 8,
                    children: [
                      const ZText('Interests', variant: TextVariant.h3),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          for (final t in p.interests)
                            ZBadge(label: t, tone: (app.me?.interests.map((e) => e.toLowerCase()).contains(t.toLowerCase()) ?? false) ? Tone.chat : Tone.card),
                          if (p.studyStyle != null) ZBadge(label: p.studyStyle!, tone: Tone.match),
                        ],
                      ),
                    ],
                  ),
                IntrinsicHeight(
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    spacing: 10,
                    children: [
                      Expanded(
                        child: InfoTile(label: 'Available', value: p.availability ?? 'Not set'),
                      ),
                      Expanded(
                        child: InfoTile(label: 'Groups in common', value: p.sharedGroups.isEmpty ? 'None yet' : p.sharedGroups.map((g) => g.name).join(', ')),
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

Future<String?> _askReason(BuildContext context) {
  final controller = TextEditingController();
  return showDialog<String>(
    context: context,
    builder: (context) => AlertDialog(
      backgroundColor: Palette.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(Radii.lg),
        side: const BorderSide(color: Palette.ink, width: 3),
      ),
      title: Text('What happened?', style: variantStyle(TextVariant.h2).copyWith(color: Palette.ink)),
      content: Field(label: 'Reason', controller: controller, multiline: true, maxLength: 500, placeholder: 'Spam, harassment, fake profile…'),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const ZText('Cancel', variant: TextVariant.strong),
        ),
        TextButton(
          onPressed: () => Navigator.pop(context, controller.text.trim().isEmpty ? null : controller.text.trim()),
          child: const ZText('Send report', variant: TextVariant.strong),
        ),
      ],
    ),
  ).whenComplete(controller.dispose);
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
