import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { invalidateStudyMetrics } from '@/lib/cache';
import { parseRoomMessageInput, roomMessageJson } from '@/lib/room-messages';
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

/**
 * Saves a channel message. The web and mobile apps both send this way, so messages persist even when
 * the socket server is down; the web app then asks the socket server to broadcast the saved row.
 * Body: { channelId, content, fileUrl?, fileType?, fileName? }.
 */
export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const input = parseRoomMessageInput('channel', await request.json().catch(() => null));
  if (!input.ok) {
    return NextResponse.json({ error: input.error }, { status: 400 });
  }

  const membership = await prisma.channelMember.findUnique({
    where: { channelId_userId: { channelId: input.roomId, userId } },
    select: { id: true },
  });
  if (!membership) {
    return NextResponse.json({ error: 'You must be a member to send messages' }, { status: 403 });
  }

  const message = await prisma.channelMessage.create({
    data: { content: input.content, ...input.file, channelId: input.roomId, senderId: userId },
    include: { sender: { select: { name: true, image: true } } },
  });
  await invalidateStudyMetrics(userId);

  return NextResponse.json({ message: roomMessageJson(message, userId) }, { status: 201 });
}
