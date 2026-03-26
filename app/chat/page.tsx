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

  // Fetch some "partners" (other users) for DM list
  const otherUsers = await prisma.user.findMany({
    where: { NOT: { id: user.id } },
    include: { profile: true },
    take: 5
  });

  const partners = otherUsers.map(u => ({
    id: u.id,
    name: u.name || "Anonymous",
    avatar: u.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || "U")}&background=random`,
    major: u.profile?.major || "Student"
  }));

  return <ChatClient user={user} groups={userGroups} partners={partners} />;
}
