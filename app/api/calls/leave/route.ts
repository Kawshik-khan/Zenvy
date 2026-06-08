import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { assertCanAccessCall } from '@/lib/calls';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { callId, roomId } = await req.json();
    const userId = session.user.id;

    if (!callId && !roomId) {
      return NextResponse.json({ error: 'Missing callId' }, { status: 400 });
    }

    const callSession = callId
      ? await assertCanAccessCall(userId, callId)
      : await prisma.callSession.findUnique({ where: { roomId } });

    if (!callSession) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (!callId) {
      await assertCanAccessCall(userId, callSession.id);
    }

    try {
      await prisma.callParticipant.update({
        where: { callId_userId: { callId: callSession.id, userId } },
        data: {
          leftAt: new Date(),
          lastSeenAt: new Date(),
          status: 'LEFT',
          audioEnabled: false,
          videoEnabled: false,
          screenSharing: false,
        }
      });
    } catch (e) {
      // Ignore if not found
    }

    const activeParticipants = await prisma.callParticipant.count({
      where: {
        callId: callSession.id,
        leftAt: null
      }
    });

    if (activeParticipants === 0) {
      await prisma.callSession.update({
        where: { id: callSession.id },
        data: { status: 'ENDED', endedAt: new Date() }
      });
    }

    return NextResponse.json({ success: true, ended: activeParticipants === 0 }, { status: 200 });
  } catch (error) {
    console.error('Error leaving call:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}
