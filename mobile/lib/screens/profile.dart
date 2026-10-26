import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../data/models.dart';
import '../state/app_state.dart';
import '../theme/tokens.dart';
import '../theme/type.dart';
import '../widgets/widgets.dart';
import 'auth/onboarding_style.dart' show parseTimes, studyStyles, studyTimes, suggestedTopics, toggleIn;

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _editing = false;
  bool _busy = false;
  bool _uploading = false;

  final _name = TextEditingController();
  final _bio = TextEditingController();
  final _college = TextEditingController();
  final _major = TextEditingController();
  int? _semester;
  String? _style;
  List<String> _interests = [];
  List<String> _times = [];
  final _newInterest = TextEditingController();

  @override
  void dispose() {
    for (final c in [_name, _bio, _college, _major, _newInterest]) {
      c.dispose();
    }
    super.dispose();
  }

  void _startEditing(Me me) {
    _name.text = me.name;
    _bio.text = me.bio ?? '';
    _college.text = me.college ?? '';
    _major.text = me.major ?? '';
    _semester = me.semester;
    _style = me.studyStyle;
    _interests = [...me.interests];
    _times = parseTimes(me.availability);
    setState(() => _editing = true);
  }

  Future<void> _save() async {
    if (_name.text.trim().isEmpty) return showMessage(context, 'Your name can\'t be empty.', error: true);
    setState(() => _busy = true);
    final app = AppScope.read(context);
    final ok = await attempt(
      context,
      () => app.updateMe({
        'name': _name.text.trim(),
        'bio': _bio.text.trim(),
        'college': _college.text.trim(),
        'major': _major.text.trim(),
        'semester': _semester,
        'studyStyle': _style,
        'interests': _interests,
        'availability': _times.join(' & '),
      }),
      success: 'Profile saved',
    );
    if (!mounted) return;
    setState(() {
      _busy = false;
      if (ok) _editing = false;
    });
  }

  Future<void> _changePhoto() async {
    final app = AppScope.read(context);
    final XFile? file;
    try {
      file = await ImagePicker().pickImage(source: ImageSource.gallery, maxWidth: 1024, maxHeight: 1024, imageQuality: 85);
    } catch (_) {
      if (mounted) showMessage(context, "Couldn't open your photos. Check Zenvy's photo permission.", error: true);
      return;
    }
    if (file == null || !mounted) return;
    setState(() => _uploading = true);
    final picked = file;
    await attempt(context, () async {
      final bytes = await picked.readAsBytes();
      final type = picked.mimeType ?? (picked.name.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');
      await app.api.uploadPhoto(bytes, picked.name, type);
      await app.refreshMe();
      app.touch();
    }, success: 'Photo updated');
    if (mounted) setState(() => _uploading = false);
  }

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final me = app.me;
    if (me == null) {
      return Screen(
        header: const TopBar(fallback: '/more'),
        body: LoadingView(),
      );
    }

    return Screen(
      safeTop: false,
      padding: const EdgeInsets.only(bottom: 28),
      gap: 0,
      onRefresh: _editing ? null : app.refreshMe,
      footer: _editing
          ? Container(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 8),
              decoration: const BoxDecoration(
                color: Palette.paper,
                border: Border(top: BorderSide(color: Palette.ink, width: 3)),
              ),
              child: Row(
                spacing: 12,
                children: [
                  Expanded(
                    child: ZButton(label: 'Cancel', variant: ButtonVariant.secondary, disabled: _busy, onTap: () => setState(() => _editing = false)),
                  ),
                  Expanded(
                    flex: 2,
                    child: ZButton(label: _busy ? 'Saving…' : 'Save profile', variant: ButtonVariant.live, disabled: _busy, onTap: _save),
                  ),
                ],
              ),
            )
          : null,
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
                        Surface(radius: Radii.pill, borderWidth: 0, fill: const Color(0x00000000), child: Avatar.of(me, size: 100)),
                        if (_uploading)
                          const Positioned.fill(
                            child: Center(child: CircularProgressIndicator(color: Palette.ink)),
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
                            onTap: _uploading ? null : _changePhoto,
                          ),
                        ),
                      ],
                    ),
                    if (!_editing)
                      ZButton(
                        label: 'Edit profile',
                        variant: ButtonVariant.secondary,
                        size: ButtonSize.sm,
                        icon: LucideIcons.pencil,
                        onTap: () => _startEditing(me),
                      ),
                  ],
                ),
                if (_editing) ..._form() else ..._view(me),
              ],
            ),
          ),
        ),
      ],
    );
  }

  List<Widget> _view(Me me) => [
    Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ZText(me.name, variant: TextVariant.title, header: true),
        if (me.academicLine.isNotEmpty) ZText(me.academicLine, variant: TextVariant.small, muted: true, style: const TextStyle(fontSize: 14)),
        if (me.uniqueId != null) ZText('@${me.uniqueId}', variant: TextVariant.mono, muted: true, style: const TextStyle(fontSize: 12)),
      ],
    ),
    Row(
      spacing: 8,
      children: [
        for (final t in [(value: '${me.partnerCount}', label: 'Partners'), (value: '${me.groupCount}', label: 'Groups')])
          Expanded(
            child: Surface(
              shadow: ShadowSize.none,
              radius: 12,
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Column(
                children: [
                  Text(t.value, style: mono(FontWeight.w700, 18, 24).copyWith(color: Palette.ink)),
                  ZText(t.label, variant: TextVariant.small, muted: true, style: const TextStyle(fontSize: 11)),
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
        ZText(me.bio ?? "Add a short bio so classmates know what you're working on.", muted: me.bio == null),
      ],
    ),
    Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      spacing: 8,
      children: [
        const ZText('Interests', variant: TextVariant.h3),
        if (me.interests.isEmpty && me.studyStyle == null) ZText('None yet. Edit your profile to add some.', variant: TextVariant.small, muted: true),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final t in me.interests) ZBadge(label: t, tone: Tone.chat),
            if (me.studyStyle != null) ZBadge(label: me.studyStyle!, tone: Tone.match),
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
                ZText(me.availability?.isNotEmpty == true ? me.availability! : 'No times set', variant: TextVariant.small, muted: true),
              ],
            ),
          ),
          Toggle(
            value: me.matchingAvailable,
            label: 'Available for matching',
            onChanged: (v) => attempt(context, () => AppScope.read(context).updateMe({'matchingAvailable': v})),
          ),
        ],
      ),
    ),
  ];

  List<Widget> _form() {
    final topics = {...suggestedTopics, ..._interests}.toList();
    return [
      Field(label: 'Name', controller: _name, capitalization: TextCapitalization.words),
      Field(label: 'Short bio', controller: _bio, multiline: true, maxLength: 500, placeholder: 'What are you studying for right now?'),
      Field(label: 'College', controller: _college, capitalization: TextCapitalization.words),
      Field(label: 'Major', controller: _major, capitalization: TextCapitalization.words),
      Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        spacing: 8,
        children: [
          const ZText('Semester', variant: TextVariant.h3, style: TextStyle(fontSize: 14)),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (var s = 1; s <= 12; s++)
                SizedBox(
                  width: 52,
                  child: ZChip(
                    label: '$s',
                    tone: Tone.focus,
                    padding: 4,
                    selected: _semester == s,
                    onTap: () => setState(() => _semester = _semester == s ? null : s),
                  ),
                ),
            ],
          ),
        ],
      ),
      Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        spacing: 8,
        children: [
          const ZText('Study style', variant: TextVariant.h3, style: TextStyle(fontSize: 14)),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [for (final s in studyStyles) ZChip(label: s, selected: _style == s, onTap: () => setState(() => _style = _style == s ? null : s))],
          ),
        ],
      ),
      Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: 8,
        children: [
          const ZText('Interests', variant: TextVariant.h3, style: TextStyle(fontSize: 14)),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final t in topics)
                ZChip(label: t, tone: Tone.chat, selected: _interests.contains(t), onTap: () => setState(() => _interests = toggleIn(_interests, t))),
            ],
          ),
          Row(
            spacing: 8,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Expanded(
                child: Field(label: 'Add your own', controller: _newInterest, placeholder: 'Operating systems'),
              ),
              ZIconButton(
                icon: LucideIcons.plus,
                label: 'Add interest',
                onTap: () {
                  final t = _newInterest.text.trim();
                  if (t.isEmpty || _interests.contains(t)) return;
                  setState(() {
                    _interests = [..._interests, t];
                    _newInterest.clear();
                  });
                },
              ),
            ],
          ),
        ],
      ),
      Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        spacing: 8,
        children: [
          const ZText('Best times', variant: TextVariant.h3, style: TextStyle(fontSize: 14)),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final t in studyTimes)
                ZChip(label: t, tone: Tone.focus, selected: _times.contains(t), onTap: () => setState(() => _times = toggleIn(_times, t))),
            ],
          ),
        ],
      ),
    ];
  }
}
