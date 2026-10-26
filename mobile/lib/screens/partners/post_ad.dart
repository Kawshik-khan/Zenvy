import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../theme/tokens.dart';
import '../../theme/type.dart';
import '../../util/dialogs.dart';
import '../../widgets/widgets.dart';

const _places = ['On campus', 'Online', 'Either'];
const _maxBody = 300;

class PostAdScreen extends StatefulWidget {
  const PostAdScreen({super.key});

  @override
  State<PostAdScreen> createState() => _PostAdScreenState();
}

class _PostAdScreenState extends State<PostAdScreen> {
  String _title = '';
  String _course = '';
  String _body = '';
  String _place = 'Online';
  int _size = 2;

  @override
  Widget build(BuildContext context) {
    final valid = _title.trim().length >= 4 && _course.trim().isNotEmpty;
    return Screen(
      header: const TopBar(title: 'Post a study ad', close: true, fallback: '/partners'),
      footer: Padding(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
        child: ZButton(
          label: 'Publish ad',
          variant: ButtonVariant.match,
          size: ButtonSize.lg,
          disabled: !valid,
          onTap: () {
            final nav = Navigator.of(context);
            notify(context, 'Ad published', 'It shows at the top of Find partners for 7 days.').then((_) => nav.maybePop());
          },
        ),
      ),
      children: [
        ZText("Tell classmates what you're working on. Ads show at the top of Find partners for 7 days.", muted: true),
        Field(label: 'Headline', placeholder: 'Need 2 people for CSE221 timed sets', onChanged: (v) => setState(() => _title = v)),
        Field(label: 'Course or topic', placeholder: 'CSE221 · Algorithms', onChanged: (v) => setState(() => _course = v)),
        Field(
          label: 'Details',
          multiline: true,
          maxLength: _maxBody,
          placeholder: "When, where, and what you'll work on.",
          hint: '${_body.length} / $_maxBody',
          onChanged: (v) => setState(() => _body = v),
        ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          spacing: 8,
          children: [
            const ZText('Where', variant: TextVariant.h3, style: TextStyle(fontSize: 14)),
            Row(
              spacing: 8,
              children: [
                for (final p in _places)
                  Expanded(
                    child: ZChip(label: p, padding: 6, selected: _place == p, onTap: () => setState(() => _place = p)),
                  ),
              ],
            ),
          ],
        ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          spacing: 8,
          children: [
            const ZText('Group size', variant: TextVariant.h3, style: TextStyle(fontSize: 14)),
            Row(
              spacing: 14,
              children: [
                ZIconButton(icon: LucideIcons.minus, label: 'Fewer people', onTap: () => setState(() => _size = (_size - 1).clamp(1, 8))),
                SizedBox(
                  width: 40,
                  child: Semantics(
                    liveRegion: true,
                    child: Text(
                      '$_size',
                      textAlign: TextAlign.center,
                      style: mono(FontWeight.w700, 22, 28).copyWith(color: Palette.ink),
                    ),
                  ),
                ),
                ZIconButton(icon: LucideIcons.plus, label: 'More people', onTap: () => setState(() => _size = (_size + 1).clamp(1, 8))),
                ZText('partners wanted', variant: TextVariant.small, muted: true),
              ],
            ),
          ],
        ),
      ],
    );
  }
}
