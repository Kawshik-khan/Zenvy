// Sample content for the prototype. Names and companies are fictional.
import '../theme/tokens.dart';
import 'models.dart';

const me = Person(
  id: 'me',
  name: 'Nadia Rahman',
  initials: 'NR',
  color: Palette.match,
  major: 'Computer Science',
  semester: 5,
  college: 'BRAC University',
  bio: 'Prepping for CSE221 and summer internships. I like pair programming and explaining things out loud.',
  interests: ['Algorithms', 'React', 'Data structures', 'UI design'],
  availability: 'Evenings & late nights',
);

const partners = <Partner>[
  Partner(
    id: 'tanvir',
    name: 'Tanvir Ahmed',
    initials: 'TA',
    color: Palette.chat,
    major: 'Computer Science',
    semester: 5,
    college: 'BRAC University',
    bio: 'Grinding CSE221 and LeetCode before internship season. Looking for 2–3 people to do timed problem sets twice a week.',
    interests: ['Algorithms', 'Data structures', 'React', 'C++', 'Competitive programming'],
    availability: 'Weeknights after 8 PM',
    score: 94,
    why: 'same major, both prep for CSE221, evenings free.',
    studyStyle: 'Pair programming',
    breakdown: [
      MatchFactor('Major', 1, 'Same'),
      MatchFactor('Interests', 0.8, '4 of 5'),
      MatchFactor('Schedule', 0.7, 'Eves'),
      MatchFactor('Study style', 1, 'Pair'),
    ],
    inCommon: 'Algorithms Circle',
  ),
  Partner(
    id: 'sadia',
    name: 'Sadia Hossain',
    initials: 'SH',
    color: Palette.career,
    major: 'Computer Science',
    semester: 6,
    college: 'BRAC University',
    bio: 'Databases TA-in-training. Happy to trade ER diagram reviews for ML help.',
    interests: ['Databases', 'Python', 'Machine learning', 'Exam prep'],
    availability: 'Weekday afternoons',
    score: 88,
    why: 'shared interest in Databases and ML.',
    studyStyle: 'Exam prep',
    breakdown: [
      MatchFactor('Major', 1, 'Same'),
      MatchFactor('Interests', 0.6, '3 of 5'),
      MatchFactor('Schedule', 0.5, 'Some'),
      MatchFactor('Study style', 0.7, 'Close'),
    ],
    inCommon: 'DB Design Lab',
  ),
  Partner(
    id: 'mahin',
    name: 'Mahin Karim',
    initials: 'MK',
    color: Palette.live,
    major: 'Electrical Engineering',
    semester: 5,
    college: 'BRAC University',
    bio: 'Night owl. Calculus II and circuits, mostly. Will explain integrals with drawings.',
    interests: ['Calculus', 'Physics', 'Circuits'],
    availability: 'Late nights',
    score: 81,
    why: 'overlapping Calculus II, late-night studier.',
    studyStyle: 'Group discussion',
    breakdown: [
      MatchFactor('Major', 0.4, 'Related'),
      MatchFactor('Interests', 0.6, '2 of 4'),
      MatchFactor('Schedule', 0.9, 'Late'),
      MatchFactor('Study style', 0.6, 'Close'),
    ],
    inCommon: 'Calculus II Crew',
  ),
];

const people = <Person>[
  me,
  ...partners,
  Person(
    id: 'farhan',
    name: 'Farhan Jamil',
    initials: 'FJ',
    color: Palette.focus,
    major: 'Computer Science',
    semester: 6,
    college: 'BRAC University',
    interests: ['Algorithms'],
  ),
  Person(
    id: 'rafia',
    name: 'Rafia Islam',
    initials: 'RI',
    color: Palette.match,
    major: 'Computer Science',
    semester: 5,
    college: 'BRAC University',
    interests: ['Calculus'],
  ),
];

Person person(String id) => people.firstWhere((p) => p.id == id, orElse: () => me);

Partner? partnerById(String? id) {
  for (final p in partners) {
    if (p.id == id) return p;
  }
  return null;
}

String shortMajor(String major) => major == 'Computer Science' ? 'CSE' : 'EEE';

const conversations = <Conversation>[
  Conversation(
    id: 'c-tanvir',
    kind: ConversationKind.people,
    title: 'Tanvir Ahmed',
    initials: 'TA',
    color: Palette.chat,
    last: 'Iterate capacity backwards. Library room 3 at 7?',
    time: '6:12 PM',
    unread: 2,
    refId: 'tanvir',
  ),
  Conversation(
    id: 'c-sadia',
    kind: ConversationKind.people,
    title: 'Sadia Hossain',
    initials: 'SH',
    color: Palette.career,
    last: 'You: sharing my ER diagram now',
    time: '4:40 PM',
    unread: 0,
    refId: 'sadia',
  ),
  Conversation(
    id: 'c-mahin',
    kind: ConversationKind.people,
    title: 'Mahin Karim',
    initials: 'MK',
    color: Palette.live,
    last: 'Missed voice call',
    time: 'Yesterday',
    unread: 1,
    refId: 'mahin',
  ),
  Conversation(
    id: 'c-farhan',
    kind: ConversationKind.people,
    title: 'Farhan Jamil',
    initials: 'FJ',
    color: Palette.focus,
    last: 'haha yes that test case got me too',
    time: 'Mon',
    unread: 0,
    refId: 'farhan',
  ),
  Conversation(
    id: 'c-ac',
    kind: ConversationKind.groups,
    title: 'Algorithms Circle',
    initials: 'AC',
    color: Palette.chat,
    last: 'Farhan: pushed the memo table solution',
    time: '6:20 PM',
    unread: 5,
    refId: 'ac',
  ),
  Conversation(
    id: 'c-db',
    kind: ConversationKind.groups,
    title: 'DB Design Lab',
    initials: 'DB',
    color: Palette.career,
    last: 'Sadia: normalization quiz Thursday',
    time: '3:05 PM',
    unread: 0,
    refId: 'db',
  ),
  Conversation(
    id: 'c-c2',
    kind: ConversationKind.groups,
    title: 'Calculus II Crew',
    initials: 'C2',
    color: Palette.live,
    last: 'Mahin: who has the past papers?',
    time: 'Mon',
    unread: 0,
    refId: 'c2',
  ),
  Conversation(
    id: 'c-lounge',
    kind: ConversationKind.channels,
    title: 'study-lounge',
    initials: '#',
    color: Palette.focus,
    last: 'Open to everyone at Zenvy',
    time: 'Now',
    unread: 0,
    refId: 'ac',
  ),
  Conversation(
    id: 'c-cse',
    kind: ConversationKind.channels,
    title: 'cse-bracu',
    initials: '#',
    color: Palette.chat,
    last: 'Exam schedule posted for Fall 26',
    time: '2:10 PM',
    unread: 12,
    refId: 'ac',
  ),
  Conversation(
    id: 'c-intern',
    kind: ConversationKind.channels,
    title: 'internships',
    initials: '#',
    color: Palette.career,
    last: 'New: 3 frontend roles in Dhaka',
    time: 'Mon',
    unread: 0,
    refId: 'ac',
  ),
];

const dmThreads = <String, List<ChatMessage>>{
  'tanvir': [
    ChatMessage(id: 'm1', authorId: 'tanvir', text: 'Did you finish the knapsack variant from the problem set?', time: '5:48 PM'),
    ChatMessage(id: 'm2', authorId: 'me', text: 'Almost. Stuck on the space optimisation. 1D array keeps overwriting.', time: '5:51 PM'),
    ChatMessage(id: 'm3', authorId: 'tanvir', file: ChatFile('DP-notes-week6.pdf', '1.2 MB', FileKind.pdf), time: '6:10 PM'),
    ChatMessage(id: 'm4', authorId: 'tanvir', text: 'Iterate capacity backwards. Library room 3 at 7? Bringing the DP notes.', time: '6:12 PM'),
  ],
};

const groupThreads = <String, List<ChatMessage>>{
  'ac': [
    ChatMessage(id: 'g1', authorId: 'farhan', text: 'Pushed the memo table solution for Q4. Runs in O(n·W).', time: '6:02 PM'),
    ChatMessage(
      id: 'g2',
      authorId: 'rafia',
      notes: ChatNotes('Call notes · 18 min', ['Q4 solved, Q5 open', 'Everyone tries LCS before Thursday']),
      time: '6:08 PM',
    ),
    ChatMessage(id: 'g3', authorId: 'mahin', system: true, text: 'Mahin Karim joined the group', time: '6:14 PM'),
    ChatMessage(id: 'g4', authorId: 'mahin', text: 'Hey all! Can someone explain why we iterate W backwards?', time: '6:15 PM'),
    ChatMessage(id: 'g5', authorId: 'me', text: "So each item is used once. Forward lets you reuse it, that's the unbounded version.", time: '6:17 PM'),
  ],
};

const groups = <Group>[
  Group(
    id: 'ac',
    name: 'Algorithms Circle',
    initials: 'AC',
    color: Palette.chat,
    course: 'CSE221',
    description: "Timed problem sets every Tue & Thu. Bring one problem you're stuck on.",
    memberIds: ['farhan', 'tanvir', 'rafia', 'me', 'mahin'],
    roles: {'farhan': 'Owner', 'tanvir': 'Admin'},
    joined: true,
    status: '5 new',
    liveCall: LiveCall(['farhan', 'rafia', 'tanvir'], 24),
    resources: [
      Resource(id: 'r1', kind: FileKind.pdf, title: 'Graph algorithms cheatsheet.pdf', meta: 'Farhan · yesterday', size: '840 KB'),
      Resource(id: 'r2', kind: FileKind.link, title: 'CSE221 past papers (2022–25)', meta: 'Rafia · Oct 20'),
      Resource(id: 'r3', kind: FileKind.cpp, title: 'knapsack_memo.cpp', meta: 'Farhan · today', size: '3 KB'),
      Resource(id: 'r4', kind: FileKind.img, title: 'whiteboard-DP-table.png', meta: 'Tanvir · Oct 18', size: '1.4 MB'),
    ],
  ),
  Group(
    id: 'db',
    name: 'DB Design Lab',
    initials: 'DB',
    color: Palette.career,
    course: 'CSE370',
    description: 'ER diagrams, normalization and SQL drills.',
    memberIds: ['sadia', 'me', 'rafia'],
    roles: {'sadia': 'Owner'},
    joined: true,
    status: 'Quiz Thu',
    resources: [],
  ),
  Group(
    id: 'c2',
    name: 'Calculus II Crew',
    initials: 'C2',
    color: Palette.live,
    course: 'MAT120',
    description: 'Past papers and integration practice.',
    memberIds: ['mahin', 'me'],
    roles: {'mahin': 'Owner'},
    joined: true,
    resources: [],
  ),
  Group(
    id: 'os',
    name: 'OS Concepts Squad',
    initials: 'OS',
    color: Palette.focus,
    course: 'CSE321',
    description: 'Scheduling, memory and concurrency.',
    memberIds: ['farhan'],
    roles: {},
    joined: false,
    resources: [],
  ),
  Group(
    id: 'ml',
    name: 'ML Paper Club',
    initials: 'ML',
    color: Palette.match,
    course: 'Weekly Fri',
    description: 'One paper a week, explained simply.',
    memberIds: ['sadia'],
    roles: {},
    joined: false,
    resources: [],
  ),
  Group(
    id: 'ux',
    name: 'Design Crit Night',
    initials: 'UX',
    color: Palette.career,
    course: 'Portfolio reviews',
    description: 'Bring a screen, get feedback.',
    memberIds: [],
    roles: {},
    joined: false,
    resources: [],
  ),
  Group(
    id: 'ph',
    name: 'Physics 101 Help',
    initials: 'PH',
    color: Palette.live,
    course: 'Open questions',
    description: 'Ask anything about PHY111.',
    memberIds: ['mahin'],
    roles: {},
    joined: false,
    resources: [],
  ),
];

Group? groupById(String? id) {
  for (final g in groups) {
    if (g.id == id) return g;
  }
  return null;
}

/// Days are in the week of Mon Oct 26 2026 (26–31, then Nov 1).
const events = <StudyEvent>[
  StudyEvent(
    id: 'e1',
    title: 'DP problem set review',
    groupId: 'ac',
    day: 26,
    start: '7:00 PM',
    end: '8:30 PM',
    where: 'Online',
    goingIds: ['farhan', 'tanvir', 'rafia', 'mahin', 'me'],
  ),
  StudyEvent(
    id: 'e2',
    title: 'Late-night Calc II grind',
    groupId: 'c2',
    day: 26,
    start: '9:00 PM',
    end: '10:00 PM',
    where: 'Library',
    goingIds: ['mahin', 'sadia', 'rafia'],
  ),
  StudyEvent(
    id: 'e3',
    title: 'Greedy vs DP drill',
    groupId: 'ac',
    day: 28,
    start: '8:30 PM',
    end: '10:00 PM',
    where: 'Room 3',
    goingIds: ['farhan', 'tanvir', 'rafia', 'mahin'],
  ),
  StudyEvent(
    id: 'e4',
    title: 'Normalization quiz prep',
    groupId: 'db',
    day: 29,
    start: '5:00 PM',
    end: '6:00 PM',
    where: 'Online',
    goingIds: ['sadia', 'rafia', 'mahin'],
  ),
];

const jobs = <Job>[
  Job(
    id: 'kl-frontend',
    title: 'Frontend Intern (React)',
    company: 'Kothay Labs',
    initials: 'KL',
    color: Palette.chat,
    place: 'Dhaka · Hybrid',
    tags: ['Internship', '3 months', 'React'],
    pay: 'BDT 25k / month',
    deadline: 'Oct 28',
    closesSoon: true,
    posted: '5 days ago',
    duration: '3 months',
    about: "Build screens for our partner dashboard. You'll pair with a senior engineer, ship to production weekly, and present a demo at the end.",
    needs: ['Comfort with React components and hooks', 'A project or repo you can walk us through', '3 days a week in the office'],
    skills: ['React', 'JavaScript', 'Git', 'TypeScript'],
  ),
  Job(
    id: 'nh-data',
    title: 'Data Analyst Intern',
    company: 'Nodi Health',
    initials: 'NH',
    color: Palette.live,
    place: 'Remote',
    tags: ['Internship', 'SQL', 'Python'],
    pay: 'BDT 20k / month',
    deadline: 'Nov 12',
    closesSoon: false,
    posted: '2 days ago',
    duration: '4 months',
    about: 'Clean and explore clinic visit data, then turn it into weekly dashboards for the operations team.',
    needs: ['SQL joins and aggregates', 'Python or R for analysis', 'Clear written summaries'],
    skills: ['SQL', 'Python', 'Data structures', 'Excel'],
  ),
  Job(
    id: 'bu-ta',
    title: 'Teaching Assistant, CSE110',
    company: 'BRAC University',
    initials: 'BU',
    color: Palette.focus,
    place: 'On campus',
    tags: ['Part-time', '10 h/week'],
    pay: 'BDT 8k / month',
    deadline: 'Nov 20',
    closesSoon: false,
    posted: '1 week ago',
    duration: 'One semester',
    about: 'Run two lab sections a week and hold office hours for intro programming students.',
    needs: ['A in CSE110 or equivalent', 'Patience explaining basics', 'Available Sun & Tue afternoons'],
    skills: ['Python', 'Algorithms', 'Teaching'],
  ),
];

const notifications = <AppNotification>[
  AppNotification(
    id: 'n1',
    kind: NotificationKind.match,
    actor: 'Sadia Hossain',
    body: 'wants to be study partners. 88% match on Databases and ML.',
    time: '12 min ago',
    unread: true,
    refId: 'sadia',
  ),
  AppNotification(
    id: 'n2',
    kind: NotificationKind.message,
    actor: 'Tanvir Ahmed',
    body: '“Library room 3 at 7? Bringing the DP notes.”',
    time: '38 min ago',
    unread: true,
    refId: 'tanvir',
  ),
  AppNotification(
    id: 'n3',
    kind: NotificationKind.event,
    actor: 'DP problem set review',
    body: 'starts at 7:00 PM in Algorithms Circle.',
    time: '1 h ago',
    unread: true,
  ),
  AppNotification(
    id: 'n4',
    kind: NotificationKind.job,
    body: 'Your application to Frontend Intern · Kothay Labs was viewed.',
    time: '3 h ago',
    unread: true,
    refId: 'kl-frontend',
  ),
  AppNotification(
    id: 'n5',
    kind: NotificationKind.resource,
    actor: 'Farhan',
    body: 'added “Graph algorithms cheatsheet.pdf” to Algorithms Circle.',
    time: 'Yesterday',
    unread: false,
  ),
  AppNotification(id: 'n6', kind: NotificationKind.call, body: 'Missed voice call from Mahin Karim.', time: 'Yesterday', unread: false, refId: 'mahin'),
];

class PeriodStats {
  const PeriodStats(this.hours, this.sessions, this.streak, this.attendance);
  final String hours;
  final int sessions;
  final String streak;
  final String attendance;
}

abstract final class Stats {
  static const todayMinutes = 75;
  static const goalMinutes = 120;
  static const sessionsToday = 3;
  static const streakDays = 7;
  static const level = 7;
  static const levelTitle = 'Scholar';
  static const levelProgress = 0.64;
  static const toNextLevel = '4h 30m';
  static const periods = {
    'week': PeriodStats('11h 20m', 27, '8 days', '90%'),
    'month': PeriodStats('38h 05m', 94, '8 days', '86%'),
    'all': PeriodStats('46h 10m', 112, 'Best 14 days', '84%'),
  };
  static const dailyHours = [1.5, 2.2, 0.8, 2.5, 1.9, 1.1, 1.3];

  /// Last 28 days, 0–4 on the heat scale.
  static const heat = [0, 1, 2, 2, 0, 3, 1, 2, 4, 3, 0, 1, 2, 3, 0, 2, 3, 4, 2, 1, 0, 3, 2, 4, 3, 2, 1, 3];
  static const profilePartners = 12;
  static const profileFocusedHours = 46;
}
