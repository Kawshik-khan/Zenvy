// Models for the JSON the backend returns (see app/api/mobile in the web app).
import 'dart:ui';

import '../theme/tokens.dart';

typedef Json = Map<String, dynamic>;

String? _str(Object? v) => v is String && v.isNotEmpty ? v : null;
int _int(Object? v) => v is num ? v.toInt() : 0;
double _num(Object? v) => v is num ? v.toDouble() : 0;
bool _bool(Object? v) => v == true;
DateTime? _date(Object? v) => v is String ? DateTime.tryParse(v)?.toLocal() : null;
List<String> _strings(Object? v) => v is List ? v.whereType<String>().toList() : const [];
List<T> _list<T>(Object? v, T Function(Json) f) => v is List ? v.whereType<Map>().map((e) => f(e.cast<String, dynamic>())).toList() : <T>[];

const _avatarColors = [Palette.match, Palette.chat, Palette.focus, Palette.live, Palette.career];

/// A stable accent per person or group, so avatars keep their colour across screens.
Color colorFor(String id) => _avatarColors[id.codeUnits.fold<int>(0, (a, b) => (a * 31 + b) & 0x7fffffff) % _avatarColors.length];

String initialsFor(String name) {
  final parts = name.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
  if (parts.isEmpty) return '?';
  String lead(String s, int n) => s.runes.take(n).map(String.fromCharCode).join();
  if (parts.length == 1) return lead(parts.first, 2).toUpperCase();
  return (lead(parts.first, 1) + lead(parts.last, 1)).toUpperCase();
}

/// A user as other people see them.
class UserRef {
  const UserRef({required this.id, required this.name, this.image});
  final String id;
  final String name;
  final String? image;

  factory UserRef.fromJson(Json j) => UserRef(id: j['id'] as String, name: _str(j['name']) ?? 'Zenvy student', image: _str(j['image']));

  String get initials => initialsFor(name);
  Color get color => colorFor(id);
  String get firstName => name.split(' ').first;
}

class Connection {
  const Connection({required this.status, required this.outgoing});
  final String status;
  final bool outgoing;

  factory Connection.fromJson(Json j) => Connection(status: j['status'] as String? ?? 'PENDING', outgoing: j['direction'] == 'outgoing');

  bool get accepted => status == 'ACCEPTED';
  bool get pendingOutgoing => status == 'PENDING' && outgoing;
  bool get pendingIncoming => status == 'PENDING' && !outgoing;
  bool get rejected => status == 'REJECTED';
}

class Person extends UserRef {
  const Person({
    required super.id,
    required super.name,
    super.image,
    this.uniqueId,
    this.college,
    this.major,
    this.semester,
    this.bio,
    this.studyStyle,
    this.interests = const [],
    this.availability,
    this.score = 0,
    this.reasons = const [],
    this.connection,
    this.requestNotificationId,
    this.requestNote,
    this.sharedGroups = const [],
    this.blockedByMe = false,
    this.role,
  });

  final String? uniqueId;
  final String? college;
  final String? major;
  final int? semester;
  final String? bio;
  final String? studyStyle;
  final List<String> interests;
  final String? availability;
  final int score;
  final List<String> reasons;
  final Connection? connection;
  final String? requestNotificationId;
  final String? requestNote;
  final List<UserRef> sharedGroups;
  final bool blockedByMe;

  /// Group role when listed as a member.
  final String? role;

  factory Person.fromJson(Json j) => Person(
    id: j['id'] as String,
    name: _str(j['name']) ?? 'Zenvy student',
    image: _str(j['image']),
    uniqueId: _str(j['uniqueId']),
    college: _str(j['college']),
    major: _str(j['major']),
    semester: j['semester'] is num ? _int(j['semester']) : null,
    bio: _str(j['bio']),
    studyStyle: _str(j['studyStyle']),
    interests: _strings(j['interests']),
    availability: _str(j['availability']),
    score: _int(j['score']),
    reasons: _strings(j['reasons']),
    connection: j['connection'] is Map ? Connection.fromJson((j['connection'] as Map).cast()) : null,
    requestNotificationId: _str(j['requestNotificationId']),
    requestNote: _str(j['requestNote']),
    sharedGroups: _list(j['sharedGroups'], UserRef.fromJson),
    blockedByMe: _bool(j['blockedByMe']),
    role: _str(j['role']),
  );

  /// "Computer Science · Semester 5 · BRAC University", skipping what's missing.
  String get academicLine => [major, if (semester != null) 'Semester $semester', college].whereType<String>().join(' · ');
}

class Me extends Person {
  const Me({
    required super.id,
    required super.name,
    super.image,
    super.uniqueId,
    super.college,
    super.major,
    super.semester,
    super.bio,
    super.studyStyle,
    super.interests,
    super.availability,
    required this.email,
    required this.hasPassword,
    required this.matchingAvailable,
    required this.onboarded,
    required this.partnerCount,
    required this.groupCount,
  });

  final String? email;
  final bool hasPassword;
  final bool matchingAvailable;
  final bool onboarded;
  final int partnerCount;
  final int groupCount;

  factory Me.fromJson(Json j) {
    final p = Person.fromJson(j);
    final counts = (j['counts'] as Map?)?.cast<String, dynamic>() ?? const {};
    return Me(
      id: p.id,
      name: p.name,
      image: p.image,
      uniqueId: p.uniqueId,
      college: p.college,
      major: p.major,
      semester: p.semester,
      bio: p.bio,
      studyStyle: p.studyStyle,
      interests: p.interests,
      availability: p.availability,
      email: _str(j['email']),
      // Older servers don't send it; asking for a password is the safe default.
      hasPassword: j['hasPassword'] != false,
      matchingAvailable: j['matchingAvailable'] != false,
      onboarded: _bool(j['onboarded']),
      partnerCount: _int(counts['partners']),
      groupCount: _int(counts['groups']),
    );
  }
}

class StudyAd {
  const StudyAd({
    required this.id,
    required this.title,
    required this.description,
    required this.subjects,
    required this.availability,
    required this.mode,
    required this.author,
    this.createdAt,
  });
  final String id;
  final String title;
  final String description;
  final String subjects;
  final String availability;
  final String mode;
  final Person author;
  final DateTime? createdAt;

  factory StudyAd.fromJson(Json j) => StudyAd(
    id: j['id'] as String,
    title: j['title'] as String? ?? '',
    description: j['description'] as String? ?? '',
    subjects: j['subjects'] as String? ?? '',
    availability: j['availability'] as String? ?? '',
    mode: j['mode'] as String? ?? 'ANY',
    author: Person.fromJson((j['author'] as Map).cast()),
    createdAt: _date(j['createdAt']),
  );

  String get modeLabel => switch (mode) {
    'ONLINE' => 'Online',
    'IN_PERSON' => 'In person',
    'HYBRID' => 'Hybrid',
    _ => 'Any',
  };
}

class LastMessage {
  const LastMessage({required this.content, required this.senderName, this.at});
  final String content;
  final String senderName;
  final DateTime? at;

  static LastMessage? fromJson(Object? v) {
    if (v is! Map) return null;
    final j = v.cast<String, dynamic>();
    return LastMessage(content: j['content'] as String? ?? '', senderName: _str(j['senderName']) ?? 'Someone', at: _date(j['createdAt'] ?? j['timestamp']));
  }
}

class EventItem {
  const EventItem({
    required this.id,
    required this.title,
    this.description,
    required this.start,
    required this.end,
    this.location,
    required this.type,
    this.group,
    this.creator,
    required this.goingCount,
    required this.going,
    this.myStatus,
    required this.canCancel,
  });

  final String id;
  final String title;
  final String? description;
  final DateTime start;
  final DateTime end;
  final String? location;
  final String type;
  final UserRef? group;
  final UserRef? creator;
  final int goingCount;
  final List<UserRef> going;
  final String? myStatus;
  final bool canCancel;

  bool get isGoing => myStatus == 'GOING';
  bool get inPerson => type == 'IN_PERSON';

  factory EventItem.fromJson(Json j) => EventItem(
    id: j['id'] as String,
    title: j['title'] as String? ?? '',
    description: _str(j['description']),
    start: _date(j['startTime']) ?? DateTime.now(),
    end: _date(j['endTime']) ?? DateTime.now(),
    location: _str(j['location']),
    type: j['type'] as String? ?? 'VIRTUAL',
    group: j['group'] is Map ? UserRef.fromJson((j['group'] as Map).cast()) : null,
    creator: j['creator'] is Map ? UserRef.fromJson((j['creator'] as Map).cast()) : null,
    goingCount: _int(j['goingCount']),
    going: _list(j['going'], UserRef.fromJson),
    myStatus: _str(j['myStatus']),
    canCancel: _bool(j['canCancel']),
  );
}

class GroupCard {
  const GroupCard({
    required this.id,
    required this.name,
    this.subject,
    this.description,
    required this.memberCount,
    this.myRole,
    this.lastMessage,
    this.reasons = const [],
  });
  final String id;
  final String name;
  final String? subject;
  final String? description;
  final int memberCount;
  final String? myRole;
  final LastMessage? lastMessage;
  final List<String> reasons;

  String get initials => initialsFor(name);
  Color get color => colorFor(id);

  factory GroupCard.fromJson(Json j) => GroupCard(
    id: j['id'] as String,
    name: j['name'] as String? ?? 'Study group',
    subject: _str(j['subject']),
    description: _str(j['description']),
    memberCount: _int(j['memberCount']),
    myRole: _str(j['myRole']),
    lastMessage: LastMessage.fromJson(j['lastMessage']),
    reasons: _strings(j['reasons']),
  );
}

class GroupResource {
  const GroupResource({
    required this.id,
    required this.title,
    this.description,
    required this.type,
    this.url,
    this.fileName,
    required this.pinned,
    required this.creatorName,
    this.createdAt,
  });
  final String id;
  final String title;
  final String? description;
  final String type;
  final String? url;
  final String? fileName;
  final bool pinned;
  final String creatorName;
  final DateTime? createdAt;

  factory GroupResource.fromJson(Json j) => GroupResource(
    id: j['id'] as String,
    title: j['title'] as String? ?? '',
    description: _str(j['description']),
    type: j['type'] as String? ?? 'LINK',
    url: _str(j['url']),
    fileName: _str(j['fileName']),
    pinned: _bool(j['pinned']),
    creatorName: _str(j['creatorName']) ?? 'Someone',
    createdAt: _date(j['createdAt']),
  );
}

class LiveCall {
  const LiveCall({required this.id, required this.mediaType, required this.participants});
  final String id;
  final String mediaType;
  final List<UserRef> participants;

  static LiveCall? fromJson(Object? v) {
    if (v is! Map) return null;
    final j = v.cast<String, dynamic>();
    return LiveCall(id: j['id'] as String, mediaType: j['mediaType'] as String? ?? 'AUDIO', participants: _list(j['participants'], UserRef.fromJson));
  }
}

class GroupDetail {
  const GroupDetail({
    required this.id,
    required this.name,
    this.subject,
    this.description,
    required this.isMember,
    this.myRole,
    required this.members,
    required this.resources,
    required this.events,
    this.liveCall,
  });

  final String id;
  final String name;
  final String? subject;
  final String? description;
  final bool isMember;
  final String? myRole;
  final List<Person> members;
  final List<GroupResource> resources;
  final List<EventItem> events;
  final LiveCall? liveCall;

  String get initials => initialsFor(name);
  Color get color => colorFor(id);

  factory GroupDetail.fromJson(Json j) => GroupDetail(
    id: j['id'] as String,
    name: j['name'] as String? ?? 'Study group',
    subject: _str(j['subject']),
    description: _str(j['description']),
    isMember: _bool(j['isMember']),
    myRole: _str(j['myRole']),
    members: _list(j['members'], Person.fromJson),
    resources: _list(j['resources'], GroupResource.fromJson),
    events: _list(j['events'], EventItem.fromJson),
    liveCall: LiveCall.fromJson(j['liveCall']),
  );
}

class ChannelCard {
  const ChannelCard({required this.id, required this.name, required this.tag, this.description, required this.memberCount, this.lastMessage});
  final String id;
  final String name;
  final String tag;
  final String? description;
  final int memberCount;
  final LastMessage? lastMessage;

  Color get color => colorFor(id);

  factory ChannelCard.fromJson(Json j) => ChannelCard(
    id: j['id'] as String,
    name: j['name'] as String? ?? '',
    tag: j['tag'] as String? ?? '',
    description: _str(j['description']),
    memberCount: _int(j['memberCount']),
    lastMessage: LastMessage.fromJson(j['lastMessage']),
  );
}

class DirectConversation {
  const DirectConversation({required this.id, required this.title, this.avatar, this.peerId, this.lastMessage, required this.unreadCount});
  final String id;
  final String title;
  final String? avatar;
  final String? peerId;
  final LastMessage? lastMessage;
  final int unreadCount;

  String get initials => initialsFor(title);
  Color get color => colorFor(peerId ?? id);

  factory DirectConversation.fromJson(Json j) => DirectConversation(
    id: j['id'] as String,
    title: _str(j['title']) ?? 'Conversation',
    avatar: _str(j['avatar']),
    peerId: _str(j['dmPeerId']),
    lastMessage: LastMessage.fromJson(j['lastMessage']),
    unreadCount: _int(j['unreadCount']),
  );
}

class Inbox {
  const Inbox({required this.direct, required this.groups, required this.channels, required this.suggestedChannels});
  final List<DirectConversation> direct;
  final List<GroupCard> groups;
  final List<ChannelCard> channels;
  final List<ChannelCard> suggestedChannels;

  factory Inbox.fromJson(Json j) => Inbox(
    direct: _list(j['direct'], DirectConversation.fromJson),
    groups: _list(j['groups'], GroupCard.fromJson),
    channels: _list(j['channels'], ChannelCard.fromJson),
    suggestedChannels: _list(j['suggestedChannels'], ChannelCard.fromJson),
  );
}

/// A message in a DM, group or channel thread.
class ChatMessage {
  const ChatMessage({
    required this.id,
    required this.senderId,
    required this.senderName,
    this.senderImage,
    required this.content,
    this.fileUrl,
    this.fileName,
    this.fileType,
    required this.at,
    required this.isSelf,
    this.deleted = false,
    this.pending = false,
  });

  final String id;
  final String senderId;
  final String senderName;
  final String? senderImage;
  final String content;
  final String? fileUrl;
  final String? fileName;
  final String? fileType;
  final DateTime at;
  final bool isSelf;
  final bool deleted;

  /// Sent from this device and not yet confirmed by the server.
  final bool pending;

  UserRef get sender => UserRef(id: senderId, name: senderName, image: senderImage);

  factory ChatMessage.fromJson(Json j) => ChatMessage(
    id: j['id'] as String,
    senderId: j['senderId'] as String? ?? '',
    senderName: _str(j['senderName']) ?? 'Someone',
    senderImage: _str(j['senderImage']),
    content: j['content'] as String? ?? '',
    fileUrl: _str(j['fileUrl']),
    fileName: _str(j['fileName']),
    fileType: _str(j['fileType']),
    at: _date(j['timestamp']) ?? DateTime.now(),
    isSelf: _bool(j['isSelf']),
    deleted: j['status'] == 'DELETED',
  );
}

class AppNotification {
  const AppNotification({
    required this.id,
    required this.type,
    required this.content,
    required this.read,
    this.at,
    this.actor,
    this.targetKind,
    this.targetId,
    required this.pending,
  });
  final String id;
  final String type;
  final String content;
  final bool read;
  final DateTime? at;
  final UserRef? actor;
  final String? targetKind;
  final String? targetId;
  final bool pending;

  /// A match request or group invite still waiting for an answer.
  bool get actionable => pending && (type == 'MATCH_REQUEST' || type == 'GROUP_INVITE');

  factory AppNotification.fromJson(Json j) {
    final target = (j['target'] as Map?)?.cast<String, dynamic>();
    return AppNotification(
      id: j['id'] as String,
      type: j['type'] as String? ?? 'SYSTEM',
      content: j['content'] as String? ?? '',
      read: _bool(j['read']),
      at: _date(j['createdAt']),
      actor: j['actor'] is Map ? UserRef.fromJson((j['actor'] as Map).cast()) : null,
      targetKind: target?['kind'] as String?,
      targetId: target?['id'] as String?,
      pending: _bool(j['pending']),
    );
  }
}

class Period {
  const Period(this.focusMinutes, this.sessions);
  final int focusMinutes;
  final int sessions;

  factory Period.fromJson(Object? v) {
    final j = (v as Map?)?.cast<String, dynamic>() ?? const {};
    return Period(_int(j['focusMinutes']), _int(j['sessions']));
  }
}

class DayMinutes {
  const DayMinutes(this.date, this.minutes, this.level);
  final DateTime date;
  final int minutes;
  final int level;

  factory DayMinutes.fromJson(Json j) => DayMinutes(_date(j['date']) ?? DateTime.now(), _int(j['minutes']), _int(j['level']));
}

class StudyStats {
  const StudyStats({
    required this.todayMinutes,
    required this.todaySessions,
    required this.level,
    required this.levelTitle,
    required this.levelProgress,
    required this.xpToNextLevel,
    required this.streakDays,
    required this.attendanceRate,
    required this.week,
    required this.month,
    required this.all,
    required this.lastSevenDays,
    required this.heatmap,
  });

  final int todayMinutes;
  final int todaySessions;
  final int level;
  final String levelTitle;
  final double levelProgress;
  final int xpToNextLevel;
  final int streakDays;
  final int attendanceRate;
  final Period week;
  final Period month;
  final Period all;
  final List<DayMinutes> lastSevenDays;
  final List<DayMinutes> heatmap;

  factory StudyStats.fromJson(Json j) {
    final today = (j['today'] as Map?)?.cast<String, dynamic>() ?? const {};
    final periods = (j['periods'] as Map?)?.cast<String, dynamic>() ?? const {};
    return StudyStats(
      todayMinutes: _int(today['focusMinutes']),
      todaySessions: _int(today['sessions']),
      level: _int(j['level']),
      levelTitle: _str(j['levelTitle']) ?? '',
      levelProgress: _num(j['levelProgress']).clamp(0, 1),
      xpToNextLevel: _int(j['xpToNextLevel']),
      streakDays: _int(j['streakDays']),
      attendanceRate: _int(j['attendanceRate']),
      week: Period.fromJson(periods['week']),
      month: Period.fromJson(periods['month']),
      all: Period.fromJson(periods['all']),
      lastSevenDays: _list(j['lastSevenDays'], DayMinutes.fromJson),
      heatmap: _list(j['heatmap'], DayMinutes.fromJson),
    );
  }
}

class HomeData {
  const HomeData({
    this.name,
    required this.todayMinutes,
    required this.sessionsToday,
    required this.streakDays,
    this.nextEvent,
    required this.partners,
    required this.groups,
    required this.unreadNotifications,
    required this.unreadMessages,
    this.progress = const HomeProgress(),
    this.todayEvents = const [],
    this.studyingNow = const [],
    this.groupActivity = const {},
    this.todayFocus = const [],
  });

  final String? name;
  final int todayMinutes;
  final int sessionsToday;
  final int streakDays;
  final EventItem? nextEvent;
  final List<Person> partners;
  final List<GroupCard> groups;
  final int unreadNotifications;
  final int unreadMessages;
  final HomeProgress progress;
  final List<EventItem> todayEvents;
  final List<LivePerson> studyingNow;
  final Map<String, GroupActivity> groupActivity;
  final List<FocusBlock> todayFocus;

  factory HomeData.fromJson(Json j) {
    final focus = (j['focus'] as Map?)?.cast<String, dynamic>() ?? const {};
    final unread = (j['unread'] as Map?)?.cast<String, dynamic>() ?? const {};
    return HomeData(
      name: _str(j['name']),
      todayMinutes: _int(focus['todayMinutes']),
      sessionsToday: _int(focus['sessionsToday']),
      streakDays: _int(focus['streakDays']),
      nextEvent: j['nextEvent'] is Map ? EventItem.fromJson((j['nextEvent'] as Map).cast()) : null,
      partners: _list(j['partners'], Person.fromJson),
      groups: _list(j['groups'], GroupCard.fromJson),
      unreadNotifications: _int(unread['notifications']),
      unreadMessages: _int(unread['messages']),
      progress: j['progress'] is Map ? HomeProgress.fromJson((j['progress'] as Map).cast()) : const HomeProgress(),
      todayEvents: _list(j['todayEvents'], EventItem.fromJson),
      studyingNow: _list(j['studyingNow'], LivePerson.fromJson),
      groupActivity: {for (final a in _list(j['groupActivity'], GroupActivity.fromJson)) a.groupId: a},
      todayFocus: _list(j['todayFocus'], FocusBlock.fromJson),
    );
  }
}

/// Level, XP and the last seven days, for the Home constellation and quests card.
class HomeProgress {
  const HomeProgress({
    this.level = 1,
    this.levelTitle = '',
    this.levelProgress = 0,
    this.xpToNextLevel = 0,
    this.totalXp = 0,
    this.week = const Period(0, 0),
    this.all = const Period(0, 0),
    this.lastSevenDays = const [],
  });

  final int level;
  final String levelTitle;
  final double levelProgress;
  final int xpToNextLevel;
  final int totalXp;
  final Period week;
  final Period all;
  final List<DayMinutes> lastSevenDays;

  factory HomeProgress.fromJson(Json j) => HomeProgress(
    level: _int(j['level']).clamp(1, 1 << 20),
    levelTitle: _str(j['levelTitle']) ?? '',
    levelProgress: _num(j['levelProgress']).clamp(0, 1),
    xpToNextLevel: _int(j['xpToNextLevel']),
    totalXp: _int(j['totalXp']),
    week: Period.fromJson(j['week']),
    all: Period.fromJson(j['all']),
    lastSevenDays: _list(j['lastSevenDays'], DayMinutes.fromJson),
  );
}

/// Someone in the viewer's circle who is in a group call now, or just finished a focus session.
class LivePerson {
  const LivePerson({required this.user, required this.inCall, this.groupId, this.groupName, required this.minutes, this.at});
  final UserRef user;
  final bool inCall;
  final String? groupId;
  final String? groupName;
  final int minutes;
  final DateTime? at;

  factory LivePerson.fromJson(Json j) => LivePerson(
    user: UserRef.fromJson((j['user'] as Map).cast()),
    inCall: j['kind'] == 'CALL',
    groupId: _str(j['groupId']),
    groupName: _str(j['groupName']),
    minutes: _int(j['minutes']),
    at: _date(j['at']),
  );
}

class GroupActivity {
  const GroupActivity({required this.groupId, required this.messagesThisWeek, required this.live});
  final String groupId;
  final int messagesThisWeek;
  final bool live;

  factory GroupActivity.fromJson(Json j) =>
      GroupActivity(groupId: j['groupId'] as String, messagesThisWeek: _int(j['messagesThisWeek']), live: _bool(j['live']));
}

/// One of the viewer's own focus sessions today.
class FocusBlock {
  const FocusBlock({required this.start, required this.end, required this.minutes});
  final DateTime start;
  final DateTime end;
  final int minutes;

  factory FocusBlock.fromJson(Json j) =>
      FocusBlock(start: _date(j['startedAt']) ?? DateTime.now(), end: _date(j['endedAt']) ?? DateTime.now(), minutes: _int(j['minutes']));
}

const jobTypeLabels = {'JOB': 'Job', 'INTERNSHIP': 'Internship', 'PART_TIME': 'Part-time', 'REFERRAL': 'Referral'};
const workModeLabels = {'REMOTE': 'Remote', 'ONSITE': 'On site', 'HYBRID': 'Hybrid'};

class Job {
  const Job({
    required this.id,
    required this.type,
    required this.title,
    required this.company,
    required this.location,
    required this.workMode,
    this.pay,
    required this.tags,
    this.deadline,
    required this.deadlineLabel,
    required this.closingSoon,
    this.postedAt,
    required this.saved,
    this.imageUrl,
    required this.author,
    this.reasons = const [],
    this.description,
    this.applyMethod,
    this.applyTarget,
    this.isAuthor = false,
    this.reviewNote,
    this.status,
    this.partnerSaves = 0,
    this.imageUrls = const [],
  });

  final String id;
  final String type;
  final String title;
  final String company;
  final String location;
  final String workMode;
  final String? pay;
  final List<String> tags;
  final DateTime? deadline;
  final String deadlineLabel;
  final bool closingSoon;
  final DateTime? postedAt;
  final bool saved;
  final String? imageUrl;
  final UserRef author;
  final List<String> reasons;
  final String? description;
  final String? applyMethod;
  final String? applyTarget;
  final bool isAuthor;
  final String? reviewNote;
  final String? status;
  final int partnerSaves;

  /// Full-size photos on the detail screen.
  final List<String> imageUrls;

  String get initials => initialsFor(company);
  Color get color => colorFor(company);
  String get typeLabel => jobTypeLabels[type] ?? type;
  String get modeLabel => workModeLabels[workMode] ?? workMode;

  Job copyWith({bool? saved}) => Job(
    id: id,
    type: type,
    title: title,
    company: company,
    location: location,
    workMode: workMode,
    pay: pay,
    tags: tags,
    deadline: deadline,
    deadlineLabel: deadlineLabel,
    closingSoon: closingSoon,
    postedAt: postedAt,
    saved: saved ?? this.saved,
    imageUrl: imageUrl,
    author: author,
    reasons: reasons,
    description: description,
    applyMethod: applyMethod,
    applyTarget: applyTarget,
    isAuthor: isAuthor,
    reviewNote: reviewNote,
    status: status,
    partnerSaves: partnerSaves,
    imageUrls: imageUrls,
  );

  factory Job.fromJson(Json j) => Job(
    id: j['id'] as String,
    type: j['type'] as String? ?? 'JOB',
    title: j['title'] as String? ?? '',
    company: j['company'] as String? ?? '',
    location: j['location'] as String? ?? '',
    workMode: j['workMode'] as String? ?? 'ONSITE',
    pay: _str(j['pay']),
    tags: _strings(j['tags']),
    deadline: _date(j['deadline']),
    deadlineLabel: _str(j['deadlineLabel']) ?? '',
    closingSoon: _bool(j['closingSoon']),
    postedAt: _date(j['postedAt']),
    saved: _bool(j['saved']),
    imageUrl: _str(j['imageUrl']),
    author: UserRef.fromJson((j['author'] as Map).cast()),
    reasons: _strings(j['reasons']),
    description: _str(j['description']),
    applyMethod: _str(j['applyMethod']),
    applyTarget: _str(j['applyTarget']),
    isAuthor: _bool(j['isAuthor']),
    reviewNote: _str(j['reviewNote']),
    status: _str(j['status']),
    partnerSaves: _int(j['partnerSaves']),
    imageUrls: [
      for (final i in (j['images'] as List? ?? const []).whereType<Map>())
        if (i['url'] is String) i['url'] as String,
    ],
  );
}

class JobFeed {
  const JobFeed({required this.enabled, required this.jobs, this.nextCursor});
  final bool enabled;
  final List<Job> jobs;
  final String? nextCursor;

  factory JobFeed.fromJson(Json j) => JobFeed(enabled: j['enabled'] != false, jobs: _list(j['jobs'], Job.fromJson), nextCursor: _str(j['nextCursor']));
}

class CallParticipant {
  const CallParticipant({required this.user, required this.status});
  final UserRef user;
  final String status;
}

class CallSession {
  const CallSession({
    required this.id,
    required this.type,
    required this.mediaType,
    required this.status,
    this.conversationId,
    this.groupId,
    this.startedById,
    required this.participants,
  });
  final String id;
  final String type;
  final String mediaType;
  final String status;
  final String? conversationId;
  final String? groupId;
  final String? startedById;
  final List<CallParticipant> participants;

  bool get video => mediaType == 'VIDEO';
  UserRef? get caller => participants.where((p) => p.user.id == startedById).map((p) => p.user).firstOrNull;

  factory CallSession.fromJson(Json j) => CallSession(
    id: j['id'] as String,
    type: j['type'] as String? ?? 'DM',
    mediaType: j['mediaType'] as String? ?? 'AUDIO',
    status: j['status'] as String? ?? 'ACTIVE',
    conversationId: _str(j['conversationId']),
    groupId: _str(j['groupId']),
    startedById: _str(j['startedById']),
    participants: [
      for (final p in (j['participants'] as List? ?? const []).whereType<Map>())
        if (p['user'] is Map) CallParticipant(user: UserRef.fromJson((p['user'] as Map).cast()), status: p['status'] as String? ?? 'JOINED'),
    ],
  );
}

class LiveKitCredentials {
  const LiveKitCredentials({required this.token, required this.serverUrl});
  final String token;
  final String serverUrl;

  factory LiveKitCredentials.fromJson(Json j) => LiveKitCredentials(token: j['token'] as String, serverUrl: j['serverUrl'] as String);
}
