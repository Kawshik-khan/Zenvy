import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../data/sample.dart';
import '../state/app_state.dart';
import '../theme/tokens.dart';
import '../theme/type.dart';
import '../util/dialogs.dart';
import '../widgets/widgets.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _editing = false;
  String _bio = me.bio ?? '';
  late final _draft = TextEditingController(text: _bio);

  @override
  void dispose() {
    _draft.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final groupsJoined = groups.where((g) => app.flag(Flag.joinedGroups, g.id)).length;
    final tiles = [
      (value: '${Stats.profilePartners}', label: 'Partners', fill: null),
      (value: '$groupsJoined', label: 'Groups', fill: null),
      (value: '${Stats.profileFocusedHours}h', label: 'Focused', fill: null),
      (value: '${Stats.streakDays + 1}d', label: 'Streak', fill: Palette.focus),
    ];

    return Screen(
      safeTop: false,
      padding: const EdgeInsets.only(bottom: 28),
      gap: 0,
      children: [
        HeaderBand(
          color: Palette.live,
          height: 120,
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
          child: Align(
            alignment: Alignment.topLeft,
            child: ZIconButton(icon: LucideIcons.chevronLeft, label: 'Back', onTap: () => goBack(context, '/more')),
          ),
        ),
        Transform.translate(
          offset: const Offset(0, -50),
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
                    Stack(
                      clipBehavior: Clip.none,
                      children: [
                        Surface(
                          radius: Radii.pill,
                          borderWidth: 0,
                          fill: const Color(0x00000000),
                          child: Avatar(initials: me.initials, color: me.color, size: 100),
                        ),
                        Positioned(
                          right: -6,
                          bottom: -6,
                          child: ZIconButton(
                            icon: LucideIcons.camera,
                            label: 'Change profile photo',
                            tone: Tone.focus,
                            round: true,
                            shadow: false,
                            onTap: () => notify(context, 'Profile photo', 'Photo upload uses Supabase Storage, as on the web.'),
                          ),
                        ),
                      ],
                    ),
                    if (_editing)
                      ZButton(
                        label: 'Save',
                        variant: ButtonVariant.live,
                        size: ButtonSize.sm,
                        onTap: () => setState(() {
                          _bio = _draft.text.trim();
                          _editing = false;
                        }),
                      )
                    else
                      ZButton(
                        label: 'Edit profile',
                        variant: ButtonVariant.secondary,
                        size: ButtonSize.sm,
                        icon: LucideIcons.pencil,
                        onTap: () => setState(() => _editing = true),
                      ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ZText(me.name, variant: TextVariant.title, header: true),
                    ZText(
                      '${me.major} · Semester ${me.semester} · ${me.college}',
                      variant: TextVariant.small,
                      muted: true,
                      style: const TextStyle(fontSize: 14),
                    ),
                  ],
                ),
                Row(
                  spacing: 8,
                  children: [
                    for (final t in tiles)
                      Expanded(
                        child: Surface(
                          shadow: ShadowSize.none,
                          radius: 12,
                          fill: t.fill,
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          child: Column(
                            children: [
                              Text(t.value, style: mono(FontWeight.w700, 18, 24).copyWith(color: Palette.ink)),
                              ZText(t.label, variant: TextVariant.small, muted: t.fill == null, style: const TextStyle(fontSize: 11)),
                            ],
                          ),
                        ),
                      ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  spacing: 6,
                  children: [
                    const ZText('About', variant: TextVariant.h3),
                    if (_editing)
                      Field(label: 'Short bio', controller: _draft, multiline: true)
                    else
                      ZText(_bio.isNotEmpty ? _bio : "Add a short bio so classmates know what you're working on."),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  spacing: 8,
                  children: [
                    const ZText('Interests', variant: TextVariant.h3),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        for (final t in app.profile.interests) ZBadge(label: t, tone: Tone.chat),
                        ZBadge(label: app.profile.studyStyle, tone: Tone.match),
                      ],
                    ),
                  ],
                ),
                Surface(
                  shadow: ShadowSize.sm,
                  padding: const EdgeInsets.all(14),
                  child: Row(
                    spacing: 14,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const ZText('Available for matching', variant: TextVariant.h3),
                            ZText(app.profile.times.isNotEmpty ? app.profile.times.join(' & ') : 'No times set', variant: TextVariant.small, muted: true),
                          ],
                        ),
                      ),
                      Toggle(
                        value: app.profile.available,
                        label: 'Available for matching',
                        onChanged: (v) => app.updateProfile((p) => p.copyWith(available: v)),
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
