import 'package:flutter/material.dart';

import '../../state/app_state.dart';
import '../../widgets/widgets.dart';

const _modes = [('ONLINE', 'Online'), ('IN_PERSON', 'In person'), ('HYBRID', 'Either')];

class PostAdScreen extends StatefulWidget {
  const PostAdScreen({super.key});

  @override
  State<PostAdScreen> createState() => _PostAdScreenState();
}

class _PostAdScreenState extends State<PostAdScreen> {
  String _title = '';
  String _subjects = '';
  String _availability = '';
  String _description = '';
  String _mode = 'ONLINE';
  bool _busy = false;

  @override
  Widget build(BuildContext context) {
    final valid = _title.trim().length >= 4 && _subjects.trim().isNotEmpty && _availability.trim().isNotEmpty && _description.trim().isNotEmpty;
    return Screen(
      header: const TopBar(title: 'Post a study ad', close: true, fallback: '/partners'),
      footer: Padding(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
        child: ZButton(
          label: _busy ? 'Publishing…' : 'Publish ad',
          variant: ButtonVariant.match,
          size: ButtonSize.lg,
          disabled: !valid || _busy,
          onTap: () async {
            setState(() => _busy = true);
            final app = AppScope.read(context);
            final ok = await attempt(
              context,
              () => app.api.postStudyAd(
                title: _title.trim(),
                subjects: _subjects.trim(),
                availability: _availability.trim(),
                description: _description.trim(),
                mode: _mode,
              ),
              success: 'Ad published. It shows on Find partners.',
            );
            if (!context.mounted) return;
            setState(() => _busy = false);
            if (ok) {
              app.touch();
              goBack(context, '/partners');
            }
          },
        ),
      ),
      children: [
        ZText("Tell classmates what you're working on. Ads show at the top of Find partners.", muted: true),
        Field(label: 'Headline', maxLength: 100, placeholder: 'Need 2 people for CSE221 timed sets', onChanged: (v) => setState(() => _title = v)),
        Field(label: 'Course or topic', maxLength: 200, placeholder: 'CSE221 · Algorithms', onChanged: (v) => setState(() => _subjects = v)),
        Field(label: 'When', maxLength: 200, placeholder: 'Tue & Thu evenings', onChanged: (v) => setState(() => _availability = v)),
        Field(
          label: 'Details',
          multiline: true,
          maxLength: 800,
          placeholder: "What you'll work on and who you're looking for.",
          hint: '${_description.length} / 800',
          onChanged: (v) => setState(() => _description = v),
        ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          spacing: 8,
          children: [
            const ZText('Where', variant: TextVariant.h3, style: TextStyle(fontSize: 14)),
            Row(
              spacing: 8,
              children: [
                for (final (key, label) in _modes)
                  Expanded(
                    child: ZChip(label: label, padding: 6, selected: _mode == key, onTap: () => setState(() => _mode = key)),
                  ),
              ],
            ),
          ],
        ),
      ],
    );
  }
}
