import React from 'react';
export const runtime = 'nodejs';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Sidebar from '@/app/components/Sidebar';
import GroupChatClient from './GroupChatClient';

export default async function GroupChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.email) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { profile: true },
  });

  if (!user) return redirect('/login');

  const group = await prisma.studyGroup.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      },
      admin: { select: { id: true, name: true } },
    },
  });

  if (!group) redirect('/groups');

  const isMember = group.members.some((m) => m.userId === user.id);

  const groupInfo = {
    id: group.id,
    name: group.name,
    subject: group.subject,
    description: group.description,
    adminId: group.adminId,
  };

  const membersData = group.members.map((m) => ({
    id: m.user.id,
    name: m.user.name || 'Anonymous',
    image: m.user.image,
    role: m.role,
  }));

  return (
    <div className="bg-background text-on-surface antialiased overflow-hidden flex h-screen">
      <Sidebar />
      <GroupChatClient
        user={user}
        group={groupInfo}
        members={membersData}
        isMember={isMember}
      />
    </div>
  );
}
