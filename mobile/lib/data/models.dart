// Shapes mirror the web app's Prisma models (prisma/schema.prisma) closely enough
// that the sample data can be swapped for API responses later.
import 'dart:ui';

class Person {
  const Person({
    required this.id,
    required this.name,
    required this.initials,
    required this.color,
    required this.major,
    required this.semester,
    required this.college,
    this.bio,
    required this.interests,
    this.availability,
  });

  final String id;
  final String name;
  final String initials;
  final Color color;
  final String major;
  final int semester;
  final String college;
  final String? bio;
  final List<String> interests;
  final String? availability;

  String get firstName => name.split(' ').first;
}

class MatchFactor {
  const MatchFactor(this.label, this.value, this.note);
  final String label;
  final double value;
  final String note;
}

class Partner extends Person {
  const Partner({
    required super.id,
    required super.name,
    required super.initials,
    required super.color,
    required super.major,
    required super.semester,
    required super.college,
    super.bio,
    required super.interests,
    super.availability,
    required this.score,
    required this.why,
    required this.studyStyle,
    required this.breakdown,
    this.inCommon,
  });

  final int score;
  final String why;
  final String studyStyle;
  final List<MatchFactor> breakdown;
  final String? inCommon;
}

enum FileKind { pdf, img, cpp, link }

extension FileKindLabel on FileKind {
  String get label => switch (this) {
    FileKind.pdf => 'PDF',
    FileKind.img => 'IMG',
    FileKind.cpp => 'CPP',
    FileKind.link => 'LINK',
  };
}

class ChatFile {
  const ChatFile(this.name, this.size, this.kind);
  final String name;
  final String size;
  final FileKind kind;
}

class ChatNotes {
  const ChatNotes(this.title, this.items);
  final String title;
  final List<String> items;
}

class ChatMessage {
  const ChatMessage({required this.id, required this.authorId, this.text, this.file, this.notes, this.system = false, required this.time});

  final String id;
  final String authorId;
  final String? text;
  final ChatFile? file;
  final ChatNotes? notes;
  final bool system;
  final String time;
}

enum ConversationKind { people, groups, channels }

class Conversation {
  const Conversation({
    required this.id,
    required this.kind,
    required this.title,
    required this.initials,
    required this.color,
    required this.last,
    required this.time,
    required this.unread,
    required this.refId,
  });

  final String id;
  final ConversationKind kind;
  final String title;
  final String initials;
  final Color color;
  final String last;
  final String time;
  final int unread;

  /// For DMs: the other person. For groups: the group id.
  final String refId;
}

class Resource {
  const Resource({required this.id, required this.kind, required this.title, required this.meta, this.size});
  final String id;
  final FileKind kind;
  final String title;
  final String meta;
  final String? size;
}

class LiveCall {
  const LiveCall(this.participants, this.startedMinutesAgo);
  final List<String> participants;
  final int startedMinutesAgo;
}

class Group {
  const Group({
    required this.id,
    required this.name,
    required this.initials,
    required this.color,
    required this.course,
    required this.description,
    required this.memberIds,
    required this.roles,
    required this.resources,
    required this.joined,
    this.status,
    this.liveCall,
  });

  final String id;
  final String name;
  final String initials;
  final Color color;
  final String course;
  final String description;
  final List<String> memberIds;
  final Map<String, String> roles;
  final List<Resource> resources;
  final bool joined;
  final String? status;
  final LiveCall? liveCall;
}

class StudyEvent {
  const StudyEvent({
    required this.id,
    required this.title,
    required this.groupId,
    required this.day,
    required this.start,
    required this.end,
    required this.where,
    required this.goingIds,
  });

  final String id;
  final String title;
  final String groupId;
  final int day;
  final String start;
  final String end;
  final String where;
  final List<String> goingIds;
}

class Job {
  const Job({
    required this.id,
    required this.title,
    required this.company,
    required this.initials,
    required this.color,
    required this.place,
    required this.tags,
    required this.pay,
    required this.deadline,
    required this.closesSoon,
    required this.posted,
    required this.duration,
    required this.about,
    required this.needs,
    required this.skills,
  });

  final String id;
  final String title;
  final String company;
  final String initials;
  final Color color;
  final String place;
  final List<String> tags;
  final String pay;
  final String deadline;
  final bool closesSoon;
  final String posted;
  final String duration;
  final String about;
  final List<String> needs;
  final List<String> skills;
}

enum NotificationKind { match, message, event, job, resource, call }

class AppNotification {
  const AppNotification({required this.id, required this.kind, this.actor, required this.body, required this.time, required this.unread, this.refId});

  final String id;
  final NotificationKind kind;
  final String? actor;
  final String body;
  final String time;
  final bool unread;

  /// Partner id for match requests.
  final String? refId;

  AppNotification copyWith({NotificationKind? kind, String? body, String? time, bool? unread, String? Function()? refId}) => AppNotification(
    id: id,
    kind: kind ?? this.kind,
    actor: actor,
    body: body ?? this.body,
    time: time ?? this.time,
    unread: unread ?? this.unread,
    refId: refId != null ? refId() : this.refId,
  );
}
