import React from 'react';
export const runtime = 'nodejs';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import PersonalChatClient from './PersonalChatClient';

export default async function PersonalInboxPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.email) redirect('/login');

  const resolvedParams = await searchParams;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { profile: true },
  });

  if (!user) redirect('/login');
  if (!resolvedParams.id) redirect('/chat');

  const targetDbUser = await prisma.user.findUnique({
    where: { id: resolvedParams.id },
    include: { profile: true }
  });

  const targetUser = {
    id: resolvedParams.id,
    name: targetDbUser?.name || 'Anonymous',
    avatar: targetDbUser?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(targetDbUser?.name || "U")}&background=random`,
    major: targetDbUser?.profile?.major || 'Scholar',
  };

  return <PersonalChatClient currentUser={user} targetUser={targetUser} />;
}
