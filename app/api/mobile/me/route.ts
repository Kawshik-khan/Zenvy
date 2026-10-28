import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { fail, handle, ok, readJson, requireUserId } from "@/lib/mobile/http";
import { listConnections, personSummary } from "@/lib/mobile/people";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function loadMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true, _count: { select: { groupMemberships: true } } },
  });
  if (!user) return null;
  const partners = await listConnections(userId);
  const summary = personSummary(user);
  return {
    ...summary,
    email: user.email,
    matchingAvailable: user.profile?.matchingAvailable ?? true,
    // The web onboarding asks for major and interests; the app shows its setup screens until both are set.
    onboarded: Boolean(summary.major && summary.interests.length),
    counts: { partners: partners.length, groups: user._count.groupMemberships },
  };
}

export async function GET() {
  return handle(async () => {
    const me = await loadMe(await requireUserId());
    return me ? ok({ me }) : fail("Account not found", 401);
  });
}

const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();

const patchSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(80).optional(),
  college: optionalText(100),
  major: optionalText(100),
  semester: z.number().int().min(1).max(12).nullable().optional(),
  bio: optionalText(500),
  studyStyle: optionalText(60),
  interests: z.array(z.string().trim().min(1).max(50)).max(15).optional(),
  availability: optionalText(200),
  matchingAvailable: z.boolean().optional(),
});

/** Updates any subset of the name and profile fields. */
export async function PATCH(request: Request) {
  return handle(async () => {
    const userId = await requireUserId();
    const parsed = patchSchema.safeParse(await readJson(request));
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid profile", 400);
    const { name, interests, ...rest } = parsed.data;

    const profile = Object.fromEntries(
      Object.entries({ ...rest, ...(interests ? { interests: interests.join(", ") } : {}) }).filter(([, value]) => value !== undefined),
    );
    // Empty strings clear a field, like the web form.
    for (const key of Object.keys(profile)) if (profile[key] === "") profile[key] = null;

    await prisma.$transaction([
      ...(name ? [prisma.user.update({ where: { id: userId }, data: { name } })] : []),
      prisma.profile.upsert({ where: { userId }, update: profile, create: { userId, ...profile } }),
    ]);

    return ok({ me: await loadMe(userId) });
  });
}
