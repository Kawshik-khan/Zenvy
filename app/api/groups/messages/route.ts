import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { invalidateStudyMetrics } from '@/lib/cache';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get('groupId');

    if (!groupId) {
      return NextResponse.json({ error: 'Missing groupId' }, { status: 400 });
    }

    // Verify membership
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: { groupId, userId: user.id }
      }
    });

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch messages
    // Newest 100, shown oldest first.
    const messages = (await prisma.groupMessage.findMany({
      where: { groupId },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to 100 recent messages for performance
      include: {
        sender: {
          select: { name: true, image: true }
        }
      }
    })).reverse();

    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      senderId: msg.senderId,
      senderName: msg.sender.name || 'Anonymous',
      senderImage: msg.sender.image,
      content: msg.content,
      fileUrl: msg.fileUrl || null,
      fileType: msg.fileType || null,
      fileName: msg.fileName || null,
      timestamp: msg.createdAt,
      isSelf: msg.senderId === user.id
    }));

    return NextResponse.json({ messages: formattedMessages }, { status: 200 });
  } catch (error) {
    console.error('Error fetching group messages:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * Sends a group message over HTTP (the mobile app). The web client sends through the socket
 * server; both write the same GroupMessage rows. Body: { groupId, content }.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const groupId = typeof body?.groupId === 'string' ? body.groupId : '';
  const content = typeof body?.content === 'string' ? body.content.trim() : '';
  if (!groupId || !content) {
    return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
  }
  if (content.length > 4000) {
    return NextResponse.json({ error: 'Messages can be up to 4000 characters' }, { status: 400 });
  }

  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: session.user.id } },
  });
  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const message = await prisma.groupMessage.create({
    data: { content, groupId, senderId: session.user.id },
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
