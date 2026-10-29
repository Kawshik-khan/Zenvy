import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:livekit_client/livekit_client.dart' as lk;
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../api/client.dart';
import '../../data/models.dart';
import '../../state/app_state.dart';
import '../../theme/tokens.dart';
import '../../util/dialogs.dart';
import '../../util/focus_timer.dart';
import '../../widgets/widgets.dart';

class _Control extends StatelessWidget {
  const _Control({required this.icon, required this.label, required this.onTap, this.active, this.danger = false});

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool? active;
  final bool danger;

  @override
  Widget build(BuildContext context) {
    final on = active ?? false;
    final bg = danger
        ? Palette.alert
        : on
        ? Palette.quietInk
        : Palette.quietCard;
    Widget glyph = Icon(icon, size: 22, color: on && !danger ? Palette.quietCard : Palette.quietInk);
    if (danger) glyph = Transform.rotate(angle: 135 * math.pi / 180, child: glyph);
    return Semantics(
      button: true,
      label: label,
      selected: active,
      excludeSemantics: true,
      child: GestureDetector(
        onTap: onTap,
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            Positioned(
              left: 3,
              top: 3,
              right: -3,
              bottom: -3,
              child: DecoratedBox(
                decoration: BoxDecoration(color: Palette.quietInk, borderRadius: BorderRadius.circular(14)),
              ),
            ),
            Container(
              width: danger ? 72 : 56,
              height: 56,
              decoration: BoxDecoration(
                color: bg,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: Palette.quietInk, width: 2),
              ),
              child: glyph,
            ),
          ],
        ),
      ),
    );
  }
}

/// A live call over LiveKit. Opens with [callId] to join a call, or with [conversationId]
/// (a DM) or [groupId] to start one, through the same /api/calls routes the web app uses.
class ActiveCallScreen extends StatefulWidget {
  const ActiveCallScreen({super.key, this.callId, this.conversationId, this.groupId, required this.title, this.video = false});

  final String? callId;
  final String? conversationId;
  final String? groupId;
  final String title;
  final bool video;

  @override
  State<ActiveCallScreen> createState() => _ActiveCallScreenState();
}

class _ActiveCallScreenState extends State<ActiveCallScreen> {
  lk.Room? _room;
  String? _callId;
  Object? _error;
  bool _connecting = true;
  bool _mic = true;
  late bool _cam = widget.video;
  int _elapsed = 0;
  Timer? _clock;
  Timer? _statusPoll;
  lk.EventsListener<lk.RoomEvent>? _events;
  // Set for DM calls, which end for both sides as soon as one person hangs up.
  String? _dmConversationId;
  bool _left = false;
  late final AppState _app;

  @override
  void initState() {
    super.initState();
    _app = AppScope.read(context);
    unawaited(_connect());
  }

  Future<void> _quietly(Future<void> Function() run) async {
    try {
      await run();
    } catch (_) {}
  }

  Future<void> _connect() async {
    final api = _app.api;
    setState(() {
      _connecting = true;
      _error = null;
    });
    try {
      final session = widget.callId != null
          ? await api.joinCall(widget.callId!)
          : await api.startCall(conversationId: widget.conversationId, groupId: widget.groupId, video: widget.video);
      _callId = session.call.id;
      _dmConversationId = session.call.type == 'DM' ? session.call.conversationId : null;
      final room = lk.Room(roomOptions: const lk.RoomOptions(adaptiveStream: true, dynacast: true));
      room.addListener(_onRoomChanged);
      final events = room.createListener();
      events
        ..on<lk.ParticipantDisconnectedEvent>((e) {
          final othersLeft = room.remoteParticipants.values.where((p) => p.identity != e.participant.identity).isEmpty;
          if (_dmConversationId != null && othersLeft) unawaited(_endedElsewhere());
        })
        ..on<lk.RoomDisconnectedEvent>((_) => unawaited(_endedElsewhere()));
      _events = events;
      await room.connect(session.liveKit.serverUrl, session.liveKit.token);
      _room = room;
      await room.localParticipant?.setMicrophoneEnabled(_mic);
      if (_cam) await room.localParticipant?.setCameraEnabled(true);
      _clock = Timer.periodic(const Duration(seconds: 1), (_) => setState(() => _elapsed++));
      // Catches a decline, or a hang-up while still ringing, which never reach the room.
      if (_dmConversationId != null) _statusPoll = Timer.periodic(const Duration(seconds: 4), (_) => unawaited(_checkStillLive()));
    } catch (error) {
      _error = error;
      // A started call that couldn't connect shouldn't keep ringing for the other person.
      final id = _callId;
      if (id != null) unawaited(_quietly(() => api.leaveCall(id)));
    }
    if (mounted) setState(() => _connecting = false);
  }

  void _onRoomChanged() {
    if (mounted) setState(() {});
  }

  Future<void> _toggleMic() async {
    setState(() => _mic = !_mic);
    await _quietly(() async => _room?.localParticipant?.setMicrophoneEnabled(_mic));
  }

  Future<void> _toggleCam() async {
    setState(() => _cam = !_cam);
    try {
      await _room?.localParticipant?.setCameraEnabled(_cam);
    } catch (_) {
      if (mounted) {
        setState(() => _cam = false);
        showMessage(context, "Couldn't start your camera. Check Zenvy's camera permission.", error: true);
      }
    }
  }

  Future<void> _checkStillLive() async {
    final conversationId = _dmConversationId;
    final id = _callId;
    if (_left || conversationId == null || id == null) return;
    try {
      if (!await _app.api.dmCallLive(conversationId, id)) await _endedElsewhere();
    } catch (_) {
      // A missed check just waits for the next one.
    }
  }

  /// The other side hung up, declined, or the room closed: leave too instead of waiting alone.
  Future<void> _endedElsewhere() async {
    if (_left || !mounted) return;
    // Close a "Leave this call?" dialog first, so going back pops this screen and not the dialog.
    final route = ModalRoute.of(context);
    Navigator.of(context).popUntil((r) => r == route);
    showMessage(context, 'Call ended');
    await _leave();
  }

  Future<void> _leave() async {
    if (_left) return;
    _left = true;
    _clock?.cancel();
    _statusPoll?.cancel();
    unawaited(_events?.dispose());
    _events = null;
    final room = _room;
    _room = null;
    room?.removeListener(_onRoomChanged);
    if (room != null) {
      await _quietly(room.disconnect);
      await _quietly(room.dispose);
    }
    final id = _callId;
    if (id != null) await _quietly(() => _app.api.leaveCall(id));
    _app.touch();
    if (mounted) goBack(context, '/messages');
  }

  @override
  void dispose() {
    _clock?.cancel();
    _statusPoll?.cancel();
    unawaited(_events?.dispose());
    final room = _room;
    if (room != null && !_left) {
      room.removeListener(_onRoomChanged);
      unawaited(
        _quietly(() async {
          await room.disconnect();
          await room.dispose();
        }),
      );
      final id = _callId;
      if (id != null) unawaited(_quietly(() => _app.api.leaveCall(id)));
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _confirmLeave();
      },
      child: Screen(
        volume: Volume.quiet,
        body: Padding(
          padding: const EdgeInsets.all(16),
          child: _connecting
              ? Column(
                  children: [
                    _header(),
                    const Expanded(child: LoadingView(label: 'Connecting')),
                  ],
                )
              : _error != null
              ? Column(
                  children: [
                    _header(),
                    Expanded(
                      child: Center(
                        child: EmptyCard(
                          // 409: they're in a focus session, so the call was held instead of ringing.
                          title: _error is ApiException && (_error as ApiException).status == 409 ? 'In a focus session' : "Couldn't join the call",
                          detail: errorMessage(_error),
                          action: Row(
                            mainAxisSize: MainAxisSize.min,
                            spacing: 10,
                            children: [
                              ZButton(label: 'Try again', variant: ButtonVariant.secondary, size: ButtonSize.sm, onTap: _connect),
                              ZButton(label: 'Close', size: ButtonSize.sm, onTap: () => goBack(context, '/messages')),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                )
              : _callBody(),
        ),
      ),
    );
  }

  void _confirmLeave() => confirm(context, 'Leave this call?', 'The call keeps going for everyone else.', 'Leave', _leave);

  Widget _header() {
    final people = _room == null ? 0 : _room!.remoteParticipants.length + 1;
    return Row(
      spacing: 10,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          decoration: BoxDecoration(
            color: _room != null ? Palette.live : Palette.quietCard,
            borderRadius: BorderRadius.circular(99),
            border: Border.all(color: Palette.quietInk, width: 2),
          ),
          child: Row(
            spacing: 6,
            children: [
              Container(
                width: 8,
                height: 8,
                decoration: const BoxDecoration(color: Palette.quietInk, shape: BoxShape.circle),
              ),
              ZText(
                formatClock(_elapsed),
                variant: TextVariant.mono,
                semanticsLabel: 'Call time ${formatClock(_elapsed)}',
                style: const TextStyle(fontSize: 12),
              ),
            ],
          ),
        ),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ZText(widget.title, variant: TextVariant.h3, maxLines: 1, style: const TextStyle(fontSize: 16)),
              ZText(
                people <= 1 ? (_room == null ? 'Connecting' : 'Waiting for others to join') : '$people in call',
                variant: TextVariant.small,
                muted: true,
                style: const TextStyle(fontSize: 12),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _callBody() {
    final room = _room!;
    final tiles = <Widget>[
      if (room.localParticipant != null) _Tile(participant: room.localParticipant!, label: 'You', cameraOff: !_cam),
      for (final p in room.remoteParticipants.values) _Tile(participant: p, label: p.name.isNotEmpty ? p.name : 'Zenvy student'),
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      spacing: 14,
      children: [
        _header(),
        Expanded(child: _Grid(children: tiles)),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            _Control(
              icon: _mic ? LucideIcons.mic : LucideIcons.micOff,
              label: _mic ? 'Mute microphone' : 'Unmute microphone',
              active: !_mic,
              onTap: _toggleMic,
            ),
            _Control(
              icon: _cam ? LucideIcons.video : LucideIcons.videoOff,
              label: _cam ? 'Turn camera off' : 'Turn camera on',
              active: !_cam,
              onTap: _toggleCam,
            ),
            _Control(icon: LucideIcons.phone, label: 'Leave call', danger: true, onTap: _confirmLeave),
          ],
        ),
      ],
    );
  }
}

/// One or two columns of tiles filling the space between the header and the controls.
class _Grid extends StatelessWidget {
  const _Grid({required this.children});
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    if (children.length <= 2) {
      return Column(spacing: 10, children: [for (final c in children) Expanded(child: c)]);
    }
    final rows = <Widget>[];
    for (var i = 0; i < children.length; i += 2) {
      rows.add(
        Expanded(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: 10,
            children: [
              for (final c in children.skip(i).take(2)) Expanded(child: c),
              if (i + 1 >= children.length) const Expanded(child: SizedBox()),
            ],
          ),
        ),
      );
    }
    return Column(spacing: 10, children: rows);
  }
}

class _Tile extends StatelessWidget {
  const _Tile({required this.participant, required this.label, this.cameraOff = false});
  final lk.Participant participant;
  final String label;
  final bool cameraOff;

  @override
  Widget build(BuildContext context) {
    final p = participant;
    final video = cameraOff
        ? null
        : p.videoTrackPublications.where((t) => !t.muted && t.track != null).map((t) => t.track).whereType<lk.VideoTrack>().firstOrNull;
    final muted = !p.isMicrophoneEnabled();
    final user = UserRef(id: p.identity, name: label);
    return Semantics(
      label: '$label${p.isSpeaking ? ', speaking' : ''}${muted ? ', muted' : ''}${video == null ? ', camera off' : ''}',
      excludeSemantics: true,
      child: Container(
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          color: video == null ? user.color : Palette.ink,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: p.isSpeaking ? Palette.live : Palette.quietInk, width: p.isSpeaking ? 3 : 2),
        ),
        child: Stack(
          alignment: Alignment.center,
          children: [
            if (video != null)
              Positioned.fill(child: lk.VideoTrackRenderer(video, fit: lk.VideoViewFit.cover))
            else
              Avatar(initials: user.initials, color: Palette.quietCard, size: 72),
            Positioned(
              left: 8,
              bottom: 8,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: Palette.quietCard,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Palette.quietInk, width: 2),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  spacing: 5,
                  children: [
                    if (muted) const Icon(LucideIcons.micOff, size: 13, color: Palette.quietInk),
                    ZText('$label${p.isSpeaking ? ' · speaking' : ''}', variant: TextVariant.h3, style: const TextStyle(fontSize: 12)),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
