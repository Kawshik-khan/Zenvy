import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/sample.dart';
import '../../state/app_state.dart';
import '../../theme/tokens.dart';
import '../../util/dialogs.dart';
import '../../widgets/widgets.dart';

const _lengths = ['30m', '1h', '1h 30m', '2h'];
const _days = ['Tue 27', 'Wed 28', 'Thu 29', 'Fri 30'];
const _times = ['6:00 PM', '7:00 PM', '8:30 PM', '9:30 PM'];

class NewEventScreen extends StatefulWidget {
  const NewEventScreen({super.key});

  @override
  State<NewEventScreen> createState() => _NewEventScreenState();
}

class _NewEventScreenState extends State<NewEventScreen> {
  String _title = '';
  String? _groupId;
  String _day = 'Wed 28';
  String _time = '8:30 PM';
  String _length = '1h 30m';
  bool _inPerson = true;
  String _place = 'BRACU Library, room 3';

  Widget _choices(String label, List<String> options, String value, ValueChanged<String> onTap, {double padding = 4}) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    spacing: 8,
    children: [
      ZText(label, variant: TextVariant.h3, style: const TextStyle(fontSize: 14)),
      Row(
        spacing: 8,
        children: [
          for (final o in options)
            Expanded(
              child: ZChip(label: o, tone: Tone.live, padding: padding, selected: value == o, onTap: () => setState(() => onTap(o))),
            ),
        ],
      ),
    ],
  );

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final mine = groups.where((g) => app.flag(Flag.joinedGroups, g.id)).toList();
    final groupId = _groupId ?? (mine.isNotEmpty ? mine.first.id : 'ac');
    final group = groupById(groupId);
    final members = group?.memberIds.length ?? 1;
    final free = (members - (_time == '9:30 PM' ? 2 : 1)).clamp(1, 99);
    final valid = _title.trim().length >= 3 && (!_inPerson || _place.trim().isNotEmpty);

    return Screen(
      header: const TopBar(title: 'Schedule a session', close: true, fallback: '/events'),
      footer: Padding(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
        child: ZButton(
          label: 'Create & notify group',
          variant: ButtonVariant.live,
          size: ButtonSize.lg,
          disabled: !valid,
          onTap: () {
            final nav = Navigator.of(context);
            notify(context, 'Session created', '${group?.name} members will get a reminder before $_day at $_time.').then((_) => nav.maybePop());
          },
        ),
      ),
      children: [
        Field(label: 'What are you working on?', placeholder: 'Greedy vs DP drill', onChanged: (v) => setState(() => _title = v)),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          spacing: 8,
          children: [
            const ZText("Who's it for", variant: TextVariant.h3, style: TextStyle(fontSize: 14)),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [for (final g in mine) ZChip(label: g.name, tone: Tone.live, selected: groupId == g.id, onTap: () => setState(() => _groupId = g.id))],
            ),
          ],
        ),
        _choices('Day', _days, _day, (v) => _day = v),
        _choices('Start', _times, _time, (v) => _time = v, padding: 2),
        _choices('Length', _lengths, _length, (v) => _length = v),
        Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          spacing: 8,
          children: [
            const ZText('Where', variant: TextVariant.h3, style: TextStyle(fontSize: 14)),
            Row(
              spacing: 8,
              children: [
                Expanded(
                  child: ZChip(label: 'Zenvy call', tone: Tone.live, selected: !_inPerson, onTap: () => setState(() => _inPerson = false)),
                ),
                Expanded(
                  child: ZChip(label: 'In person', tone: Tone.live, selected: _inPerson, onTap: () => setState(() => _inPerson = true)),
                ),
              ],
            ),
            if (_inPerson) Field(label: 'Location', initialValue: _place, onChanged: (v) => setState(() => _place = v)),
          ],
        ),
        Surface(
          tone: Tone.focus,
          shadow: ShadowSize.sm,
          radius: 12,
          padding: const EdgeInsets.all(12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            spacing: 10,
            children: [
              const Icon(LucideIcons.clock, size: 20, color: Palette.ink),
              Expanded(
                child: Text.rich(
                  TextSpan(
                    children: [
                      TextSpan(text: '$free of $members members are free', style: zStyle(context, TextVariant.h3).copyWith(fontSize: 13)),
                      const TextSpan(text: ' at this time based on their availability.'),
                    ],
                  ),
                  style: zStyle(context, TextVariant.small).copyWith(fontSize: 13),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
