// Seeds deterministic users for Playwright end-to-end tests.
// Usage: DATABASE_URL=postgresql://... node scripts/seed-e2e.mjs
// Refuses to run against non-local databases unless ALLOW_E2E_SEED=true.
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

export const E2E_PASSWORD = "Zenvy-e2e-password-1";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "postgres"]);

function assertSafeDatabase() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const host = new URL(url).hostname;
  if (!LOCAL_HOSTS.has(host) && process.env.ALLOW_E2E_SEED !== "true") {
    throw new Error(`Refusing to seed e2e data into non-local database host "${host}". Set ALLOW_E2E_SEED=true to override.`);
  }
}

const users = [
  {
    email: "e2e.student@zenvy.test",
    name: "E2E Student",
    uniqueId: "e2e_student",
    profile: { college: "Zenvy University", major: "Computer Science", semester: 5, interests: "graphs, react", availability: "evenings", bio: "Seeded for end-to-end tests." },
  },
  {
    email: "e2e.partner@zenvy.test",
    name: "E2E Partner",
    uniqueId: "e2e_partner",
    profile: { college: "Zenvy University", major: "Computer Science", semester: 4, interests: "graphs, algorithms", availability: "evenings", bio: "Seeded study partner." },
  },
  {
    // Already matched with the student, so messaging screens have someone to talk to.
    email: "e2e.mate@zenvy.test",
    name: "E2E Mate",
    uniqueId: "e2e_mate",
    profile: { college: "Zenvy University", major: "Mathematics", semester: 5, interests: "proofs, calculus", availability: "mornings", bio: "Seeded accepted match." },
  },
  {
    // Empty profile: used by the onboarding test. The profile is reset on every seed run.
    email: "e2e.newbie@zenvy.test",
    name: "E2E Newbie",
    uniqueId: "e2e_newbie",
    profile: { college: null, major: null, semester: null, interests: null, availability: null, bio: null, studyStyle: null, matchingAvailable: true },
  },
];

async function main() {
  assertSafeDatabase();
  const prisma = new PrismaClient();
  const password = await bcrypt.hash(E2E_PASSWORD, 10);

  try {
    for (const { profile, ...user } of users) {
      const saved = await prisma.user.upsert({
        where: { email: user.email },
        update: { name: user.name, password, emailVerified: new Date(), failedLoginAttempts: 0, lockedUntil: null },
        create: { ...user, password, emailVerified: new Date() },
      });
      await prisma.profile.upsert({
        where: { userId: saved.id },
        update: profile,
        create: { ...profile, userId: saved.id },
      });
      console.log(`Seeded ${user.email}`);
    }

    // Start every run from a clean slate: drop data that earlier test runs created.
    const e2eUsers = await prisma.user.findMany({ where: { email: { in: users.map((user) => user.email) } }, select: { id: true, profile: { select: { id: true } } } });
    const userIds = e2eUsers.map((user) => user.id);
    const profileIds = e2eUsers.map((user) => user.profile?.id).filter(Boolean);
    await prisma.match.deleteMany({ where: { OR: [{ profileId: { in: profileIds } }, { matchedProfileId: { in: profileIds } }] } });
    await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.studyAd.deleteMany({ where: { userId: { in: userIds } } });
    console.log("Cleared matches, notifications and study ads for e2e users");

    // Fixtures for the messaging screens: one accepted match, one study group, one channel.
    const byEmail = Object.fromEntries(
      (await prisma.user.findMany({ where: { email: { in: users.map((user) => user.email) } }, select: { id: true, email: true, profile: { select: { id: true } } } })).map((user) => [user.email, user]),
    );
    const student = byEmail["e2e.student@zenvy.test"];
    const mate = byEmail["e2e.mate@zenvy.test"];
    await prisma.match.create({
      data: { profileId: student.profile.id, matchedProfileId: mate.profile.id, status: "ACCEPTED", compatibility: 80 },
    });

    await prisma.studyGroup.deleteMany({ where: { name: "E2E Study Circle" } });
    await prisma.studyGroup.create({
      data: {
        name: "E2E Study Circle",
        subject: "Algorithms",
        description: "Seeded group for end-to-end tests.",
        adminId: student.id,
        members: { create: [{ userId: student.id, role: "ADMIN" }, { userId: mate.id, role: "MEMBER" }] },
      },
    });

    await prisma.channel.deleteMany({ where: { tag: "e2e-algorithms" } });
    await prisma.channel.create({
      data: {
        name: "E2E Algorithms",
        tag: "e2e-algorithms",
        description: "Seeded channel for end-to-end tests.",
        creatorId: student.id,
        members: { create: [{ userId: student.id, role: "CREATOR" }, { userId: mate.id, role: "MEMBER" }] },
      },
    });
    console.log("Seeded accepted match, study group and channel");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
