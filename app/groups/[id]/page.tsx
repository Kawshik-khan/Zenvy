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
      invites: {
        where: { status: "PENDING" },
        include: { invitee: { select: { id: true, name: true, email: true, image: true } } },
        orderBy: { createdAt: "desc" },
      },
      resources: {
        include: { creator: { select: { id: true, name: true, image: true } } },
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      },
    },
  });

  if (!group) redirect('/groups');

  const isMember = group.members.some((m) => m.userId === user.id);
  const isAdmin = group.adminId === user.id || group.members.some((m) => m.userId === user.id && m.role === "ADMIN");

  if (!isMember) redirect('/groups');

  const memberIds = group.members.map((m) => m.userId);
  const pendingInviteeIds = group.invites.map((invite) => invite.inviteeId);
  const inviteCandidates = isAdmin
    ? await prisma.user.findMany({
        where: {
          id: { notIn: [...memberIds, ...pendingInviteeIds, user.id] },
        },
        select: { id: true, name: true, email: true, image: true, profile: { select: { major: true } } },
        orderBy: { name: "asc" },
        take: 50,
      })
    : [];

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

  const resourcesData = group.resources.map((resource) => ({
    id: resource.id,
    title: resource.title,
    description: resource.description,
    resourceType: resource.resourceType,
    url: resource.url,
    fileName: resource.fileName,
    fileType: resource.fileType,
    pinned: resource.pinned,
    createdAt: resource.createdAt.toISOString(),
    creatorName: resource.creator.name || "Unknown",
  }));

  const pendingInvitesData = group.invites.map((invite) => ({
    id: invite.id,
    inviteeName: invite.invitee.name || invite.invitee.email || "Unknown",
    inviteeImage: invite.invitee.image,
    createdAt: invite.createdAt.toISOString(),
  }));

  const inviteCandidatesData = inviteCandidates.map((candidate) => ({
    id: candidate.id,
    name: candidate.name || candidate.email || "Unknown",
    email: candidate.email,
    image: candidate.image,
    major: candidate.profile?.major,
  }));

  return (
    <div className="app-aurora selection:bg-primary/30 antialiased overflow-hidden flex h-dvh">
      <Sidebar />
      <GroupChatClient
        user={user}
        group={groupInfo}
        members={membersData}
        isMember={isMember}
        isAdmin={isAdmin}
        resources={resourcesData}
        pendingInvites={pendingInvitesData}
        inviteCandidates={inviteCandidatesData}
      />
    </div>
  );
}
