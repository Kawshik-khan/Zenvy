import React from 'react';
export const runtime = 'nodejs';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Sidebar from '@/app/components/Sidebar';
import ChannelChatClient from './ChannelChatClient';

export default async function ChannelChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.email) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { profile: true },
  });

  if (!user) return redirect('/login');

  const channel = await prisma.channel.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      },
      creator: { select: { id: true, name: true } },
    },
  });

  if (!channel) redirect('/channels');

  const isMember = channel.members.some((m) => m.userId === user.id);

  const channelInfo = {
    id: channel.id,
    name: channel.name,
    tag: channel.tag,
    description: channel.description,
    creatorId: channel.creatorId,
  };

  const membersData = channel.members.map((m) => ({
    id: m.user.id,
    name: m.user.name || 'Anonymous',
    image: m.user.image,
    role: m.role,
  }));

  return (
    <div className="bg-background text-on-surface antialiased overflow-hidden flex h-screen">
      <Sidebar />
      <ChannelChatClient
        user={user}
        channel={channelInfo}
        members={membersData}
        isMember={isMember}
      />
    </div>
  );
}
