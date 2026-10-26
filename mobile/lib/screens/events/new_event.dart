import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/models.dart';
import '../../state/app_state.dart';
import '../../theme/tokens.dart';
import '../../widgets/widgets.dart';

const _lengths = [(30, '30m'), (60, '1h'), (90, '1h 30m'), (120, '2h')];

class NewEventScreen extends StatefulWidget {
  const NewEventScreen({super.key, this.groupId});
  final String? groupId;

  @override
  State<NewEventScreen> createState() => _NewEventScreenState();
}

class _NewEventScreenState extends State<NewEventScreen> {
  String _title = '';
  late String? _groupId = widget.groupId;
  late DateTime _date = DateTime.now().add(const Duration(days: 1));
  TimeOfDay _time = const TimeOfDay(hour: 19, minute: 0);
  int _minutes = 60;
  bool _inPerson = false;
  String _place = '';
  String _description = '';
  bool _busy = false;

  DateTime get _start => DateTime(_date.year, _date.month, _date.day, _time.hour, _time.minute);

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _date,
      firstDate: DateTime(now.year, now.month, now.day),
      lastDate: now.add(const Duration(days: 365)),
    );
    if (picked != null) setState(() => _date = picked);
  }

  Future<void> _pickTime() async {
    final picked = await showTimePicker(context: context, initialTime: _time);
    if (picked != null) setState(() => _time = picked);
  }

  Future<void> _create() async {
    if (_start.isBefore(DateTime.now())) return showMessage(context, 'Pick a time in the future.', error: true);
    setState(() => _busy = true);
    final app = AppScope.read(context);
    final ok = await attempt(
      context,
      () => app.api.createEvent(
        title: _title.trim(),
        start: _start,
        end: _start.add(Duration(minutes: _minutes)),
        groupId: _groupId,
        inPerson: _inPerson,
        location: _inPerson ? _place.trim() : 'Zenvy call',
        description: _description.trim().isEmpty ? null : _description.trim(),
      ),
      success: _groupId != null ? 'Session scheduled. Your group can see it now.' : 'Session scheduled',
    );
    if (!mounted) return;
    setState(() => _busy = false);
    if (ok) {
      app.touch();
      goBack(context, '/events');
    }
  }

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final valid = _title.trim().length >= 3 && (!_inPerson || _place.trim().isNotEmpty);
    return Screen(
      header: const TopBar(title: 'Schedule a session', close: true, fallback: '/events'),
      footer: Padding(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
        child: ZButton(
          label: _busy ? 'Scheduling…' : 'Schedule session',
          variant: ButtonVariant.live,
          size: ButtonSize.lg,
          disabled: !valid || _busy,
          onTap: _create,
        ),
      ),
      children: [
        Field(label: 'What are you working on?', maxLength: 120, placeholder: 'Greedy vs DP drill', onChanged: (v) => setState(() => _title = v)),
        Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          spacing: 8,
          children: [
            const ZText("Who's it for", variant: TextVariant.h3, style: TextStyle(fontSize: 14)),
            Loader<({List<GroupCard> mine, List<GroupCard> discover})>(
              load: () => app.api.groups(),
              frame: (context, body) => const SizedBox(height: 44),
              builder: (context, groups, _) => Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  ZChip(label: 'Just me', tone: Tone.live, selected: _groupId == null, onTap: () => setState(() => _groupId = null)),
                  for (final g in groups.mine) ZChip(label: g.name, tone: Tone.live, selected: _groupId == g.id, onTap: () => setState(() => _groupId = g.id)),
                ],
              ),
            ),
          ],
        ),
        Row(
          spacing: 10,
          children: [
            Expanded(
              child: _PickerTile(
                icon: LucideIcons.calendar,
                label: 'Day',
                value: '${weekdayShort(_date)}, ${monthShort(_date)} ${_date.day}',
                onTap: _pickDate,
              ),
            ),
            Expanded(
              child: _PickerTile(icon: LucideIcons.clock, label: 'Start', value: clockTime(_start), onTap: _pickTime),
            ),
          ],
        ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          spacing: 8,
          children: [
            const ZText('Length', variant: TextVariant.h3, style: TextStyle(fontSize: 14)),
            Row(
              spacing: 8,
              children: [
                for (final (m, label) in _lengths)
                  Expanded(
                    child: ZChip(label: label, tone: Tone.live, padding: 4, selected: _minutes == m, onTap: () => setState(() => _minutes = m)),
                  ),
              ],
            ),
          ],
        ),
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
            if (_inPerson) Field(label: 'Location', maxLength: 160, placeholder: 'Library, room 3', onChanged: (v) => setState(() => _place = v)),
          ],
        ),
        Field(
          label: 'Notes (optional)',
          multiline: true,
          maxLength: 500,
          placeholder: 'Bring one problem you\'re stuck on.',
          onChanged: (v) => _description = v,
        ),
        ZText('Ends ${clockTime(_start.add(Duration(minutes: _minutes)))}. You\'re added as going.', variant: TextVariant.small, muted: true),
      ],
    );
  }
}

class _PickerTile extends StatelessWidget {
  const _PickerTile({required this.icon, required this.label, required this.value, required this.onTap});
  final IconData icon;
  final String label;
  final String value;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Surface(
    shadow: ShadowSize.sm,
    radius: 12,
    onTap: onTap,
    semanticLabel: '$label: $value. Change',
    padding: const EdgeInsets.all(12),
    child: Row(
      spacing: 10,
      children: [
        Icon(icon, size: 20, color: Palette.ink),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ZText(label, variant: TextVariant.small, muted: true, style: const TextStyle(fontSize: 12)),
              ZText(value, variant: TextVariant.h3, maxLines: 1, style: const TextStyle(fontSize: 14)),
            ],
          ),
        ),
      ],
    ),
  );
}
