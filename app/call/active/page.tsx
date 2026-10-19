import React from 'react';
export const runtime = 'nodejs';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import UnifiedCallClient from './UnifiedCallClient';
import { assertCanAccessConversation } from '@/lib/conversations';

export default async function ActiveCallPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; id?: string; callId?: string; media?: string }>;
}) {
  const { type, id, callId, media } = await searchParams;
  const session = await auth();
  if (!session?.user?.email) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) return redirect('/login');

  if (!callId && (!id || !type)) {
    redirect('/chat');
  }

  let title = 'Call';
  let avatar = '';
  let scope: { type: 'dm' | 'group' | 'channel'; id: string } | undefined;
  let resolvedMediaType: 'AUDIO' | 'VIDEO' = media === 'video' ? 'VIDEO' : 'AUDIO';

  if (callId) {
    const call = await prisma.callSession.findUnique({
      where: { id: callId },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true, image: true } } },
        },
      },
    });
    if (!call) redirect('/chat');
    resolvedMediaType = call.mediaType === 'VIDEO' ? 'VIDEO' : 'AUDIO';

    if (call.type === 'DM' && call.conversationId) {
      try {
        await assertCanAccessConversation(user.id, call.conversationId);
      } catch {
        redirect('/chat');
      }
      const peer = call.participants.find((participant) => participant.userId !== user.id)?.user;
      title = peer?.name || 'Direct Call';
      avatar = peer?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=random`;
      scope = { type: 'dm', id: call.conversationId };
    } else if (call.type === 'GROUP' && call.groupId) {
      const group = await prisma.studyGroup.findUnique({ where: { id: call.groupId } });
      title = group?.name || 'Group Call';
      avatar = group?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=random`;
      scope = { type: 'group', id: call.groupId };
    } else if (call.type === 'CHANNEL' && call.channelId) {
      const channel = await prisma.channel.findUnique({ where: { id: call.channelId } });
      title = channel?.name || 'Channel Call';
      avatar = channel?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=random`;
      scope = { type: 'channel', id: call.channelId };
    }
  } else if (type === 'dm' && id) {
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true, image: true } } },
        },
      },
    });
    if (!conversation || !conversation.participants.some((participant) => participant.userId === user.id)) {
      redirect('/chat');
    }
    try {
      await assertCanAccessConversation(user.id, id);
    } catch {
      redirect('/chat');
    }
    const peer = conversation.participants.find((participant) => participant.userId !== user.id)?.user;
    title = peer?.name || 'Direct Call';
    avatar = peer?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=random`;
    scope = { type: 'dm', id };
  } else if (type === 'group' && id) {
    const group = await prisma.studyGroup.findUnique({ where: { id } });
    if (group) {
        title = group.name;
        avatar = group.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(group.name)}&background=random`;
        scope = { type: 'group', id };
    }
  } else if (type === 'channel' && id) {
    const channel = await prisma.channel.findUnique({ where: { id } });
    if (channel) {
        title = channel.name;
        avatar = channel.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(channel.name)}&background=random`;
        scope = { type: 'channel', id };
    }
  }

  const currentUser = {
    id: user.id,
    name: user.name || 'Anonymous',
    image: user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random`
  };

  return (
    <UnifiedCallClient
      currentUser={currentUser}
      initialCallId={callId}
      scope={scope}
      title={title}
      avatar={avatar}
      mediaType={resolvedMediaType}
    />
  );
}
