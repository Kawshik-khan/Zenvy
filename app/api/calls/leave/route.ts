import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { roomId } = await req.json();
    const userId = session.user.id;

    if (!roomId) {
      return NextResponse.json({ error: 'Missing roomId' }, { status: 400 });
    }

    const callSession = await prisma.callSession.findUnique({
      where: { roomId }
    });

    if (!callSession) {
      return NextResponse.json({ success: true }, { status: 200 }); // Nothing to do
    }

    // Update participant to show they left
    try {
      await prisma.callParticipant.update({
        where: { callId_userId: { callId: callSession.id, userId } },
        data: { leftAt: new Date() }
      });
    } catch (e) {
      // Ignore if not found
    }

    // Check if there are any active participants left
    const activeParticipants = await prisma.callParticipant.count({
      where: {
        callId: callSession.id,
        leftAt: null
      }
    });

    if (activeParticipants === 0) {
      await prisma.callSession.update({
        where: { id: callSession.id },
        data: { status: 'ENDED' }
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error leaving call:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
