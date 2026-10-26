// Seeds a small, lively demo dataset for local development and the mobile app:
// six students, partner requests, a DM thread, study groups with chat and resources,
// a channel, upcoming sessions, focus history, a study ad and job posts.
// Usage: DATABASE_URL=postgresql://... node scripts/seed-dev.mjs
// Every account's password is DEV_PASSWORD. Re-running replaces the previous demo data.
// Refuses to run against non-local databases unless ALLOW_DEV_SEED=true.
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

export const DEV_PASSWORD = "Zenvy-dev-1";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "postgres"]);
const DOMAIN = "zenvy.dev";
const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

function assertSafeDatabase() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const host = new URL(url).hostname;
  if (!LOCAL_HOSTS.has(host) && process.env.ALLOW_DEV_SEED !== "true") {
    throw new Error(`Refusing to seed demo data into non-local database host "${host}". Set ALLOW_DEV_SEED=true to override.`);
  }
}

const people = [
  { key: "nadia", name: "Nadia Rahman", major: "Computer Science", semester: 5, studyStyle: "Pair programming", interests: "Algorithms, React, Data structures, UI design", availability: "Evenings", bio: "Prepping for CSE221 and summer internships. I like pair programming and explaining things out loud." },
  { key: "tanvir", name: "Tanvir Ahmed", major: "Computer Science", semester: 5, studyStyle: "Pair programming", interests: "Algorithms, Data structures, React, C++", availability: "Evenings", bio: "Grinding CSE221 and LeetCode before internship season." },
  { key: "sadia", name: "Sadia Hossain", major: "Computer Science", semester: 6, studyStyle: "Exam prep", interests: "Databases, Python, Machine learning", availability: "Afternoons", bio: "Databases TA-in-training. Happy to trade ER diagram reviews for ML help." },
  { key: "mahin", name: "Mahin Karim", major: "Electrical Engineering", semester: 5, studyStyle: "Group discussion", interests: "Calculus, Physics, Circuits", availability: "Late", bio: "Night owl. Calculus II and circuits, mostly." },
  { key: "farhan", name: "Farhan Jamil", major: "Computer Science", semester: 6, studyStyle: "Focused solo work", interests: "Algorithms, Competitive programming", availability: "Evenings", bio: "Codeforces most nights. Ask me about DP." },
  { key: "rafia", name: "Rafia Islam", major: "Computer Science", semester: 5, studyStyle: "Group discussion", interests: "Calculus, UI design, React", availability: "Morning", bio: "Design-minded CS student. I take good notes." },
];

async function main() {
  assertSafeDatabase();
  const prisma = new PrismaClient();
  const password = await bcrypt.hash(DEV_PASSWORD, 10);
  const now = Date.now();

  try {
    // Start clean: deleting the demo users cascades to almost everything they own.
    const old = await prisma.user.findMany({ where: { email: { endsWith: `@${DOMAIN}` } }, select: { id: true } });
    const oldIds = old.map((user) => user.id);
    await prisma.event.deleteMany({ where: { creatorId: { in: oldIds } } });
    await prisma.studyGroup.deleteMany({ where: { adminId: { in: oldIds } } });
    await prisma.channel.deleteMany({ where: { creatorId: { in: oldIds } } });
    const oldProfiles = (await prisma.profile.findMany({ where: { userId: { in: oldIds } }, select: { id: true } })).map((p) => p.id);
    await prisma.match.deleteMany({ where: { OR: [{ profileId: { in: oldProfiles } }, { matchedProfileId: { in: oldProfiles } }] } });
    await prisma.user.deleteMany({ where: { id: { in: oldIds } } });

    const u = {};
    for (const person of people) {
      const user = await prisma.user.create({
        data: {
          name: person.name,
          email: `${person.key}@${DOMAIN}`,
          uniqueId: `${person.key}_dev`,
          password,
          emailVerified: new Date(),
          profile: {
            create: {
              college: "BRAC University",
              major: person.major,
              semester: person.semester,
              studyStyle: person.studyStyle,
              interests: person.interests,
              availability: person.availability,
              bio: person.bio,
            },
          },
        },
        include: { profile: true },
      });
      u[person.key] = user;
    }

    // Partners: Nadia and Tanvir / Farhan are connected; Sadia has asked Nadia; Nadia asked Rafia.
    const match = (from, to, status, note) =>
      prisma.match.create({ data: { profileId: u[from].profile.id, matchedProfileId: u[to].profile.id, status, requestNote: note ?? null } });
    await match("tanvir", "nadia", "ACCEPTED");
    await match("nadia", "farhan", "ACCEPTED");
    const sadiaRequest = await match("sadia", "nadia", "PENDING", "Want to swap ER diagram reviews for ML help?");
    await match("nadia", "rafia", "PENDING");
    await prisma.notification.create({
      data: { userId: u.nadia.id, type: "MATCH_REQUEST", content: "Sadia Hossain sent you a match request with a note.", relatedId: sadiaRequest.id, createdAt: new Date(now - 12 * MIN) },
    });

    // A DM thread with Tanvir.
    const [a, b] = [u.nadia.id, u.tanvir.id].sort();
    const dm = await prisma.conversation.create({
      data: { type: "DM", dmKey: `${a}:${b}`, participants: { create: [{ userId: u.nadia.id, lastReadAt: new Date(now - 30 * MIN) }, { userId: u.tanvir.id, lastReadAt: new Date(now) }] } },
    });
    const thread = [
      ["tanvir", "Did you finish the knapsack variant from the problem set?", 44],
      ["nadia", "Almost. Stuck on the space optimisation. 1D array keeps overwriting.", 41],
      ["tanvir", "Iterate capacity backwards.", 22],
      ["tanvir", "Library room 3 at 7? Bringing the DP notes.", 20],
    ];
    let last;
    for (const [who, content, minsAgo] of thread) {
      last = await prisma.conversationMessage.create({ data: { conversationId: dm.id, senderId: u[who].id, content, createdAt: new Date(now - minsAgo * MIN) } });
    }
    await prisma.conversation.update({ where: { id: dm.id }, data: { lastMessageId: last.id, lastMessageAt: last.createdAt } });

    // Study groups.
    const circle = await prisma.studyGroup.create({
      data: {
        name: "Algorithms Circle",
        subject: "Algorithms",
        description: "Timed problem sets every Tue & Thu. Bring one problem you're stuck on.",
        adminId: u.farhan.id,
        members: {
          create: [
            { userId: u.farhan.id, role: "ADMIN" },
            { userId: u.tanvir.id, role: "MEMBER" },
            { userId: u.rafia.id, role: "MEMBER" },
            { userId: u.nadia.id, role: "MEMBER" },
            { userId: u.mahin.id, role: "MEMBER" },
          ],
        },
        resources: {
          create: [
            { creatorId: u.farhan.id, title: "Graph algorithms cheatsheet", resourceType: "LINK", url: "https://cp-algorithms.com/graph/breadth-first-search.html", pinned: true },
            { creatorId: u.rafia.id, title: "CSE221 past papers (2022–25)", resourceType: "LINK", url: "https://example.com/cse221-papers" },
            { creatorId: u.tanvir.id, title: "Knapsack notes", resourceType: "NOTE", description: "Iterate W backwards for 0/1, forwards for unbounded." },
          ],
        },
      },
    });
    const groupChat = [
      ["farhan", "Pushed the memo table solution for Q4. Runs in O(n·W).", 18],
      ["mahin", "Hey all! Can someone explain why we iterate W backwards?", 9],
      ["nadia", "So each item is used once. Forward lets you reuse it, that's the unbounded version.", 7],
    ];
    for (const [who, content, minsAgo] of groupChat) {
      await prisma.groupMessage.create({ data: { groupId: circle.id, senderId: u[who].id, content, createdAt: new Date(now - minsAgo * MIN) } });
    }
    const dbLab = await prisma.studyGroup.create({
      data: {
        name: "DB Design Lab",
        subject: "Databases",
        description: "ER diagrams, normalization and SQL drills.",
        adminId: u.sadia.id,
        members: { create: [{ userId: u.sadia.id, role: "ADMIN" }, { userId: u.nadia.id }, { userId: u.rafia.id }] },
      },
    });
    await prisma.groupMessage.create({ data: { groupId: dbLab.id, senderId: u.sadia.id, content: "Normalization quiz Thursday. 3NF and BCNF only.", createdAt: new Date(now - 3 * HOUR) } });
    await prisma.studyGroup.create({
      data: { name: "Calculus II Crew", subject: "Calculus", description: "Past papers and integration practice.", adminId: u.mahin.id, members: { create: [{ userId: u.mahin.id, role: "ADMIN" }, { userId: u.rafia.id }] } },
    });
    await prisma.studyGroup.create({
      data: { name: "ML Paper Club", subject: "Machine learning", description: "One paper a week, explained simply.", adminId: u.sadia.id, members: { create: [{ userId: u.sadia.id, role: "ADMIN" }] } },
    });

    // A channel.
    const channel = await prisma.channel.create({
      data: {
        name: "CSE at BRACU",
        tag: "cse-bracu",
        description: "Exam schedules, course tips and internship leads.",
        creatorId: u.farhan.id,
        members: { create: [{ userId: u.farhan.id, role: "CREATOR" }, { userId: u.nadia.id }, { userId: u.tanvir.id }] },
      },
    });
    await prisma.channelMessage.create({ data: { channelId: channel.id, senderId: u.farhan.id, content: "Exam schedule for Fall 26 is up on the portal.", createdAt: new Date(now - 5 * HOUR) } });

    // Upcoming sessions.
    const at = (daysAhead, hour, minute = 0) => {
      const date = new Date(now + daysAhead * DAY);
      date.setUTCHours(hour, minute, 0, 0);
      return date;
    };
    const event = (data, attendees) =>
      prisma.event.create({ data: { ...data, attendees: { create: attendees.map((key) => ({ userId: u[key].id, status: "GOING" })) } } });
    await event({ title: "DP problem set review", startTime: at(1, 13), endTime: at(1, 14, 30), location: "Online", type: "VIRTUAL", groupId: circle.id, creatorId: u.farhan.id }, ["farhan", "tanvir", "rafia", "nadia"]);
    await event({ title: "Greedy vs DP drill", startTime: at(3, 14, 30), endTime: at(3, 16), location: "Library room 3", type: "IN_PERSON", groupId: circle.id, creatorId: u.tanvir.id }, ["tanvir", "farhan"]);
    await event({ title: "Normalization quiz prep", startTime: at(2, 11), endTime: at(2, 12), location: "Online", type: "VIRTUAL", groupId: dbLab.id, creatorId: u.sadia.id }, ["sadia", "rafia"]);

    // Focus history for Nadia over the last two weeks.
    for (let day = 0; day < 14; day++) {
      const sessions = (day * 7) % 4;
      for (let s = 0; s < sessions; s++) {
        const endedAt = new Date(now - day * DAY - s * 40 * MIN - 2 * HOUR);
        await prisma.pomodoroSession.create({
          data: { userId: u.nadia.id, mode: "FOCUS", plannedMinutes: 25, completedMinutes: 25, startedAt: new Date(endedAt.getTime() - 25 * MIN), endedAt, status: "COMPLETED" },
        });
      }
    }

    await prisma.studyAd.create({
      data: { userId: u.tanvir.id, title: "Need 2 people for CSE221 timed sets", subjects: "CSE221 · Algorithms", availability: "Tue & Thu evenings", description: "Timed problem sets, then we review each other's solutions.", mode: "HYBRID" },
    });

    // Jobs (visible when FEATURE_JOBS is on).
    const job = (data) => prisma.jobPost.create({ data: { status: "LIVE", applyMethod: "LINK", ...data } });
    await job({ authorId: u.farhan.id, type: "INTERNSHIP", title: "Frontend Intern (React)", company: "Kothay Labs", location: "Dhaka", workMode: "HYBRID", pay: "BDT 25k / month", description: "Build screens for our partner dashboard. You'll pair with a senior engineer, ship to production weekly, and present a demo at the end.", applyTarget: "https://example.com/jobs/frontend-intern", tags: ["react", "internship", "typescript"], deadline: new Date(now + 2 * DAY) });
    await job({ authorId: u.sadia.id, type: "INTERNSHIP", title: "Data Analyst Intern", company: "Nodi Health", location: "Remote", workMode: "REMOTE", pay: "BDT 20k / month", description: "Clean and explore clinic visit data, then turn it into weekly dashboards.", applyMethod: "EMAIL", applyTarget: "careers@example.com", tags: ["sql", "python"], deadline: new Date(now + 17 * DAY) });
    await job({ authorId: u.farhan.id, type: "PART_TIME", title: "Teaching Assistant, CSE110", company: "BRAC University", location: "Dhaka", workMode: "ONSITE", pay: "BDT 8k / month", description: "Run two lab sections a week and hold office hours for intro programming students.", applyMethod: "MESSAGE", tags: ["python", "teaching"], deadline: new Date(now + 25 * DAY) });

    console.log(`Seeded ${people.length} demo users (password ${DEV_PASSWORD}):`);
    for (const person of people) console.log(`  ${person.key}@${DOMAIN}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
