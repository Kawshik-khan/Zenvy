import { NextResponse } from 'next/server';
import { auth } from '@/auth';
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
    const messages = await prisma.channelMessage.findMany({
      where: { channelId },
      orderBy: { createdAt: 'asc' },
      take: 100,
      include: {
        sender: {
          select: { name: true, image: true, id: true },
        },
      },
    });

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
