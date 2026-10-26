import { prisma } from "@/lib/prisma";

/** The signed-in user as the mobile app sees it: account plus the profile fields it shows. */
export async function getMobileUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      uniqueId: true,
      profile: { select: { major: true, college: true, semester: true, bio: true, interests: true, studyStyle: true, availability: true, matchingAvailable: true, profileImage: true } },
    },
  });
  return user;
}
