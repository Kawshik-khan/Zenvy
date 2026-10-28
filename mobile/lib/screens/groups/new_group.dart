import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../state/app_state.dart';
import '../../widgets/widgets.dart';

class NewGroupScreen extends StatefulWidget {
  const NewGroupScreen({super.key});

  @override
  State<NewGroupScreen> createState() => _NewGroupScreenState();
}

class _NewGroupScreenState extends State<NewGroupScreen> {
  String _name = '';
  String _subject = '';
  String _description = '';
  bool _busy = false;

  @override
  Widget build(BuildContext context) {
    final valid = _name.trim().isNotEmpty && _subject.trim().isNotEmpty;
    return Screen(
      header: const TopBar(title: 'New study group', close: true, fallback: '/groups'),
      footer: Padding(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
        child: ZButton(
          label: _busy ? 'Creating…' : 'Create group',
          variant: ButtonVariant.chat,
          size: ButtonSize.lg,
          disabled: !valid || _busy,
          onTap: () async {
            setState(() => _busy = true);
            final app = AppScope.read(context);
            String? id;
            final ok = await attempt(context, () async {
              id = await app.api.createGroup(
                name: _name.trim(),
                subject: _subject.trim(),
                description: _description.trim().isEmpty ? null : _description.trim(),
              );
            });
            if (!context.mounted) return;
            setState(() => _busy = false);
            if (ok && id != null) {
              app.touch();
              context.pushReplacement('/groups/$id');
            }
          },
        ),
      ),
      children: [
        ZText("You'll be the group's admin. Members can chat, share resources and schedule sessions.", muted: true),
        Field(
          label: 'Group name',
          maxLength: 100,
          placeholder: 'Algorithms Circle',
          capitalization: TextCapitalization.words,
          onChanged: (v) => setState(() => _name = v),
        ),
        Field(label: 'Subject or course', maxLength: 100, placeholder: 'CSE221', onChanged: (v) => setState(() => _subject = v)),
        Field(
          label: 'What is it for? (optional)',
          multiline: true,
          maxLength: 500,
          placeholder: 'Timed problem sets every Tue & Thu.',
          onChanged: (v) => setState(() => _description = v),
        ),
      ],
    );
  }
}
