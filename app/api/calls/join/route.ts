import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { assertCanAccessCall, getCallWithParticipants, serializeCall } from '@/lib/calls';

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
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    await assertCanAccessCall(userId, callSession.id);

    await prisma.callParticipant.upsert({
      where: {
        callId_userId: { callId: callSession.id, userId }
      },
      update: {
        leftAt: null,
        joinedAt: new Date(),
        lastSeenAt: new Date(),
        status: 'JOINED',
      },
      create: {
        callId: callSession.id,
        userId,
        role: callSession.startedById === userId ? 'HOST' : 'MEMBER',
        status: 'JOINED',
        videoEnabled: callSession.mediaType === 'VIDEO',
      }
    });

    const updated = await getCallWithParticipants(callSession.id);
    return NextResponse.json({ success: true, call: serializeCall(updated) }, { status: 200 });
  } catch (error) {
    console.error('Error joining call:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}
