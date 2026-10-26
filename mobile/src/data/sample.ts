// Sample content for the prototype. Names and companies are fictional.
import { palette } from "../theme/tokens";
import type { AppNotification, ChatMessage, Conversation, Group, Job, Partner, Person, StudyEvent } from "./types";

export const me: Person = {
  id: "me",
  name: "Nadia Rahman",
  initials: "NR",
  color: palette.match,
  major: "Computer Science",
  semester: 5,
  college: "BRAC University",
  bio: "Prepping for CSE221 and summer internships. I like pair programming and explaining things out loud.",
  interests: ["Algorithms", "React", "Data structures", "UI design"],
  availability: "Evenings & late nights",
};

export const partners: Partner[] = [
  {
    id: "tanvir",
    name: "Tanvir Ahmed",
    initials: "TA",
    color: palette.chat,
    major: "Computer Science",
    semester: 5,
    college: "BRAC University",
    bio: "Grinding CSE221 and LeetCode before internship season. Looking for 2–3 people to do timed problem sets twice a week.",
    interests: ["Algorithms", "Data structures", "React", "C++", "Competitive programming"],
    availability: "Weeknights after 8 PM",
    score: 94,
    why: "same major, both prep for CSE221, evenings free.",
    studyStyle: "Pair programming",
    breakdown: [
      { label: "Major", value: 1, note: "Same" },
      { label: "Interests", value: 0.8, note: "4 of 5" },
      { label: "Schedule", value: 0.7, note: "Eves" },
      { label: "Study style", value: 1, note: "Pair" },
    ],
    inCommon: "Algorithms Circle",
  },
  {
    id: "sadia",
    name: "Sadia Hossain",
    initials: "SH",
    color: palette.career,
    major: "Computer Science",
    semester: 6,
    college: "BRAC University",
    bio: "Databases TA-in-training. Happy to trade ER diagram reviews for ML help.",
    interests: ["Databases", "Python", "Machine learning", "Exam prep"],
    availability: "Weekday afternoons",
    score: 88,
    why: "shared interest in Databases and ML.",
    studyStyle: "Exam prep",
    breakdown: [
      { label: "Major", value: 1, note: "Same" },
      { label: "Interests", value: 0.6, note: "3 of 5" },
      { label: "Schedule", value: 0.5, note: "Some" },
      { label: "Study style", value: 0.7, note: "Close" },
    ],
    inCommon: "DB Design Lab",
  },
  {
    id: "mahin",
    name: "Mahin Karim",
    initials: "MK",
    color: palette.live,
    major: "Electrical Engineering",
    semester: 5,
    college: "BRAC University",
    bio: "Night owl. Calculus II and circuits, mostly. Will explain integrals with drawings.",
    interests: ["Calculus", "Physics", "Circuits"],
    availability: "Late nights",
    score: 81,
    why: "overlapping Calculus II, late-night studier.",
    studyStyle: "Group discussion",
    breakdown: [
      { label: "Major", value: 0.4, note: "Related" },
      { label: "Interests", value: 0.6, note: "2 of 4" },
      { label: "Schedule", value: 0.9, note: "Late" },
      { label: "Study style", value: 0.6, note: "Close" },
    ],
    inCommon: "Calculus II Crew",
  },
];

export const people: Person[] = [
  me,
  ...partners,
  { id: "farhan", name: "Farhan Jamil", initials: "FJ", color: palette.focus, major: "Computer Science", semester: 6, college: "BRAC University", interests: ["Algorithms"] },
  { id: "rafia", name: "Rafia Islam", initials: "RI", color: palette.match, major: "Computer Science", semester: 5, college: "BRAC University", interests: ["Calculus"] },
];

export function person(id: string): Person {
  return people.find((p) => p.id === id) ?? me;
}

export const conversations: Conversation[] = [
  { id: "c-tanvir", kind: "people", title: "Tanvir Ahmed", initials: "TA", color: palette.chat, last: "Iterate capacity backwards. Library room 3 at 7?", time: "6:12 PM", unread: 2, refId: "tanvir" },
  { id: "c-sadia", kind: "people", title: "Sadia Hossain", initials: "SH", color: palette.career, last: "You: sharing my ER diagram now", time: "4:40 PM", unread: 0, refId: "sadia" },
  { id: "c-mahin", kind: "people", title: "Mahin Karim", initials: "MK", color: palette.live, last: "Missed voice call", time: "Yesterday", unread: 1, refId: "mahin" },
  { id: "c-farhan", kind: "people", title: "Farhan Jamil", initials: "FJ", color: palette.focus, last: "haha yes that test case got me too", time: "Mon", unread: 0, refId: "farhan" },
  { id: "c-ac", kind: "groups", title: "Algorithms Circle", initials: "AC", color: palette.chat, last: "Farhan: pushed the memo table solution", time: "6:20 PM", unread: 5, refId: "ac" },
  { id: "c-db", kind: "groups", title: "DB Design Lab", initials: "DB", color: palette.career, last: "Sadia: normalization quiz Thursday", time: "3:05 PM", unread: 0, refId: "db" },
  { id: "c-c2", kind: "groups", title: "Calculus II Crew", initials: "C2", color: palette.live, last: "Mahin: who has the past papers?", time: "Mon", unread: 0, refId: "c2" },
  { id: "c-lounge", kind: "channels", title: "study-lounge", initials: "#", color: palette.focus, last: "Open to everyone at Zenvy", time: "Now", unread: 0, refId: "ac" },
  { id: "c-cse", kind: "channels", title: "cse-bracu", initials: "#", color: palette.chat, last: "Exam schedule posted for Fall 26", time: "2:10 PM", unread: 12, refId: "ac" },
  { id: "c-intern", kind: "channels", title: "internships", initials: "#", color: palette.career, last: "New: 3 frontend roles in Dhaka", time: "Mon", unread: 0, refId: "ac" },
];

export const dmThreads: Record<string, ChatMessage[]> = {
  tanvir: [
    { id: "m1", authorId: "tanvir", text: "Did you finish the knapsack variant from the problem set?", time: "5:48 PM" },
    { id: "m2", authorId: "me", text: "Almost. Stuck on the space optimisation. 1D array keeps overwriting.", time: "5:51 PM" },
    { id: "m3", authorId: "tanvir", file: { name: "DP-notes-week6.pdf", size: "1.2 MB", kind: "PDF" }, time: "6:10 PM" },
    { id: "m4", authorId: "tanvir", text: "Iterate capacity backwards. Library room 3 at 7? Bringing the DP notes.", time: "6:12 PM" },
  ],
};

export const groupThreads: Record<string, ChatMessage[]> = {
  ac: [
    { id: "g1", authorId: "farhan", text: "Pushed the memo table solution for Q4. Runs in O(n·W).", time: "6:02 PM" },
    { id: "g2", authorId: "rafia", notes: { title: "Call notes · 18 min", items: ["Q4 solved, Q5 open", "Everyone tries LCS before Thursday"] }, time: "6:08 PM" },
    { id: "g3", authorId: "mahin", system: true, text: "Mahin Karim joined the group", time: "6:14 PM" },
    { id: "g4", authorId: "mahin", text: "Hey all! Can someone explain why we iterate W backwards?", time: "6:15 PM" },
    { id: "g5", authorId: "me", text: "So each item is used once. Forward lets you reuse it, that's the unbounded version.", time: "6:17 PM" },
  ],
};

export const groups: Group[] = [
  {
    id: "ac",
    name: "Algorithms Circle",
    initials: "AC",
    color: palette.chat,
    course: "CSE221",
    description: "Timed problem sets every Tue & Thu. Bring one problem you're stuck on.",
    memberIds: ["farhan", "tanvir", "rafia", "me", "mahin"],
    roles: { farhan: "Owner", tanvir: "Admin" },
    joined: true,
    status: "5 new",
    liveCall: { participants: ["farhan", "rafia", "tanvir"], startedMinutesAgo: 24 },
    resources: [
      { id: "r1", kind: "PDF", title: "Graph algorithms cheatsheet.pdf", meta: "Farhan · yesterday", size: "840 KB" },
      { id: "r2", kind: "LINK", title: "CSE221 past papers (2022–25)", meta: "Rafia · Oct 20" },
      { id: "r3", kind: "CPP", title: "knapsack_memo.cpp", meta: "Farhan · today", size: "3 KB" },
      { id: "r4", kind: "IMG", title: "whiteboard-DP-table.png", meta: "Tanvir · Oct 18", size: "1.4 MB" },
    ],
  },
  { id: "db", name: "DB Design Lab", initials: "DB", color: palette.career, course: "CSE370", description: "ER diagrams, normalization and SQL drills.", memberIds: ["sadia", "me", "rafia"], roles: { sadia: "Owner" }, joined: true, status: "Quiz Thu", resources: [] },
  { id: "c2", name: "Calculus II Crew", initials: "C2", color: palette.live, course: "MAT120", description: "Past papers and integration practice.", memberIds: ["mahin", "me"], roles: { mahin: "Owner" }, joined: true, resources: [] },
  { id: "os", name: "OS Concepts Squad", initials: "OS", color: palette.focus, course: "CSE321", description: "Scheduling, memory and concurrency.", memberIds: ["farhan"], roles: {}, joined: false, resources: [] },
  { id: "ml", name: "ML Paper Club", initials: "ML", color: palette.match, course: "Weekly Fri", description: "One paper a week, explained simply.", memberIds: ["sadia"], roles: {}, joined: false, resources: [] },
  { id: "ux", name: "Design Crit Night", initials: "UX", color: palette.career, course: "Portfolio reviews", description: "Bring a screen, get feedback.", memberIds: [], roles: {}, joined: false, resources: [] },
  { id: "ph", name: "Physics 101 Help", initials: "PH", color: palette.live, course: "Open questions", description: "Ask anything about PHY111.", memberIds: ["mahin"], roles: {}, joined: false, resources: [] },
];

/** Days are in the week of Mon Oct 26 2026 (26–31, then Nov 1). */
export const events: StudyEvent[] = [
  { id: "e1", title: "DP problem set review", groupId: "ac", day: 26, start: "7:00 PM", end: "8:30 PM", where: "Online", goingIds: ["farhan", "tanvir", "rafia", "mahin", "me"] },
  { id: "e2", title: "Late-night Calc II grind", groupId: "c2", day: 26, start: "9:00 PM", end: "10:00 PM", where: "Library", goingIds: ["mahin", "sadia", "rafia"] },
  { id: "e3", title: "Greedy vs DP drill", groupId: "ac", day: 28, start: "8:30 PM", end: "10:00 PM", where: "Room 3", goingIds: ["farhan", "tanvir", "rafia", "mahin"] },
  { id: "e4", title: "Normalization quiz prep", groupId: "db", day: 29, start: "5:00 PM", end: "6:00 PM", where: "Online", goingIds: ["sadia", "rafia", "mahin"] },
];

export const jobs: Job[] = [
  {
    id: "kl-frontend",
    title: "Frontend Intern (React)",
    company: "Kothay Labs",
    initials: "KL",
    color: palette.chat,
    place: "Dhaka · Hybrid",
    tags: ["Internship", "3 months", "React"],
    pay: "BDT 25k / month",
    deadline: "Oct 28",
    closesSoon: true,
    posted: "5 days ago",
    duration: "3 months",
    about: "Build screens for our partner dashboard. You'll pair with a senior engineer, ship to production weekly, and present a demo at the end.",
    needs: ["Comfort with React components and hooks", "A project or repo you can walk us through", "3 days a week in the office"],
    skills: ["React", "JavaScript", "Git", "TypeScript"],
  },
  {
    id: "nh-data",
    title: "Data Analyst Intern",
    company: "Nodi Health",
    initials: "NH",
    color: palette.live,
    place: "Remote",
    tags: ["Internship", "SQL", "Python"],
    pay: "BDT 20k / month",
    deadline: "Nov 12",
    closesSoon: false,
    posted: "2 days ago",
    duration: "4 months",
    about: "Clean and explore clinic visit data, then turn it into weekly dashboards for the operations team.",
    needs: ["SQL joins and aggregates", "Python or R for analysis", "Clear written summaries"],
    skills: ["SQL", "Python", "Data structures", "Excel"],
  },
  {
    id: "bu-ta",
    title: "Teaching Assistant, CSE110",
    company: "BRAC University",
    initials: "BU",
    color: palette.focus,
    place: "On campus",
    tags: ["Part-time", "10 h/week"],
    pay: "BDT 8k / month",
    deadline: "Nov 20",
    closesSoon: false,
    posted: "1 week ago",
    duration: "One semester",
    about: "Run two lab sections a week and hold office hours for intro programming students.",
    needs: ["A in CSE110 or equivalent", "Patience explaining basics", "Available Sun & Tue afternoons"],
    skills: ["Python", "Algorithms", "Teaching"],
  },
];

export const notifications: AppNotification[] = [
  { id: "n1", kind: "match", actor: "Sadia Hossain", body: "wants to be study partners. 88% match on Databases and ML.", time: "12 min ago", unread: true, refId: "sadia" },
  { id: "n2", kind: "message", actor: "Tanvir Ahmed", body: "“Library room 3 at 7? Bringing the DP notes.”", time: "38 min ago", unread: true, refId: "tanvir" },
  { id: "n3", kind: "event", actor: "DP problem set review", body: "starts at 7:00 PM in Algorithms Circle.", time: "1 h ago", unread: true },
  { id: "n4", kind: "job", body: "Your application to Frontend Intern · Kothay Labs was viewed.", time: "3 h ago", unread: true, refId: "kl-frontend" },
  { id: "n5", kind: "resource", actor: "Farhan", body: "added “Graph algorithms cheatsheet.pdf” to Algorithms Circle.", time: "Yesterday", unread: false },
  { id: "n6", kind: "call", body: "Missed voice call from Mahin Karim.", time: "Yesterday", unread: false, refId: "mahin" },
];

export const stats = {
  todayMinutes: 75,
  goalMinutes: 120,
  sessionsToday: 3,
  streakDays: 7,
  level: 7,
  levelTitle: "Scholar",
  levelProgress: 0.64,
  toNextLevel: "4h 30m",
  periods: {
    week: { hours: "11h 20m", sessions: 27, streak: "8 days", attendance: "90%" },
    month: { hours: "38h 05m", sessions: 94, streak: "8 days", attendance: "86%" },
    all: { hours: "46h 10m", sessions: 112, streak: "Best 14 days", attendance: "84%" },
  },
  dailyHours: [1.5, 2.2, 0.8, 2.5, 1.9, 1.1, 1.3],
  /** Last 28 days, 0–4 on the heat scale. */
  heat: [0, 1, 2, 2, 0, 3, 1, 2, 4, 3, 0, 1, 2, 3, 0, 2, 3, 4, 2, 1, 0, 3, 2, 4, 3, 2, 1, 3],
  profile: { partners: 12, groups: 3, focusedHours: 46 },
};
