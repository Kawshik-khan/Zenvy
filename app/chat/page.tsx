import React from 'react';
export const runtime = 'nodejs';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ChatClient from './ChatClient';

export default async function ChatPage() {
  const session = await auth();
  if (!session?.user?.email) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { profile: true },
  });

  if (!user) redirect('/login');

  // Fetch groups where user is a member
  const userGroups = await prisma.studyGroup.findMany({
    where: {
      members: { some: { userId: user.id } }
    },
    take: 10
  });

  const acceptedMatches = user.profile
    ? await prisma.match.findMany({
        where: {
          status: "ACCEPTED",
          OR: [
            { profileId: user.profile.id },
            { matchedProfileId: user.profile.id },
          ],
        },
        include: {
          profile: { include: { user: { include: { profile: true } } } },
          matchedProfile: { include: { user: { include: { profile: true } } } },
        },
        take: 12,
      })
    : [];

  const partners = acceptedMatches.map((match) => {
    const other = match.profileId === user.profile?.id ? match.matchedProfile.user : match.profile.user;
    return {
      id: other.id,
      name: other.name || "Anonymous",
      avatar: other.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(other.name || "U")}&background=random`,
      major: other.profile?.major || "Student"
    };
  });

  return <ChatClient user={user} groups={userGroups} partners={partners} />;
}
