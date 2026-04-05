import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { roomId, roomType } = await req.json();
    const userId = session.user.id;

    if (!roomId) {
      return NextResponse.json({ error: 'Missing roomId' }, { status: 400 });
    }

    // 1. Check permissions
    if (roomId !== 'lobby') {
      if (roomType === 'group') {
        const membership = await prisma.groupMember.findUnique({
          where: { groupId_userId: { groupId: roomId, userId: userId } }
        });
        if (!membership) {
          return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 });
        }
      } else if (roomType === 'channel') {
        const membership = await prisma.channelMember.findUnique({
          where: { channelId_userId: { channelId: roomId, userId: userId } }
        });
        if (!membership) {
          return NextResponse.json({ error: 'Not a member of this channel' }, { status: 403 });
        }
      } else {
        return NextResponse.json({ error: 'Invalid roomType' }, { status: 400 });
      }
    }

    // 2. Upsert Call Session
    let callSession = await prisma.callSession.findUnique({
      where: { roomId }
    });

    if (!callSession) {
      callSession = await prisma.callSession.create({
        data: { roomId, status: 'ACTIVE' }
      });
    } else if (callSession.status === 'ENDED') {
      callSession = await prisma.callSession.update({
        where: { id: callSession.id },
        data: { status: 'ACTIVE' }
      });
    }

    // 3. Upsert Call Participant
    await prisma.callParticipant.upsert({
      where: {
        callId_userId: { callId: callSession.id, userId }
      },
      update: { leftAt: null, joinedAt: new Date() },
      create: { callId: callSession.id, userId }
    });

    return NextResponse.json({ success: true, callSession }, { status: 200 });
  } catch (error) {
    console.error('Error joining call:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
