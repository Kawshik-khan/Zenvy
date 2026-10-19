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
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
