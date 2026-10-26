import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { invalidateStudyMetrics } from '@/lib/cache';
import { parseRoomMessageInput, roomMessageJson } from '@/lib/room-messages';

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
 * Saves a group message. The web and mobile apps both send this way, so messages persist even when
 * the socket server is down; the web app then asks the socket server to broadcast the saved row.
 * Body: { groupId, content, fileUrl?, fileType?, fileName? }.
 */
export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const input = parseRoomMessageInput('group', await request.json().catch(() => null));
  if (!input.ok) {
    return NextResponse.json({ error: input.error }, { status: 400 });
  }

  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: input.roomId, userId } },
    select: { id: true },
  });
  if (!membership) {
    return NextResponse.json({ error: 'You must be a member to send messages' }, { status: 403 });
  }

  const message = await prisma.groupMessage.create({
    data: { content: input.content, ...input.file, groupId: input.roomId, senderId: userId },
    include: { sender: { select: { name: true, image: true } } },
  });
  await invalidateStudyMetrics(userId);

  return NextResponse.json({ message: roomMessageJson(message, userId) }, { status: 201 });
}
