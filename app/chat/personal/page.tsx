import React from 'react';
export const runtime = 'nodejs';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import PersonalChatClient from './PersonalChatClient';

export default async function PersonalInboxPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; name?: string; avatar?: string; major?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.email) redirect('/login');

  const resolvedParams = await searchParams;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { profile: true },
  });

  if (!user) redirect('/login');

  const targetUser = {
    id: resolvedParams.id,
    name: resolvedParams.name || 'Anonymous',
    avatar: resolvedParams.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(resolvedParams.name || "U")}&background=random`,
    major: resolvedParams.major || 'Scholar',
  };

  return <PersonalChatClient currentUser={user} targetUser={targetUser} />;
}
