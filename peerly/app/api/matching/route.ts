import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { profile: true }
    });

    if (!currentUser?.profile || !currentUser.id) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const { college, major, interests, semester } = currentUser.profile;
    const userInterests = interests ? interests.split(',').map((i: string) => i.trim().toLowerCase()) : [];

    // Fetch potential matches (other users with profiles)
    const potentialMatches = await prisma.profile.findMany({
      where: {
        userId: { not: currentUser.id },
        matchingAvailable: true
      },
      include: { user: { select: { name: true, image: true } } }
    });

    const matches = potentialMatches.map((otherProfile: any) => {
      let score = 0;

      // 1. Major Match (40%)
      if (otherProfile.major === major) score += 40;

      // 2. College Match (40%)
      if (otherProfile.college === college) score += 40;

      // 3. Interest Overlap (20%)
      if (otherProfile.interests) {
        const otherInterests = otherProfile.interests.split(',').map((i: string) => i.trim().toLowerCase());
        const overlapping = userInterests.filter((i: string) => otherInterests.includes(i));
        score += Math.min(overlapping.length * 5, 20);
      }

      // 4. Semester proximity bonus
      if (semester && otherProfile.semester && Math.abs(semester - otherProfile.semester) <= 1) {
        score += 5;
      }

      return {
        id: otherProfile.id,
        name: otherProfile.user.name || 'Anonymous Student',
        major: otherProfile.major || 'Unknown Major',
        compatibility: Math.min(score, 100),
        image: otherProfile.profileImage || null
      };
    });

    // Sort by compatibility
    matches.sort((a: any, b: any) => b.compatibility - a.compatibility);

    return NextResponse.json(matches.slice(0, 10));
  } catch (error) {
    console.error('Matching Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
