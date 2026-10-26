import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { invalidateStudyMetrics } from '@/lib/cache';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const channelId = searchParams.get('channelId');

  if (!channelId) {
    return NextResponse.json({ error: 'Missing channelId' }, { status: 400 });
  }

  // Verify user is a member of this channel
  const membership = await prisma.channelMember.findUnique({
    where: {
      channelId_userId: { channelId, userId: session.user.id },
    },
  });

  if (!membership) {
    return NextResponse.json({ error: 'Not a member of this channel' }, { status: 403 });
  }

  try {
    // Newest 100, shown oldest first.
    const messages = (await prisma.channelMessage.findMany({
      where: { channelId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        sender: {
          select: { name: true, image: true, id: true },
        },
      },
    })).reverse();

    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      senderId: msg.senderId,
      senderName: msg.sender?.name || 'Anonymous',
      senderImage: msg.sender?.image || null,
      content: msg.content,
      fileUrl: msg.fileUrl || null,
      fileType: msg.fileType || null,
      fileName: msg.fileName || null,
      timestamp: msg.createdAt,
      isSelf: msg.senderId === session.user!.id,
    }));

    return NextResponse.json({ messages: formattedMessages });
  } catch (error) {
    console.error('Error fetching channel messages:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/** Sends a channel message over HTTP (the mobile app). Body: { channelId, content }. */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const channelId = typeof body?.channelId === 'string' ? body.channelId : '';
  const content = typeof body?.content === 'string' ? body.content.trim() : '';
  if (!channelId || !content) {
    return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
  }
  if (content.length > 4000) {
    return NextResponse.json({ error: 'Messages can be up to 4000 characters' }, { status: 400 });
  }

  const membership = await prisma.channelMember.findUnique({
    where: { channelId_userId: { channelId, userId: session.user.id } },
  });
  if (!membership) {
    return NextResponse.json({ error: 'Not a member of this channel' }, { status: 403 });
  }

  const message = await prisma.channelMessage.create({
    data: { content, channelId, senderId: session.user.id },
    include: { sender: { select: { name: true, image: true } } },
  });
  await invalidateStudyMetrics(session.user.id);

  return NextResponse.json({
    message: {
      id: message.id,
      senderId: message.senderId,
      senderName: message.sender.name || 'Anonymous',
      senderImage: message.sender.image,
      content: message.content,
      fileUrl: null,
      fileType: null,
      fileName: null,
      timestamp: message.createdAt,
      isSelf: true,
    },
  });
}
