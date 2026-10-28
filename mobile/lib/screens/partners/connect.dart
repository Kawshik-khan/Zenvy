import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../data/models.dart';
import '../../state/app_state.dart';
import '../../theme/tokens.dart';
import '../../widgets/widgets.dart';

/// The one action that fits where you stand with someone: connect, requested, accept, or message.
class ConnectButton extends StatefulWidget {
  const ConnectButton({super.key, required this.person, this.size = ButtonSize.sm, this.onChanged});

  final Person person;
  final ButtonSize size;

  /// Called with the updated person after a request is sent or answered.
  final ValueChanged<Person>? onChanged;

  @override
  State<ConnectButton> createState() => _ConnectButtonState();
}

class _ConnectButtonState extends State<ConnectButton> {
  bool _busy = false;

  Future<void> _run(Future<Person> Function() call, {bool celebrate = false}) async {
    setState(() => _busy = true);
    final app = AppScope.read(context);
    Person? updated;
    final ok = await attempt(context, () async => updated = await call());
    if (!mounted) return;
    setState(() => _busy = false);
    if (!ok || updated == null) return;
    widget.onChanged?.call(updated!);
    app.touch();
    if (celebrate && updated!.connection?.accepted == true) context.push('/matched/${updated!.id}');
  }

  @override
  Widget build(BuildContext context) {
    final p = widget.person;
    final c = p.connection;
    final api = AppScope.read(context).api;

    if (c?.accepted == true) {
      return ZButton(label: 'Message', variant: ButtonVariant.chat, size: widget.size, icon: LucideIcons.messageSquare, href: '/dm/${p.id}');
    }
    if (c?.pendingIncoming == true) {
      return ZButton(
        label: _busy ? 'Accepting…' : 'Accept',
        variant: ButtonVariant.match,
        size: widget.size,
        icon: LucideIcons.userCheck,
        disabled: _busy,
        semanticLabel: 'Accept ${p.name}\'s request',
        onTap: () => _run(() => api.respondToRequest(p.id, accept: true), celebrate: true),
      );
    }
    if (c?.pendingOutgoing == true) {
      return ZButton(label: 'Requested', variant: ButtonVariant.match, size: widget.size, settled: true, semanticLabel: 'Request sent to ${p.name}');
    }
    if (c?.rejected == true) {
      return ZButton(label: 'Not available', variant: ButtonVariant.secondary, size: widget.size, disabled: true);
    }
    return ZButton(
      label: _busy ? 'Sending…' : 'Connect',
      variant: ButtonVariant.match,
      size: widget.size,
      icon: LucideIcons.userPlus,
      disabled: _busy,
      semanticLabel: 'Connect with ${p.name}',
      onTap: () async {
        final note = await showConnectSheet(context, p);
        if (note != null && mounted) await _run(() => api.connect(p.id, note: note));
      },
    );
  }
}

/// Asks for an optional note; returns null when cancelled.
Future<String?> showConnectSheet(BuildContext context, Person person) {
  return showModalBottomSheet<String>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Palette.paper,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(Radii.lg)),
      side: BorderSide(color: Palette.ink, width: 3),
    ),
    builder: (context) => _ConnectSheet(person: person),
  );
}

class _ConnectSheet extends StatefulWidget {
  const _ConnectSheet({required this.person});
  final Person person;

  @override
  State<_ConnectSheet> createState() => _ConnectSheetState();
}

class _ConnectSheetState extends State<_ConnectSheet> {
  final _note = TextEditingController();

  @override
  void dispose() {
    _note.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(20, 20, 20, 20 + MediaQuery.viewInsetsOf(context).bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: 14,
        children: [
          ZText('Connect with ${widget.person.firstName}', variant: TextVariant.h2, header: true),
          ZText("Once they accept, you can message and call each other.", variant: TextVariant.small, muted: true),
          Field(label: 'Add a note (optional)', controller: _note, multiline: true, maxLength: 180, placeholder: 'Want to do CSE221 timed sets together?'),
          Row(
            spacing: 12,
            children: [
              Expanded(
                child: ZButton(label: 'Cancel', variant: ButtonVariant.secondary, onTap: () => Navigator.of(context).pop()),
              ),
              Expanded(
                flex: 2,
                child: ZButton(label: 'Send request', variant: ButtonVariant.match, onTap: () => Navigator.of(context).pop(_note.text)),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
