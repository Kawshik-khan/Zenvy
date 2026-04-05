import React from 'react';
export const runtime = 'nodejs';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import GroupCallClient from './GroupCallClient';

export default async function ActiveCallPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; id?: string }>;
}) {
  const { type, id } = await searchParams;
  const session = await auth();
  if (!session?.user?.email) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) return redirect('/login');

  if (!id || !type) {
    redirect('/chat');
  }

  let title = 'Group Call';
  let avatar = '';

  if (type === 'group') {
    const group = await prisma.studyGroup.findUnique({ where: { id } });
    if (group) {
        title = group.name;
        avatar = group.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(group.name)}&background=random`;
    }
  } else if (type === 'channel') {
    const channel = await prisma.channel.findUnique({ where: { id } });
    if (channel) {
        title = channel.name;
        avatar = channel.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(channel.name)}&background=random`;
    }
  }

  const currentUser = {
    id: user.id,
    name: user.name || 'Anonymous',
    image: user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random`
  };

  return (
    <GroupCallClient 
      currentUser={currentUser} 
      roomId={`${id}`} 
      roomName={title} 
      roomAvatar={avatar} 
      type={type}
    />
  );
}
