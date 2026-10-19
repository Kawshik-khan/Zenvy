import { prisma } from "@/lib/prisma";

const XP = {
  completedEvent: 50,
  studyHour: 10,
  createdEvent: 20,
  createdGroupOrChannel: 40,
  joinedGroupOrChannel: 25,
  createdResource: 30,
  message: 2,
  maxMessageXpPerDay: 100,
};

const MS_PER_HOUR = 60 * 60 * 1000;

export type StudyMetrics = {
  totalXp: number;
  level: number;
  levelTitle: string;
  currentLevelXp: number;
  nextLevelXp: number;
  xpIntoLevel: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  levelProgressPercent: number;
  currentStreakDays: number;
  activeDaysLast28: number;
  activityDayKeys: string[];
  heatmapDays: Array<{
    date: string;
    activityCount: number;
    studyHours: number;
    level: number;
  }>;
  studyHours: number;
  completedSessions: number;
  completedPomodoroSessions: number;
  pomodoroMinutes: number;
  attendanceRate: number;
  totalMessages: number;
  resourcesCreated: number;
  groupsJoined: number;
  channelsJoined: number;
  groupsCreated: number;
  channelsCreated: number;
  subjectRows: Array<{
    subject: string;
    hours: number;
  }>;
};

export function getDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addActivity(dayCounts: Map<string, number>, date: Date | null | undefined, count = 1) {
  if (!date) return;
  const key = getDayKey(date);
  dayCounts.set(key, (dayCounts.get(key) || 0) + count);
}

function addStudyHours(dayHours: Map<string, number>, date: Date, hours: number) {
  const key = getDayKey(date);
  dayHours.set(key, (dayHours.get(key) || 0) + hours);
}

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function shiftUtcDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function levelThreshold(level: number) {
  return 250 * (level - 1) * level;
}

function getLevelState(totalXp: number) {
  let level = 1;
  while (totalXp >= levelThreshold(level + 1)) {
    level += 1;
  }

  const currentLevelXp = levelThreshold(level);
  const nextLevelXp = levelThreshold(level + 1);
  const xpForCurrentLevel = totalXp - currentLevelXp;
  const xpForNextLevel = nextLevelXp - currentLevelXp;
  const levelProgressPercent = xpForNextLevel > 0 ? Math.min(100, Math.round((xpForCurrentLevel / xpForNextLevel) * 100)) : 100;

  return {
    level,
    levelTitle: `Level ${level} Scholar`,
    currentLevelXp,
    nextLevelXp,
    xpIntoLevel: xpForCurrentLevel,
    xpForCurrentLevel,
    xpForNextLevel,
    levelProgressPercent,
  };
}

function getCurrentStreak(activityKeys: Set<string>, now: Date) {
  const today = startOfUtcDay(now);
  let cursor = today;

  if (!activityKeys.has(getDayKey(cursor))) {
    cursor = shiftUtcDays(cursor, -1);
  }

  let streak = 0;
  while (activityKeys.has(getDayKey(cursor))) {
    streak += 1;
    cursor = shiftUtcDays(cursor, -1);
  }

  return streak;
}

export async function getStudyMetrics(userId: string, now = new Date()): Promise<StudyMetrics> {
  const [
    attendances,
    eventsCreated,
    groupMemberships,
    channelMemberships,
    groupsCreated,
    channelsCreated,
    resourcesCreated,
    groupMessages,
    channelMessages,
    conversationMessages,
    pomodoroSessions,
  ] = await Promise.all([
    prisma.eventAttendee.findMany({
      where: { userId },
      include: { event: { include: { group: true } } },
    }),
    prisma.event.findMany({
      where: { creatorId: userId },
      select: { id: true, createdAt: true },
    }),
    prisma.groupMember.findMany({
      where: { userId },
      select: { id: true, joinedAt: true },
    }),
    prisma.channelMember.findMany({
      where: { userId },
      select: { id: true, joinedAt: true },
    }),
    prisma.studyGroup.findMany({
      where: { adminId: userId },
      select: { id: true, createdAt: true },
    }),
    prisma.channel.findMany({
      where: { creatorId: userId },
      select: { id: true, createdAt: true },
    }),
    prisma.groupResource.findMany({
      where: { creatorId: userId },
      select: { id: true, createdAt: true },
    }),
    prisma.groupMessage.findMany({
      where: { senderId: userId },
      select: { id: true, createdAt: true },
    }),
    prisma.channelMessage.findMany({
      where: { senderId: userId },
      select: { id: true, createdAt: true },
    }),
    prisma.conversationMessage.findMany({
      where: { senderId: userId },
      select: { id: true, createdAt: true },
    }),
    prisma.pomodoroSession.findMany({
      where: {
        userId,
        mode: "FOCUS",
        status: "COMPLETED",
        endedAt: { lte: now },
      },
      select: {
        id: true,
        completedMinutes: true,
        endedAt: true,
      },
    }),
  ]);

  const activityDayCounts = new Map<string, number>();
  const studyHoursByDay = new Map<string, number>();
  const messageCountsByDay = new Map<string, number>();
  const subjectTotals = new Map<string, number>();

  const completedAttendances = attendances.filter((attendance) => attendance.status === "GOING" && attendance.event.endTime < now);
  const eventStudyHours = completedAttendances.reduce((total, attendance) => {
    const hours = Math.max(0, attendance.event.endTime.getTime() - attendance.event.startTime.getTime()) / MS_PER_HOUR;
    const subject = attendance.event.group?.subject || attendance.event.group?.name || "Personal";
    subjectTotals.set(subject, (subjectTotals.get(subject) || 0) + hours);
    addActivity(activityDayCounts, attendance.event.endTime);
    addStudyHours(studyHoursByDay, attendance.event.endTime, hours);
    return total + hours;
  }, 0);

  const pomodoroMinutes = pomodoroSessions.reduce((total, session) => total + session.completedMinutes, 0);
  const pomodoroStudyHours = pomodoroMinutes / 60;

  for (const session of pomodoroSessions) {
    const hours = session.completedMinutes / 60;
    subjectTotals.set("Focus Sessions", (subjectTotals.get("Focus Sessions") || 0) + hours);
    addActivity(activityDayCounts, session.endedAt);
    addStudyHours(studyHoursByDay, session.endedAt, hours);
  }

  for (const event of eventsCreated) addActivity(activityDayCounts, event.createdAt);
  for (const membership of groupMemberships) addActivity(activityDayCounts, membership.joinedAt);
  for (const membership of channelMemberships) addActivity(activityDayCounts, membership.joinedAt);
  for (const group of groupsCreated) addActivity(activityDayCounts, group.createdAt);
  for (const channel of channelsCreated) addActivity(activityDayCounts, channel.createdAt);
  for (const resource of resourcesCreated) addActivity(activityDayCounts, resource.createdAt);

  for (const message of [...groupMessages, ...channelMessages, ...conversationMessages]) {
    addActivity(activityDayCounts, message.createdAt);
    const key = getDayKey(message.createdAt);
    messageCountsByDay.set(key, (messageCountsByDay.get(key) || 0) + 1);
  }

  const messageXp = Array.from(messageCountsByDay.values()).reduce((total, count) => total + Math.min(count * XP.message, XP.maxMessageXpPerDay), 0);
  const completedEventXp = completedAttendances.length * XP.completedEvent;
  const studyHourXp = completedAttendances.reduce((total, attendance) => {
    const hours = Math.max(0, attendance.event.endTime.getTime() - attendance.event.startTime.getTime()) / MS_PER_HOUR;
    return total + Math.floor(Math.min(4, hours) * XP.studyHour);
  }, 0);
  const pomodoroXp = pomodoroSessions.reduce((total, session) => {
    const hours = session.completedMinutes / 60;
    return total + Math.floor(Math.min(4, hours) * XP.studyHour);
  }, 0);

  const totalXp =
    completedEventXp +
    studyHourXp +
    pomodoroXp +
    eventsCreated.length * XP.createdEvent +
    (groupsCreated.length + channelsCreated.length) * XP.createdGroupOrChannel +
    (groupMemberships.length + channelMemberships.length) * XP.joinedGroupOrChannel +
    resourcesCreated.length * XP.createdResource +
    messageXp;

  const activityKeys = new Set(activityDayCounts.keys());
  const today = startOfUtcDay(now);
  const heatmapDays = Array.from({ length: 28 }, (_, index) => {
    const date = shiftUtcDays(today, index - 27);
    const key = getDayKey(date);
    const activityCount = activityDayCounts.get(key) || 0;
    const dayStudyHours = Math.round((studyHoursByDay.get(key) || 0) * 10) / 10;
    const level = dayStudyHours >= 3 || activityCount >= 8 ? 4 : dayStudyHours >= 2 || activityCount >= 5 ? 3 : dayStudyHours >= 1 || activityCount >= 2 ? 2 : activityCount > 0 ? 1 : 0;

    return {
      date: key,
      activityCount,
      studyHours: dayStudyHours,
      level,
    };
  });

  const goingAttendances = attendances.filter((attendance) => attendance.status === "GOING");
  const attendanceRate = goingAttendances.length > 0 ? Math.round((completedAttendances.length / goingAttendances.length) * 100) : 0;
  const levelState = getLevelState(totalXp);

  return {
    totalXp,
    ...levelState,
    currentStreakDays: getCurrentStreak(activityKeys, now),
    activeDaysLast28: heatmapDays.filter((day) => day.activityCount > 0).length,
    activityDayKeys: Array.from(activityKeys).sort(),
    heatmapDays,
    studyHours: Math.round((eventStudyHours + pomodoroStudyHours) * 10) / 10,
    completedSessions: completedAttendances.length + pomodoroSessions.length,
    completedPomodoroSessions: pomodoroSessions.length,
    pomodoroMinutes,
    attendanceRate,
    totalMessages: groupMessages.length + channelMessages.length + conversationMessages.length,
    resourcesCreated: resourcesCreated.length,
    groupsJoined: groupMemberships.length,
    channelsJoined: channelMemberships.length,
    groupsCreated: groupsCreated.length,
    channelsCreated: channelsCreated.length,
    subjectRows: Array.from(subjectTotals.entries())
      .map(([subject, hours]) => ({ subject, hours: Math.round(hours * 10) / 10 }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 5),
  };
}
